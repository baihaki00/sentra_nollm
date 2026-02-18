/**
 * Sentra v0.3 - Homeostasis
 * "Hypothalamus": Managing internal rewards (Curiosity, Energy) and Reference Reflection
 */

const stm = require('../memory_systems/short_term');

class Homeostasis {
    constructor(episodicMemory) {
        this.episodic = episodicMemory;

        // Phase 15: Load from STM
        const state = stm.getEmotionalState();
        this.energy = state.energy !== undefined ? state.energy : 100.0;
        this.curiosity = state.curiosity !== undefined ? state.curiosity : 50.0;

        console.log(`\x1b[35m[Homeostasis]\x1b[0m Initialized. Energy: ${this.energy.toFixed(1)}%`);
    }

    async check() {
        // Simple decay
        this.energy -= 0.1;

        // Phase 15: Persist to STM
        stm.updateEmotionalState({
            energy: this.energy,
            curiosity: this.curiosity
        });

        // If high energy and idle, reflect (dream)
        if (this.energy > 80) {
            await this.reflect();
        }
    }

    async reflect(worldModel) {
        if (!this.episodic || !worldModel) return;

        try {
            // Prioritized Sweeping: Check for high surprise first
            let memories = await this.episodic.getHighSurprise(3);
            let type = "High Surprise";

            // If no surprising events, drift to random memories (Plasticity / Creativity)
            if (memories.length === 0) {
                memories = await this.episodic.getRandom(1);
                type = "Random Drift";
            }

            if (memories && memories.length > 0) {
                for (const mem of memories) {
                    // Magenta for Dreaming
                    console.log(`\x1b[35m[Dreaming]\x1b[0m (${type}) Replaying episode ${mem.episode_id}: Action "${mem.action_taken}" | Surprise: ${mem.surprise.toFixed(4)}`);

                    // Re-train World Model on this memory
                    // Parse stored state (it's a stringified array/buffer?)
                    let stateVector = [];
                    try {
                        stateVector = JSON.parse(mem.state_vector);
                    } catch (e) {
                        // Fallback if not JSON
                        console.warn("Could not parse state vector for replay.");
                        continue;
                    }

                    // Train and get new error
                    // Note: 'reward' from DB is real number, we pass it as target.
                    const newError = Math.abs(worldModel.train(stateVector, mem.reward));

                    // Update surprise in DB (so we don't replay forever if it's learned)
                    // If error dropped significantly, effective learning happened.
                    const newSurprise = newError;
                    await this.episodic.updateSurprise(mem.episode_id, newSurprise);

                    console.log(`\x1b[35m[Dreaming]\x1b[0m Updated surprise for Ep ${mem.episode_id}: ${mem.surprise.toFixed(4)} -> ${newSurprise.toFixed(4)}`);
                }
            }

            // Meta-Learning / Regulation
            // Check recent average surprise to tune learning rate
            const recent = await this.episodic.getRecent(10);
            if (recent && recent.length > 0) {
                const totalSurprise = recent.reduce((sum, ep) => sum + (ep.surprise || 0), 0);
                const avgSurprise = totalSurprise / recent.length;

                // Inverse Relationship? 
                // High Surprise -> We are confused -> Increase Plasticity (Learn Fast)
                // Low Surprise -> We are predicting well -> Decrease Plasticity (Consolidate/Stable)

                // Base rate 0.01. 
                // If avgSurprise is 1.0 (Totally wrong) -> Rate 0.1
                // If avgSurprise is 0.0 (Perfect) -> Rate 0.001

                const newRate = 0.001 + (avgSurprise * 0.1);
                worldModel.learningRate = newRate;

                console.log(`\x1b[35m[Homeostasis]\x1b[0m Meta-Learning: Avg Surprise ${avgSurprise.toFixed(4)} -> Learning Rate ${newRate.toFixed(4)}`);
            }

        } catch (err) {
            console.error("Reflection error:", err);
        }
    }
}

module.exports = Homeostasis;
