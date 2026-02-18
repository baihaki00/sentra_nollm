/**
 * Sentra v0.5 - The Ego
 * "The Last One": The central attractor in latent space.
 */

const Perception = require('./perception');

class Ego {
    constructor() {
        this.perception = new Perception();
        this.currentTopicVector = null;
        this.currentGoalVector = null;
        this.identityVector = null;
        
        // Stability and Drift (Phase 22)
        this.drift = 0.05; 
        this.stability = 0.95;
    }

    async init() {
        // Identity vector could be the hash of "Sentra"
        this.identityVector = this.perception.textToVector("Sentra");
        this.currentTopicVector = this.identityVector;
        this.currentGoalVector = this.identityVector;
    }

    setFocus(text) {
        const target = this.perception.textToVector(text);
        // Attractor Dynamics: Move the magnet toward the new target
        this.currentTopicVector = this.blend(this.currentTopicVector, target, 0.8);
    }

    setGoal(text) {
        const target = this.perception.textToVector(text);
        this.currentGoalVector = this.blend(this.currentGoalVector, target, 0.9);
    }

    // Blend two vectors with a given weight (0.0 to 1.0)
    blend(v1, v2, weight) {
        if (!v1 || !v2) return v1 || v2;
        const result = Buffer.alloc(v1.length);
        for (let i = 0; i < v1.length; i++) {
            // Simple bitwise weight (stochastic bit flipping based on weight)
            // If weight is 0.9, 90% chance to take bit from v2, 10% from v1.
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

    // Calculate "Distance to Ego"
    // Used by ProceduralMemory to bias results.
    getEgoBias(vector) {
        if (!this.currentTopicVector) return 0;
        const dist = this.perception.hammingDistance(this.currentTopicVector, vector);
        // Normalize 0-256 to a smaller influence factor
        return dist / 512; 
    }

    applyDrift() {
        // Randomly flip a few bits to simulate "drifting thoughts"
        for (let i = 0; i < this.currentTopicVector.length; i++) {
            if (Math.random() < this.drift) {
                this.currentTopicVector[i] ^= (1 << Math.floor(Math.random() * 8));
            }
        }
    }
}

module.exports = new Ego();
