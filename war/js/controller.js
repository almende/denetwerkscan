
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
<<<<<<< HEAD
 * 
=======
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
 * @constructor Ctrl
 */
function Controller($scope, $resource) {
    // http://docs.angularjs.org/api/ngResource.$resource
    var Person = $resource('/persons/:id', {}, {
        'create': {method: 'POST'},
        'update': {method: 'PUT'},
        'find': {method: 'GET', isArray: true}
    });

<<<<<<< HEAD
    $scope.tests = [   
        'Network scan 2012'
    ];
    $scope.test = $scope.tests[0];// default

    $scope.domains = [
                      
        'Family',
        'Colleague',
        'Friends',
        'School',
        'Free time (hobbies, sports, etc.)',
        'Neighbors'      

=======
    $scope.tests = [
        'Buurtlab 2011',
        'Buurtlab 2012'
    ];
    $scope.test = $scope.tests[0];

    $scope.domains = [
        'School',
        'Sports',
        'Family',
        'Colleague'
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
    ];

    $scope.frequencies = [
        'Almost never',
        '1x per three months',
<<<<<<< HEAD
        '1x per six months',
        '1x per year',
=======
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
        '1x per week',
        '2x per week',
        'Daily'
    ];

    $scope.persons = [];
    $scope.names = [];          // list with names used for auto-completion
    $scope.current = undefined; // current person
<<<<<<< HEAD
    $scope.rel=[];

    /**
	 * Query all persons. Persons are filtered by the currently selected test
	 */
=======

    /**
     * Query all persons.
     * Persons are filtered by the currently selected test
     */
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
    $scope.query = function () {
        var params = {
            'test': $scope.test
        };

        var updateNames = function () {
            $scope.names = [];
            for (var i = 0; i < $scope.persons.length; i++) {
                var name = $scope.persons[i].name;
<<<<<<< HEAD
                $scope.names.push(name);             
              }
               
            };     
=======
                $scope.names.push(name);
            }
        };

>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
        $scope.querying = true;
        $scope.persons = Person.find(params, undefined, function () {
            $scope.querying = false;
            updateNames();
        });
<<<<<<< HEAD
        
=======
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
    };

    // create a watch which reloads persons when the test changes
    $scope.$watch('test', function () {
        $scope.current = undefined;
        $scope.query();
    });
