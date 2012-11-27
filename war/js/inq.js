

var inq = {};

/**
 * Calculate the INQ (Individual Network Coefficient) for given person
 * @param {Object} person
 * @param {String[]} frequencies
 * @return {Number} score
 */
inq.getScore = function (person, frequencies) {
    var score = 0;
    if (person.domains) {
        person.domains.forEach(function (domain, domainIndex) {
            if (domain.relations) {
                domain.relations.forEach(function (relation, relationIndex) {
                    var frequency = relation.frequency;
                    var frequencyIndex = frequencies ? frequencies.indexOf(frequency) : -1;
                    if (frequencyIndex != -1) {
                        score += inq.partialScore(domainIndex, relationIndex, frequencyIndex);
                    }
                    else {
                        console.log('WARNING: Unknown frequency "' + frequency + '"');
                    }
                });
            }
        });
    }

    // round to 3 digits
    score = Math.round(score * 1000) / 1000;

    return score;
};

/**
 * Calculate the INQ score for a single relation
 * @private
 * @param domainIndex
 * @param relationIndex
 * @param frequencyIndex
 * @return {Number} partialScore
 */
inq.partialScore = function (domainIndex, relationIndex, frequencyIndex) {
    return inq.getCoefficient(domainIndex + 1) *
        inq.getCoefficient(relationIndex + 1) *
        inq.getCoefficient(frequencyIndex);
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
