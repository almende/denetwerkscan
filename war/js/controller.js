
/**
 * Angular JS controller to control the page
 * @constructor Ctrl
 */
function Controller($scope, $resource) {
    // http://docs.angularjs.org/api/ngResource.$resource
    var Person = $resource('/persons/:id', {}, {
        'create': {method: 'POST'},
        'update': {method: 'PUT'},
        'find': {method: 'GET', isArray: true}
    });
    var User = $resource('/auth');

    $scope.page = 'intro';       // Available: 'intro', 'form', 'network', 'score'
    $scope.formPage = 'privacy'; // Available: 'privacy', 'import', 'self', 'contacts', 'score'

    $scope.domains = [
        'Familie',
        'Vrienden',
        'Collega\'s',
        'Buren',
        'Overig'
    ];

    $scope.frequencies = [
        'Dagelijks',
        'Weekelijks',
        'Maandelijks',
        'Jaarlijks'
    ];

    // current person
    $scope.current = undefined;

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
            Person.find({'name': name, 'limit': 10}, undefined, function (result) {
                callback(result, undefined);
            }, function (err) {
                callback(undefined, err);
            });
        }
        catch (err) {
            callback(undefined, err);
        }
    };

    // store the input form when the page changes
    $scope.$watch('formPage', function () {
        $scope.save();
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

        if (newPage == 'network') {
            $scope.loadNetwork();
        }
    });

    /**
     * Load the form of current user and start editing
     */
    $scope.start = function () {
        $scope.page = 'form';
        $scope.formPage = 'privacy';
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


        $scope.page = 'form';
        $scope.formPage = 'privacy';
        $scope.loading = true;
        $scope.error = undefined;
        $scope.current = Person.get({'id': id}, undefined, function () {
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
    };

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
                $scope.current = Person.update({'id': id}, $scope.current, function () {
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
            case 'PUBLIC_FOR_RELATIONS': return 'Mijn relaties';
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
            Person.delete({'id': id}, undefined, function () {
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
     */
    $scope.loadNetwork = function () {
        if (!$scope.isLoggedIn()) {
            return;
        }

        // retrieve the current user data including its relations
        var id =  $scope.user.email;
        var params = {
            'id': id,
            'include_relations': true
        };
        $scope.networkLoading = true;
        $scope.networkError = undefined;

        Person.get(params, undefined, function (person) {
            // load container view
            var container = document.getElementById('network');
            loadNetwork(container, person, $scope.domains, $scope.frequencies);
            $scope.networkLoading = false;
        },
        function (err) {
            $scope.networkLoading = false;
            $scope.networkError = 'Er is een fout opgetreden bij het ophalen van het netwerk.';
            console.log('Error', err);
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
    });

    // facebook import
    $scope.facebook = {
        importStatus: undefined,
        startImport: function () {
            importFacebookFriends(function (result) {
                $scope.facebook.importStatus = result.status;
                if (result.friends) {
                    $scope.facebook.friends = result.friends;
                }
                if (result.me) {
                    $scope.facebook.me = result.me;
                    if (!$scope.current.name) {
                        $scope.current.name = result.me.name;
                    }
                    if (!$scope.current.gender && result.me.gender) {
                        $scope.current.gender = result.me.gender.toUpperCase();
                    }
                    if (!$scope.current.age && result.me.birthday) {
                        $scope.current.age = getAge(result.me.birthday);
                    }
                }

                // http://onehungrymind.com/notes-on-angularjs-scope-life-cycle/
                if(!$scope.$$phase) { //this is used to prevent an overlap of scope digestion
                    $scope.$apply(); //this will kickstart angular to recognize the change
                }
            });
        },
        cancelImport: function () {
            $scope.facebook.importStatus = undefined;
        },
        friends: undefined
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
            // clear search results
            $scope.search.searching = false;
            $scope.search.results = undefined;
            $scope.search.error = undefined;
        }
    });

    $scope.currentInq = undefined;
    $scope.updateINQ = function (formPage) {
        if (formPage == 'score' && $scope.current) {
            var rounding = true;
            $scope.currentInq = inq.getScore($scope.current, $scope.frequencies, rounding);
        }
    };
    $scope.$watch('formPage', $scope.updateINQ);
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
}