<<<<<<< HEAD
    /**
	 * Create hide/show to allow users to get information step by step
	 */

    $scope.viewRelationpage = function(){
    	$scope.setPage('relation');
    }   
    
    /**
	 * Create a new person
	 */
    $scope.start = function () { 
    	$scope.setPage('whoyou');
=======

    /**
     * Create a new person
     */
    $scope.add = function () {
        $scope.setView("edit");
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
        $scope.current = {};
    };

    /**
<<<<<<< HEAD
	 * Add a relation
	 * 
	 * @param {Object}
	 *            person
	 */
    $scope.addRelation = function (person) {
        var relations = person.relations;
        
=======
     * Add a relation
     * @param {Object} person
     */
    $scope.addRelation = function (person) {
        var relations = person.relations;
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
        if (!relations) {
            relations = [];
            person.relations = relations;
        }
        relations.push({});
<<<<<<< HEAD
       
    };

    /**
	 * Remove a relation
	 * 
	 * @param {Object}
	 *            person
	 * @param {Object}
	 *            relation
	 */
=======
    };

    /**
     * Remove a relation
     * @param {Object} person
     * @param {Object} relation
     */
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
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
<<<<<<< HEAD
  

    /**
	 * Set view for the contents of the page
	 * 
	 * @param {String}
	 *            view Available views: "intro","whoyou", "relation" "result"
	 *            and "network"
	 */
    $scope.setPage = function (page) {
        $scope.page = page;
    };

    /**
	 * Load a person by id
	 * 
	 * @param {Number}
	 *            id
	 */
    $scope.load = function (id) {
        $scope.setPage("whoyou");
=======

    /**
     * Set view for the contents of the page
     * @param {String} view  Available views: "edit" or "network"
     */
    $scope.setView = function (view) {
        $scope.view = view;
    };

    /**
     * Load a person by id
     * @param {Number} id
     */
    $scope.load = function (id) {
        $scope.setView("edit");
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
        $scope.loading = true;
        $scope.current = Person.get({'id': id}, undefined, function () {
            $scope.loading = false;
        });
    };
<<<<<<< HEAD
    /**
	 * Assign weight per domain for score
	 */
    $scope.score = function (id) {  
        $scope.setPage('result');
    	var person = $scope.current;
    	console.log(person);
    	var relations = person.relations;
    	// console.log(relations);
    	for (var i = 0 ; i< relations.length; i++){
    		var domain = person.relations[i].domain;
    		if(domain =='Family'){
    			person.relations[i].weight = 1;    			
    		}
    		else if(domain == 'Neighbors'){
    			person.relations[i].weight = 0.5;    			
    		}
    		else if(domain == 'Friends'){
    			person.relations[i].weight = 0.25;
    		}
    		else if(domain == 'Colleague'){
    			person.relations[i].weight = 0.125;
    		}
    		else if(domain == 'School'){
    			person.relations[i].weight = 0.125;
    		}
    		else if(domain == 'Free time (hobbies, sports, etc.)'){
    			person.relations[i].weight = 0.125;
    		}
    			
    	}
        
    };
    /**
	 * Sort the JSON object of relations for current person
	 */
    $scope.sort = function (id) {  
    	var data = $scope.current.relations;
    	data.sort(function(a, b) {
    		if(a.weight < b.weight){
    			return 1;
    		}else if(a.weight>b.weight){
    			return -1;
    		}else{ 
    			return 0;
    		}
         });

    }
    /**
	 * Save the current person
	 */
    $scope.save = function () {    	
=======

    /**
     * Save the current person
     */
    $scope.save = function () {
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
        if ($scope.current) {
            $scope.current.test = $scope.test;
            $scope.saving = true;
            var id = $scope.current.id;
            var onSave = function () {
                $scope.saving = false;
<<<<<<< HEAD
               // $scope.cancel();
                $scope.query();
                $scope.score($scope.current.id);
                $scope.sort($scope.current.id)
=======
                $scope.cancel();
                $scope.query();
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
            };
            if (id == undefined) {
                // create new
                $scope.current = Person.create({}, $scope.current, onSave);
            }
            else {
                // update existing
<<<<<<< HEAD
                $scope.current = Person.update({'id': id}, $scope.current, onSave);                
            }
        }
        
    };

    /**
	 * Cancel editing the current person
	 */
    $scope.cancel = function () {
        $scope.current = undefined;
        $scope.setPage("intro");
    };

    /**
	 * Delete the current person
	 */
=======
                $scope.current = Person.update({'id': id}, $scope.current, onSave);
            }
        }
    };

    /**
     * cancel editing the current person
     */
    $scope.cancel = function () {
        $scope.current = undefined;
    };

    /**
     * Delete the current person
     */
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
    $scope.delete = function () {
        if ($scope.current && confirm("Do you really want to delete " + $scope.current.name + '?')) {
            var id = $scope.current.id;
            if (id) {
                var onDelete = function () {
                    $scope.deleting = false;
                    $scope.current = undefined;
                    $scope.query();
                };
                $scope.deleting = true;
                Person.delete({'id': id}, undefined, onDelete);
            }
            $scope.cancel();
        }
    };

    /**
<<<<<<< HEAD
	 * load network page
	 */
        
    $scope.showNetwork = function () {
    	$scope.setPage("network");
        if (!$scope.network) {
            // close any opened person
            $scope.cancel();
            $scope.setPage("network");
=======
     * load network view
     */
    $scope.showNetwork = function () {
        $scope.setView("network");
        if (!$scope.network) {
            // close any opened person
            $scope.cancel();

>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
            // retrieve all data with documents
            var params = {
                'test': $scope.test,
                'include_docs': true
            };
            $scope.networkLoading = true;
            var data = Person.query(params, undefined, function () {
<<<<<<< HEAD
                // load container page
=======
                // load container view
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
                var container = document.getElementById('network');
                loadNetwork(container, data, $scope.domains, $scope.frequencies);
                $scope.networkLoading = false;
            });
        }
    };
<<<<<<< HEAD
    // retrieve persons now
    $scope.query();
    $scope.setPage("intro");

=======

    // retrieve persons now
    $scope.query();
>>>>>>> 34ba9c4e978e00312d9d7f939b817be63cfe12dd
}
