
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
 * 
 * @constructor Ctrl
 */
function Controller($scope, $resource) {
    // http://docs.angularjs.org/api/ngResource.$resource
    var Person = $resource('/persons/:id', {}, {
        'create': {method: 'POST'},
        'update': {method: 'PUT'},
        'find': {method: 'GET', isArray: true}
    });

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

    ];

    $scope.frequencies = [
        'Almost never',
        '1x per three months',
        '1x per six months',
        '1x per year',
        '1x per week',
        '2x per week',
        'Daily'
    ];

    $scope.persons = [];
    $scope.names = [];          // list with names used for auto-completion
    $scope.current = undefined; // current person
    $scope.rel=[];

    /**
	 * Query all persons. Persons are filtered by the currently selected test
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
        $scope.current = {};
    };

    /**
	 * Add a relation
	 * 
	 * @param {Object}
	 *            person
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
	 * 
	 * @param {Object}
	 *            person
	 * @param {Object}
	 *            relation
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
        $scope.loading = true;
        $scope.current = Person.get({'id': id}, undefined, function () {
            $scope.loading = false;
        });
    };
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
        if ($scope.current) {
            $scope.current.test = $scope.test;
            $scope.saving = true;
            var id = $scope.current.id;
            var onSave = function () {
                $scope.saving = false;
               // $scope.cancel();
                $scope.query();
                $scope.score($scope.current.id);
                $scope.sort($scope.current.id)
            };
            if (id == undefined) {
                // create new
                $scope.current = Person.create({}, $scope.current, onSave);
            }
            else {
                // update existing
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
	 * load network page
	 */
        
    $scope.showNetwork = function () {
    	$scope.setPage("network");
        if (!$scope.network) {
            // close any opened person
            $scope.cancel();
            $scope.setPage("network");
            // retrieve all data with documents
            var params = {
                'test': $scope.test,
                'include_docs': true
            };
            $scope.networkLoading = true;
            var data = Person.query(params, undefined, function () {
                // load container page
                var container = document.getElementById('network');
                loadNetwork(container, data, $scope.domains, $scope.frequencies);
                $scope.networkLoading = false;
            });
        }
    };
    // retrieve persons now
    $scope.query();
    $scope.setPage("intro");

}
