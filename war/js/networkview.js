/**
 * Load a network view showing the persons and their relations
 * @param {Element} container    HTML DIV element
 * @param {Object} person        Object containing the person and his relations
 * @param {String[]} domains     List with available domains, used to color
 *                               the connections.
 * @param {String[]} frequencies List with available frequencies, used to give
 *                               the connections a width
 */
function loadNetwork (container, person, domains, frequencies) {
    var network = new links.Network(container);

    var nodes = [];
    var connections = [];
    var ids = {};

    // create a map with a color for each domain
    var defaultColors = [
        "#2B7CE9", "#FFA500", "#FA0A10", "#41A906", "#E129F0",
        "#7C29F0", "#C37F00","#4220FB", "#FD5A77", "#4AD63A"];
    var colors = {};
    for (var d = 0; d < domains.length; d++) {
        var domain = domains[d];
        colors[domain] = defaultColors[d] || 'black';
    }

    /**
     * Create a node from a person, and recursively iterate over all its
     * relations.
     * @param {Object} person
     * @return {Number} id
     * @private
     */
    function addPerson(person) {
        // TODO: check if name and id are defined in person

        var name = person.name;
        var id = ids[name];
        if (id == undefined) {
            var score = undefined;
            if (person.domains) {
                var rounding = true;
                score = inq.getScore(person, frequencies, rounding);
            }
            id = nodes.length;
            ids[name] = id;
            nodes.push({
                'id': id,
                'text': name,
                'title': 'Persoon<br>' +
                    'Naam: ' + name + '<br>' +
                    'Score: ' + ((score != undefined) ? score : 'onbekend'),
                'value': (score != undefined) ? score : 0
            });

            // iterate over all domains and relations
            if (person.domains instanceof Array) {
                person.domains.forEach(function (domain, domainIndex) {
                    if (domain.relations instanceof Array) {
                        domain.relations.forEach(function (relation, relationIndex) {
                            var frequency = relation.frequency;
                            var frequencyIndex = frequencies ? frequencies.indexOf(frequency) : -1;
                            var relId = addPerson(relation);
                            var rounding = true;
                            var partialScore = inq.partialScore(domainIndex,
                                relationIndex, frequencyIndex, rounding);
                            addRelation(id, relId, domain.name, frequency, partialScore);
                        });
                    }
                });
            }
        }
        return id;
    }

    /**
     * Create a connection between two persons
     * @param {Number} from
     * @param {Number} to
     * @param {String} domain
     * @param {String} frequency
     * @param {Number} score
     */
    function addRelation(from, to, domain, frequency, score) {
        // TODO: check if from and to are not undefined

        var value = frequencies.length - 1 - frequencies.indexOf(frequency);
        var title = 'Relatie' + '<br>' +
            'Deelnetwerk: ' + domain + '<br>' +
            'Frequentie: ' + frequency + '<br>' +
            'Score: ' + score;
        connections.push({
            'from': from,
            'to': to,
            'color': colors[domain],
            'value': score,
            'title': title
        });
    }

    // process the data
    addPerson(person);

    // initialize options
    var options = {
        'width': '650px',
        'height': '400px',
        'borderColor': 'lightgray',
        'nodes': {
            'style': 'dot',
            'radius': 10,
            'backgroundColor': 'lightgray',
            'borderColor': '#4d4d4d'
        },
        'links': {
            'defaultLength': 120
        }
    };

    // draw the network with the created nodes/connections
    network.draw(nodes, connections, options);

    // create a legend with color labels
    var labels = [];
    for (var c in colors) {
        if (colors.hasOwnProperty(c)) {
            var label = '<span style="background-color: ' + colors[c] + '">' +
                '&nbsp;&nbsp;&nbsp;&nbsp;</span> ' + c;
            labels.push(label);
        }
    }
    var legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = "Legenda: " + labels.join(', ');
    container.appendChild(legend);

    return network;
}
