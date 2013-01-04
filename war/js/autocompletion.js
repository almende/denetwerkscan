/**
 * Autocompletion directive using jQuery UI Autocomplete
 * @type {module}
 */

var myApp = angular.module('controller', ['ngResource']);

/**
 * Create a directive for using the jquery-ui-autocomplete widget
 */
myApp.directive('autocomplete', function($parse) {
    /**
     * Sort the given array with autocompletion objects and remove duplicates
     * @param data
     */
    function sortAndremoveDuplicates(data) {
        // sort
        data.sort(function (a, b) {
            if (a.name < b.name) return 1;
            if (a.name > b.name) return -1;
            return -1;
        });

        // remove duplicates
        var i = 0;
        var prevName = undefined;
        while (i < data.length) {
            var name = data[i].name;
            if (prevName && name == prevName) {
                data.splice(i, 1);
            }
            else {
                prevName = name;
                i++;
            }
        }
    }

    return function(scope, element, attrs) {
        var updateName = $parse(attrs['relationname']).assign;
        var updateId = $parse(attrs['relationid']).assign;
        scope.$watch(attrs.autocomplete, function() {
            element.autocomplete({
                source: function (request, response) {
                    var name = request.term; // search term
                    try {
                        $.ajax({
                            url: '/persons/?name=' + name + '&limit=10',
                            dataType: 'json',
                            success: function (persons) {
                                var data = [];
                                $.each(persons, function () {
                                    data.push({
                                        value: this.name,
                                        label: this.name,
                                        id: this.id
                                    });
                                });

                                // merge imported facebook friends
                                if (scope.facebook.friends) {
                                    // filter by lower case name
                                    var filteredFriends =
                                        filterFacebookFriends(scope.facebook.friends, name);
                                    $.each(filteredFriends, function () {
                                        data.push({
                                            value: this.name,
                                            label: this.name
                                        });
                                    });
                                }

                                // remove duplicates
                                sortAndremoveDuplicates(data);

                                // return the data
                                response(data);
                            },
                            error: function (err) {
                                response([]);
                                console.log(err);
                            }
                        });
                    }
                    catch (err) {
                        response([]);
                        console.log(err);
                    }
                },
                select: function(event, ui) {
                    updateName(scope, ui.item.value);
                    updateId(scope, ui.item.id);
                    scope.$apply();
                }
            }).data( 'autocomplete' )._renderItem = function( ul, item ) {
                var html = '<a>' +
                    item.label +
                    (item.id ? '<br><span class="desc">' + item.id + '</span>' : '') +
                    '</a>';
                return $('<li>')
                    .data('item.autocomplete', item)
                    .append(html)
                    .appendTo(ul);
            };
        });
    };
});

