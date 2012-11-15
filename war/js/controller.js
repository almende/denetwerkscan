
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
        $scope.persons = Person.find(params, undefined, function () {
            $scope.querying = false;
            updateNames();
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
    });

    /**
     * Create a new person
     */
    $scope.start = function () {
        $scope.page = 'form';
        $scope.formPage = 'self';
        $scope.current = {
            id: $scope.user ? $scope.user.email : '',
            relations: [
                {}
            ]
        };
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
     * Load a person by id
     * @param {Number} id
     */
    $scope.load = function (id) {
        $scope.page = 'form';
        $scope.formPage = 'self';
        $scope.loading = true;
        $scope.current = Person.get({'id': id}, undefined, function () {
            $scope.loading = false;
            $scope.markUnchanged();
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
                $scope.current = Person.update({'id': id}, $scope.current, function () {
                    $scope.saving = false;
                    $scope.query();
                });
            }
        }
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
            var onDelete = function () {
                $scope.deleting = false;
                $scope.query();
            };
            $scope.deleting = true;
            Person.delete({'id': id}, undefined, onDelete);

            if ($scope.current.id == id) {
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
        if ($scope.user.isAdmin) {
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
}
