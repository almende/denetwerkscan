
/**
 * Angular JS controller to control the page
 * @constructor Ctrl
 */
function Controller($scope, $resource) {
    // redirection
    if (document.location.href.indexOf('/www.') != -1) {
        document.location.href = 'http://denetwerkscan.appspot.com';
    }

    // http://docs.angularjs.org/api/ngResource.$resource
    var Persons = $resource('/persons/:id', {}, {
        'create': {method: 'POST'},
        'update': {method: 'PUT'},
        'find': {method: 'GET', isArray: true}
    });
    var Contacts = $resource('/contacts/');
    var User = $resource('/auth');

    var hash = new Hash();
    $scope.page = hash.getValue('page') || 'intro';   // Available: 'intro', 'form', 'network', 'score'
    $scope.form = hash.getValue('form') || 'privacy'; // Available: 'privacy', 'import', 'self', 'contacts', 'score'

    $scope.domains = [
        'Familie',
        'Vrienden',
        'Collega\'s',
        'Buren',
        'Overig'
    ];

    $scope.frequencies = [
        'Dagelijks',
        'Wekelijks',
        'Elke 2 weken',
        'Maandelijks',
        'Elk kwartaal',
        'Jaarlijks'
    ];

    // current person
    $scope.current = undefined;
    $scope.network = {};
    $scope.contacts = []; // imported contacts

    /**
     * Search persons
     * @param {String} name
     * @param {function} callback. Called after the search is done.
     *                             Will be called as callback(results, error),
     *                             where results is an array containing the
     *                             persons, and each person is an object
     *                             containing id and name.
     */
    $scope.find = function (name, callback) {
        try {
            Persons.find({'name': name, 'limit': 10}, undefined, function (result) {
                callback(result, undefined);
            }, function (err) {
                callback(undefined, err);
            });
        }
        catch (err) {
            callback(undefined, err);
        }
    };

    $scope.$watch('page', function () {
        // set current page in hash
        hash.setValue('page', $scope.page);
    });

    // scroll up when the header is not visible.
    var updateScrollTop = function () {
        // ensure the form title is visible, scroll up when needed
        if (document.body.scrollTop > 270) {
            document.body.scrollTop = 270;
        }
    };

    // store the input form when the page changes
    $scope.$watch('form', function () {
        $scope.save();

        updateScrollTop();

        // set current form page in hash
        hash.setValue('form', $scope.form);
    });
    $scope.$watch('page', function (newPage, oldPage) {
        if (oldPage == 'form') {
            $scope.save();
        }
        else {
            if (newPage == 'form') {
                // check if a form is loaded, if not, load the form of the
                // current user
                if ($scope.isLoggedIn()) {
                    // user is logged in
                    if (!$scope.current) {
                        // there is no current form yet
                        $scope.load($scope.user.email);
                    }
                }
            }
        }

        updateScrollTop();
    });

    /**
     * Load the form of current user and start editing
     */
    $scope.start = function () {
        $scope.page = 'form';
        $scope.form = 'privacy';
        if ($scope.isLoggedIn()) {
            // load current user form
            $scope.load($scope.user.email);
        }
    };

    /**
     * Add a domain
     * @param {Object} person
     * @param {String} domainName
     */
    $scope.addDomain = function (person, domainName) {
        var domains = person.domains;
        if (!domains) {
            domains = [];
            person.domains = domains;
        }
        domains.push({
            'name': domainName
        });
    };

    /**
     * Remove a domain
     * @param {Object} person
     * @param {Object} domain
     */
    $scope.deleteDomain = function (person, domain) {
        if (!confirm('Weet je zeker dat je het deelnetwerk ' + domain.name + ' wilt verwijderen?')) {
            return;
        }

        var domains = person.domains;
        if (!domains) {
            domains = [];
            person.domains = domains;
        }
        var index = domains.indexOf(domain);
        if (index != -1) {
            domains.splice(index, 1);
        }
    };

    /**
     * Get a domain by name
     * @param {Object} person
     * @param {String} domainName
     * @return {Object | undefined} domain
     */
    $scope.getDomain = function(person, domainName) {
        if (person && person.domains) {
            var results = person.domains.filter(function (domain) {
                return (domain.name == domainName);
            });
            return results[0];
        }
        return undefined;
    };

    /**
     * Add a relation
     * @param {Object} domain
     */
    $scope.addRelation = function (domain) {
        var relations = domain.relations;
        if (!relations) {
            relations = [];
            domain.relations = relations;
        }
        relations.push({});
    };

    /**
     * Remove a relation
     * @param {Object} domain
     * @param {Object} relation
     */
    $scope.deleteRelation = function (domain, relation) {
        var relations = domain.relations;
        if (!relations) {
            relations = [];
            domain.relations = relations;
        }
        var index = relations.indexOf(relation);
        if (index != -1) {
            relations.splice(index, 1);
        }
    };

    /**
     * Load a person by id. If not existing, a new form for the current user
     * will be initialized
     * @param {String | undefined} id
     * @param {String} [name]  optional name, for better error messages.
     */
    $scope.load = function (id, name) {
        // first save any changes
        $scope.save();

        // check if there is an id given
        if (id == undefined) {
            $scope.current = {
                name: name
            };
            $scope.page = 'noaccess';
            return;
        }

        $scope.loading = true;
        $scope.error = undefined;
        $scope.current = Persons.get({'id': id}, undefined, function () {
            $scope.loading = false;
            $scope.markUnchanged();
        }, function (err) {
            $scope.loading = false;
            $scope.markUnchanged();

            if (err.status == 404) {
                // person does not yet exist. initialize a new form
                if ($scope.isLoggedIn()) {
                    $scope.current = {
                        id: $scope.user.email,
                        privacyPolicy: 'PUBLIC_FOR_RELATIONS'
                    };
                }
            }
            else {
                $scope.error = 'Laden van gebruiker ' + id + ' is mislukt';
                console.log('Error', err);
            }
        });
    }

    /**
     * Save the current person
     */
    $scope.save = function () {
        if ($scope.current && $scope.current.id) {
            if ($scope.isChanged() && !$scope.readonly) {
                // save when changed
                $scope.markUnchanged();

                var id = $scope.current.id;
                $scope.saving = true;
                $scope.error = undefined;
                $scope.current = Persons.update({'id': id}, $scope.current, function () {
                    $scope.saving = false;
                }, function (err) {
                    $scope.saving = false;
                    $scope.error = 'Opslaan van gebruiker ' + id + ' is mislukt';
                    console.log('Error', err);
                });
            }
        }
    };

    /**
     * Give a dutch description of the given gender
     * @param {String} gender
     * @return {String}
     */
    $scope.describeGender = function (gender) {
        switch (gender) {
            case 'MALE': return 'Man';
            case 'FEMALE': return 'Vrouw';
        }
        return '';
    };

    /**
     * Give a dutch description of a privacy policy
     * @param {String} privacyPolicy
     * @return {String}
     */
    $scope.describePolicy = function (privacyPolicy) {
        switch (privacyPolicy) {
            case 'PRIVATE': return 'Niemand';
            case 'PUBLIC_FOR_RELATIONS': return 'Mijn contacten';
            case 'PUBLIC': return 'Iedereen';
        }
        return '';
    };

    /**
     * Mark the current form as unchanged
     */
    $scope.markUnchanged = function () {
        $scope.currentPrev = JSON.stringify(angular.toJson($scope.current));
    };

    /**
     * Check whether the form contents have changed since the last
     * markUnchanged()
     * @return {Boolean} changed
     */
    $scope.isChanged = function () {
        var currentNow = JSON.stringify(angular.toJson($scope.current));
        return (currentNow != $scope.currentPrev);
    };

    /**
     * cancel editing the current person
     */
    $scope.cancel = function () {
        $scope.current = undefined;
    };

    /**
     * Delete a person by id
     * @param {String} id
     * @param {String} [name]
     */
    $scope.delete = function (id, name) {
        if (id && confirm('Weet je zeker dat je ' + (name || id) +
                ' (' + id + ') wilt verwijderen?')) {
            $scope.deleting = true;
            $scope.error = undefined;
            Persons.delete({'id': id}, undefined, function () {
                $scope.deleting = false;
            }, function (err) {
                $scope.deleting = false;
                $scope.error = 'Verwijderen van gebruiker ' + id + ' is mislukt';
                console.log(err);
            });

            if ($scope.current && $scope.current.id == id) {
                $scope.current = undefined;
            }
        }
    };

    /**
     * load network page
     * @param {String | undefined} id   Id of the user to be loaded
     * @param {String} [name]           optional name of the user
     */
    $scope.loadNetwork = function (id, name) {
        $scope.page = 'network';
        $scope.network.id = undefined;
        $scope.network.name = undefined;
        $scope.network.inq = undefined;
        var container = document.getElementById('network');
        container.style.display = 'none';

        if (!$scope.isLoggedIn()) {
            return;
        }
        if (!id) {
            $scope.network.error = 'U hebt geen toegang om het netwerk van ' +
                (name || 'deze persoon') + ' te bekijken';
            return;
        }

        // retrieve the current user data including its relations
        var params = {
            'id': id,
            'include_relations': true
        };
        $scope.network.Loading = true;
        $scope.network.error = undefined;

        Persons.get(params, undefined, function (person) {
            // load container view
            container.style.display = '';
            loadNetwork(container, person, $scope.domains, $scope.frequencies);

            var rounding = true;
            $scope.network.id = id;
            $scope.network.name = person.name ? person.name + ' (' + person.id + ')' : person.id;
            $scope.network.inq = inq.getScore(person, $scope.frequencies, rounding);
            $scope.network.loading = false;
        },
        function (err) {
            $scope.network.loading = false;
            if (err.status == 404) {
                $scope.error = 'U hebt de test nog niet ingevuld, er geen gegevens gevonden.';
            }
            else {
                $scope.network.error = 'Er is een fout opgetreden bij het ophalen van het netwerk.';
                console.log('Error', err);
            }
        });
    };

    /**
     * Retrieve a user description,
     * for example "Ingelogd als jos@almende.org (administrator)"
     * @return {String} title
     */
    $scope.userTitle = function () {
        var title = 'Ingelogd als ' + $scope.user.email;
        if ($scope.isAdmin()) {
            title += ' (administrator)';
        }
        return title;
    };

    /**
     * Check if the application is ready, after login information is in.
     * @return {boolean} isReady
     */
    $scope.appIsReady = function () {
        return $scope.user && $scope.user.loginUrl;
    };

    /**
     * Check if current user is an admin
     * @return {boolean} isAdmin
     */
    $scope.isAdmin = function () {
        return $scope.user ? $scope.user.isAdmin : false;
    };

    /**
     * Check if current user is logged in
     * @return {boolean} isLoggedIn
     */
    $scope.isLoggedIn = function () {
        return $scope.user ? $scope.user.isLoggedIn : false;
    };

    /**
     * Login
     */
    $scope.login = function () {
        if ($scope.user && $scope.user.loginUrl) {
            document.location.href = $scope.user.loginUrl;
        }
    };

    /**
     * Check whether the currently displayed form is read only, and put this
     * state in the variable readonly
     */
    function updateReadonly() {
        var readonly = true;
        if ($scope.user) {
            if ($scope.user.isAdmin ||
                ($scope.current && $scope.current.id == $scope.user.email)) {
                readonly = false;
            }
        }
        $scope.readonly = readonly;
    }
    $scope.$watch('user.email', updateReadonly);
    $scope.$watch('current.id', updateReadonly);
    updateReadonly();

    // retrieve user info (logged in or not, email, isAdmin)
    $scope.user = User.get();
    $scope.$watch('user.isLoggedIn', function () {
        $scope.search.results = undefined;

        if ($scope.isLoggedIn()) {
            // retrieve imported contacts
            $scope.getContacts();

            // load user after login
            if ($scope.page == 'form' && !$scope.current) {
                $scope.form = hash.getValue('form') || 'privacy';
                $scope.load($scope.user.email);
            }
        }
    });

    /**
     * Get imported contacts
     * @param {function} callback
     */
    $scope.getContacts = function (callback) {
        $scope.contacts = Contacts.query({}, undefined, callback);
    };

    /**
     * Import contacts from a social media
     * @param {String} service   For example 'facebook'
     */
    $scope.importContacts = function (service) {
        $scope.importing = true;
        document.location.href = '/import/?service=' + service;
    };

    /**
     * Delete imported contacts
     * @param {String} service
     */
    $scope.deleteContacts = function (service) {
        $scope.importing = true;
        Contacts.delete({service: service});
        setTimeout(function () {
            $scope.getContacts(function () {
                $scope.importing = false;
            });
            $scope.$apply();
        }, 5000); // give appengine some time to update indexes...
    };

    $scope.cancelImport = function () {
        // TODO: really cancel the action
        $scope.importing = false;
        if (window.stop) {
            window.stop();
        }
    };

    /**
     * count the number of contacts from given service
     * @param {String} service
     */
    $scope.countContacts = function (service) {
        var count = 0;
        for (var i = 0; i < $scope.contacts.length; i++) {
            if ($scope.contacts[i].service == service) {
                count++;
            }
        }
        return count;
    };

    // search parameters
    $scope.search = {
        name: '',
        sequence: 0,  // number of the latest search request
        searching: false,
        results: undefined
    };
    $scope.$watch('search.name', function (name) {
        var sequence = (++$scope.search.sequence);

        if (name) {
            // find by name
            if ($scope.isLoggedIn()) {
                $scope.search.searching = true;
                $scope.search.error = undefined;
                $scope.find(name, function (results, err) {
                    if (sequence == $scope.search.sequence) {
                        // ok, no other searches started while this search was running
                        $scope.search.searching = false;
                        $scope.search.results = results;
                        if (err) {
                            $scope.search.error = 'Argh! Er is iets misgegaan.';
                            console.log(err);
                        }
                    }
                });
            }
            else {
                $scope.search.searching = false;
                $scope.search.results = undefined;
                $scope.search.error = 'Voor u deelnemers kunt zoeken dient u in te loggen';
            }
        }
        else {
            // clear search results
            $scope.search.searching = false;
            $scope.search.results = undefined;
            $scope.search.error = undefined;
        }
    });

    $scope.currentInq = undefined;
    $scope.updateINQ = function (form) {
        if (form == 'score' && $scope.current) {
            var rounding = true;
            $scope.currentInq = inq.getScore($scope.current, $scope.frequencies, rounding);
        }
    };
    $scope.$watch('form', $scope.updateINQ);
    $scope.$watch('current.id', $scope.updateINQ);

    // create the tooltips
    var tooltips = ['frequentie', 'contact', 'deelnetwerk', 'score'];
    tooltips.forEach(function (tooltip) {
        $('#tooltip-' + tooltip).simpletip({
            content: $('#tooltip-text-' + tooltip).html(),
            persistent: true,
            fixed: true,
            offset: [0, 20]
        });
    });
};
