
var myApp = angular.module('controller', ['ngResource']);

/**
 * Create a directive for using the jquery-ui-autocomplete widget
 */
myApp.directive('autocomplete', function($parse) {
    return function(scope, element, attrs) {
        var setSelection = $parse(attrs['selection']).assign;
        scope.$watch(attrs.autocomplete, function(value) {
            element.autocomplete({
                source: value,
                select: function(event, ui) {
                    setSelection(scope, ui.item.value);
                    scope.$apply();
                }
            });
        });
    };
});


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

    $scope.tests = [
        'netwerk_scan_1'
    ];
    $scope.test = $scope.tests[0];
    $scope.page = 'intro';    // Available: 'intro', 'form', 'network', 'score'
    $scope.formPage = 'self'; // Available: 'self', 'contacts', 'score'

    $scope.domains = [
        'Familie',
        'Collega',
        'Vriend',
        'Studie',
        'Hobby',
        'Buur'
    ];

    $scope.frequencies = [
        'Dagelijks',
        '2x per week',
        '1x per week',
        '1x per maand',
        '1x per kwartaal',
        '2x per jaar',
        '1x per jaar',
        'Bijna nooit'
    ];

    $scope.persons = [];
    $scope.names = [];          // list with names used for auto-completion
    $scope.current = undefined; // current person

    /**
     * Query all persons.
     * Persons are filtered by the currently selected test
     */
    $scope.query = function () {
        if (!$scope.isLoggedIn()) {
            return;
        }

        var params = {
            'test': $scope.test
        };

        var updateNames = function () {
            $scope.names = [];
            for (var i = 0; i < $scope.persons.length; i++) {
                var name = $scope.persons[i].name;
                $scope.names.push(name);
            }
        };

        $scope.querying = true;
        $scope.error = undefined;
        $scope.persons = Person.find(params, undefined, function () {
            $scope.querying = false;
            updateNames();
        }, function (err) {
            $scope.querying = false;
            console.log('Error', err);
        });
    };

    // create a watch which reloads persons when the test changes
    $scope.$watch('test', function () {
        $scope.current = undefined;
        $scope.query();
    });

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
    });

    /**
     * Load the form of current user and start editing
     */
    $scope.start = function () {
        $scope.page = 'form';
        $scope.formPage = 'self';
        if ($scope.isLoggedIn()) {
            // load current user form
            $scope.load($scope.user.email);
        }
    };

    /**
     * Add a relation
     * @param {Object} person
     */
    $scope.addRelation = function (person) {
        var relations = person.relations;
        if (!relations) {
            relations = [];
            person.relations = relations;
        }
        relations.push({});
    };

    /**
     * Remove a relation
     * @param {Object} person
     * @param {Object} relation
     */
    $scope.deleteRelation = function (person, relation) {
        var relations = person.relations;
        if (!relations) {
            relations = [];
            person.relations = relations;
        }
        var index = relations.indexOf(relation);
        if (index != -1) {
            relations.splice(index, 1);
        }
    };

    /**
     * Load a person by id. If not existing, a new form for the current user
     * will be initialized
     * @param {Number} id
     */
    $scope.load = function (id) {
        // first save any changes
        $scope.save();

        $scope.page = 'form';
        $scope.formPage = 'self';
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
                        relations: [
                            {}
                        ]
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
                $scope.current.test = $scope.test;
                $scope.saving = true;
                $scope.error = undefined;
                $scope.current = Person.update({'id': id}, $scope.current, function () {
                    $scope.saving = false;
                    $scope.query();
                }, function (err) {
                    $scope.saving = false;
                    $scope.error = 'Opslaan van gebruiker ' + id + ' is mislukt';
                    console.log('Error', err);
                });
            }
        }
    };

    $scope.describeGender = function (gender) {
        if (gender == 'MALE') {
            return 'Man';
        }
        if (gender == 'FEMALE') {
            return 'Vrouw';
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
        if (id &&  confirm('Weet je zeker dat je ' + (name || id) + ' wilt verwijderen?')) {
            $scope.deleting = true;
            $scope.error = undefined;
            Person.delete({'id': id}, undefined, function () {
                $scope.deleting = false;
                $scope.query();
            }, function (err) {
                $scope.deleting = false;
                $scope.error = 'Verwijderen van gebruiker ' + id + ' is mislukt';
            });

            if ($scope.current && $scope.current.id == id) {
                $scope.current = undefined;
            }
        }
    };

    /**
     * load network page
     */
    $scope.showNetwork = function () {
        $scope.page = 'network';
        if (!$scope.network) {
            // retrieve all data with documents
            var params = {
                'test': $scope.test,
                'include_docs': true
            };
            $scope.networkLoading = true;
            var data = Person.query(params, undefined, function () {
                // load container view
                var container = document.getElementById('network');
                loadNetwork(container, data, $scope.domains, $scope.frequencies);
                $scope.networkLoading = false;
            },
            function (err) {
                $scope.networkLoading = false;
                // TODO: display error on screen
                console.log('Error', err);
            });
        }
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

    // retrieve persons now
    $scope.query();

    // retrieve user info (logged in or not, email, isAdmin
    $scope.user = User.get();
    $scope.$watch('user.isLoggedIn', function (isLoggedIn) {
        if (isLoggedIn) {
            $scope.query();
        }
    });

    $scope.currentInq = undefined;
    $scope.updateINQ = function (formPage) {
        if (formPage == 'score' && $scope.current) {
            var value = inq.getScore($scope.current, $scope.frequencies);

            // round to 3 digits
            value = Math.round(value * 1000) / 1000;
            $scope.currentInq = value;
        }
    };

    $scope.$watch('formPage', $scope.updateINQ);
    $scope.$watch('current.id', $scope.updateINQ);
}
