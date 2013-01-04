/**
 * Autocompletion directive using jQuery UI Autocomplete
 * @type {module}
 */
var myApp = angular.module('controller', ['ngResource']);

/**
 * Create a directive for using the jquery-ui-autocomplete widget
 */
myApp.directive('autocomplete', function($parse) {
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

