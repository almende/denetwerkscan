

var inq = {};

/**
 * Calculate the INQ (Individual Network Coefficient) for given person
 * @param {Object} person
 * @param {String[]} frequencies
 * @param {boolean} [rounding]
 * @return {Number} score
 */
inq.getScore = function (person, frequencies, rounding) {
    var coefficients = inq.getCoefficients(person, frequencies);
    return rounding ? inq.round(coefficients.score) : coefficients.score;
};

/**
 * Calculate the coefficients for each domain, relation, and frequency
 * @param {Object} person
 * @param {String[]} frequencies
 * @return {Object} coefficients
 */
inq.getCoefficients = function (person, frequencies) {
    var coefficients = {
        domains: {}
    };

    if (person.domains) {
        var domains = coefficients.domains = [];
        _.each(person.domains, function (domain) {
            if (domain.relations) {
                var relations = [];

                // calculate the frequency coefficient for each relation
                _.each(domain.relations, function (relation) {
                    var frequencyIndex = frequencies ? frequencies.indexOf(relation.frequency) : -1;
                    if (frequencyIndex != -1) {
                        relations.push({
                            frequencyCof: inq.getCoefficient(frequencyIndex),
                            orig: relation
                        });
                    }
                    else {
                        console.log('WARNING: Unknown frequency "' + relation.frequency + '"');
                    }
                });

                // sort the relations by frequency coefficient
                relations = _.sortBy(relations, function (relation) {
                    return -relation.frequencyCof;
                });

                // calculate the relation coefficient for each relation,
                // and the score per relation
                _.each(relations, function (relation, relationIndex) {
                    relation.relationCof = inq.getCoefficient(relationIndex + 1);
                    relation.score = relation.relationCof * relation.frequencyCof;
                });

                // append the domain and calculate the total score of the relations
                domains.push({
                    orig: domain,
                    relations: relations,
                    relationsScore: _.reduce(relations, function (memo, relation) {
                        return memo + relation.score;
                    }, 0)
                });
            }
        });

        // sort the domains by highest score
        domains = _.sortBy(domains, function (domain) {
            return -domain.relationsScore;
        });

        // calculate the domain coefficients and the score per domain
        _.each(domains, function (domain, domainIndex) {
            domain.domainCof = inq.getCoefficient(domainIndex + 1);
            domain.score = domain.domainCof * domain.relationsScore;
        });

        coefficients = {
            domains: domains,
            score: _.reduce(domains, function (memo, domain) {
                return memo + domain.score;
            }, 0)
        };
    }

    return coefficients;
};

/**
 * Calculate the coefficient for an index
 * @private
 * @param {Number} index
 * @return {Number} coefficient
 */
inq.getCoefficient = function (index) {
    if (index == 0) return 1;
    if (index == 1) return 1/2;
    if (index == 2) return 1/4;
    if (index == 3) return 1/8;
    if (index == 4) return 1/8;
    return 0;
};

/**
 * Round a value to 3 digits
 * @param {Number} value
 * @return {Number} roundedValue
 */
inq.round = function (value) {
    return Math.round(value * 1000) / 1000;
};