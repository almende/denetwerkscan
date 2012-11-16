

var inq = {};

/**
 * Calculate the INQ for given person
 * @param {Object} person
 * @param {String[]} frequencies
 * @return {Number} inq
 */
inq.getScore = function (person, frequencies) {
    var relations = (person ? person.relations : undefined) || [];
    frequencies = frequencies || [];

    // determine the order of domains and filter the relations per domain
    var order = 0;
    var domains = [];
    var listedDomains = {};
    relations.forEach(function (relation) {
        var name = relation.domain;
        if (name) {
            if (!(name in listedDomains)) {
                listedDomains[name] = true;

                var filteredRelations = relations.filter(function (relation) {
                    return (relation.domain == name);
                });

                domains.push(filteredRelations);
            }
        }
    });

    /**
     * Calculate a coefficient from an index
     * @param {Number} index
     * @return {Number} coefficient
     */
    var getCoefficient = function (index) {
        if (index == 0) return 1;
        if (index == 1) return 1/2;
        if (index == 2) return 1/4;
        if (index == 3) return 1/8;
        if (index == 4) return 1/8;
        return 0;
    };

    // calculate the INQ (Individual Network Coefficient)
    var inq = 0;
    domains.forEach(function (relations, domainIndex) {
        relations.forEach(function (relation, relationIndex) {
            var frequency = relation.frequency;
            var frequencyIndex = frequencies.indexOf(frequency);
            if (frequencyIndex != -1) {
                inq +=
                    getCoefficient(domainIndex + 1) *
                    getCoefficient(relationIndex + 1) *
                    getCoefficient(frequencyIndex);
            }
            else {
                console.log('WARNING: Unknown frequency "' + frequency + '"');
            }
        });
    });

    return inq;
};