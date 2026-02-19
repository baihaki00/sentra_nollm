/**
 * Sentra v0.5 - Attention & Central Attractor
 * "Reticular Formation & Global Workspace": Filters noise and provides intentionality.
 */

const Perception = require('./perception');

const WINNER_TAKE_ALL_COUNT = 5;

class Attention {
    constructor() {
        this.perception = new Perception();
        this.attractorVector = null;
        this.goalVector = null;
        this.identityVector = null;

        // Stability and Drift (Central Attractor Dynamics)
        this.drift = 0.05;
        this.stability = 0.95;
    }

    async init() {
        // Identity vector is the hash of "Sentra"
        this.identityVector = this.perception.textToVector("Sentra");
        this.attractorVector = this.identityVector;
        this.goalVector = this.identityVector;
    }

    setAttractor(text) {
        const target = this.perception.textToVector(text);
        // Attractor Dynamics: Move the magnet toward the new target
        this.attractorVector = this.blend(this.attractorVector, target, 0.8);
    }

    setGoal(text) {
        const target = this.perception.textToVector(text);
        this.goalVector = this.blend(this.goalVector, target, 0.9);
    }

    // Blend two vectors with a given weight (0.0 to 1.0)
    blend(v1, v2, weight) {
        if (!v1 || !v2) return v1 || v2;
        const result = Buffer.alloc(v1.length);
        for (let i = 0; i < v1.length; i++) {
            const byte1 = v1[i];
            const byte2 = v2[i];
            let blendedByte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const bitVal = Math.random() < weight ? (byte2 & (1 << bit)) : (byte1 & (1 << bit));
                blendedByte |= bitVal;
            }
            result[i] = blendedByte;
        }
        return result;
    }

    // Calculate "Distance to Attractor" (Bias)
    getBias(vector) {
        if (!this.attractorVector) return 0;
        const dist = this.perception.hammingDistance(this.attractorVector, vector);
        // Normalize 0-256 to a smaller influence factor
        return dist / 512;
    }

    applyDrift() {
        if (!this.attractorVector) return;
        // Randomly flip a few bits to simulate "drifting thoughts"
        for (let i = 0; i < this.attractorVector.length; i++) {
            if (Math.random() < this.drift) {
                this.attractorVector[i] ^= (1 << Math.floor(Math.random() * 8));
            }
        }
    }

    /**
     * Filters the raw signal vector (activated prototypes) to select the most relevant ones.
     * @param {number[]} signalVector - Indices of activated prototypes from Perception
     * @returns {number[]} - The filtered/focused set of indices
     */
    focus(signalVector) {
        if (!signalVector || signalVector.length === 0) return [];
        // In the future, this will check against attractorVector to boost relevant signals.
        return signalVector.slice(0, WINNER_TAKE_ALL_COUNT);
    }
}

module.exports = Attention;
