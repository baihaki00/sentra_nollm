/**
 * Sentra v0.3 - Attention
 * "Reticular Formation": Filters noise, focuses working memory
 */

const WINNER_TAKE_ALL_COUNT = 5;

class Attention {
    constructor() {
        // init
    }

    /**
     * Filters the raw signal vector (activated prototypes) to select the most relevant ones.
     * Currently implementing a simple pass-through of the top K activations 
     * from Perception, but this is where top-down modulation will go later.
     * 
     * @param {number[]} signalVector - Indices of activated prototypes from Perception
     * @returns {number[]} - The filtered/focused set of indices
     */
    focus(signalVector) {
        // For now, we trust Perception's ranking (which is already sorted by distance)
        // In the future, this will check against Active Goals to boost relevant signals.

        if (!signalVector || signalVector.length === 0) return [];

        return signalVector.slice(0, WINNER_TAKE_ALL_COUNT);
    }
}

module.exports = Attention;
