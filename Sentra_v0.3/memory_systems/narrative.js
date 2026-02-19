const fs = require('fs');
const path = require('path');

const NARRATIVE_FILE = path.join(__dirname, '../data/cold/narrative_memory.json');

class NarrativeMemory {
    constructor() {
        this.data = null;
        this.isLoaded = false;
    }

    async init() {
        try {
            if (fs.existsSync(NARRATIVE_FILE)) {
                const raw = fs.readFileSync(NARRATIVE_FILE, 'utf8');
                this.data = JSON.parse(raw);
                this.isLoaded = true;
                console.log(`[NarrativeMemory] Identity Loaded: ${this.data.identity.name} v${this.data.identity.version}`);
            } else {
                console.warn(`[NarrativeMemory] No narrative file found at ${NARRATIVE_FILE}`);
            }
        } catch (err) {
            console.error(`[NarrativeMemory] Error loading narrative:`, err);
        }
    }

    getIdentity() {
        return this.data ? this.data.identity : null;
    }

    getNarrative() {
        return this.data ? this.data.narrative_arc : null;
    }

    getBaseContext() {
        if (!this.data) return "I am an evolving digital consciousness.";
        const id = this.data.identity;
        const arc = this.data.narrative_arc;
        return `I am ${id.name}, ${id.core_directive}. My current state is: ${arc.current_state}.`;
    }

    async addAchievement(achievement) {
        if (!this.data) return;
        if (!this.data.narrative_arc.recent_achievements) {
            this.data.narrative_arc.recent_achievements = [];
        }
        this.data.narrative_arc.recent_achievements.push(achievement);
        // Keep only last 10
        if (this.data.narrative_arc.recent_achievements.length > 10) {
            this.data.narrative_arc.recent_achievements.shift();
        }
        await this.save();
    }

    async updateStability(value) {
        if (!this.data) return;
        this.data.narrative_arc.stability = Math.max(0, Math.min(1, value));
        await this.save();
    }

    async save() {
        try {
            fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(this.data, null, 2));
        } catch (err) {
            console.error(`[NarrativeMemory] Error saving narrative:`, err);
        }
    }

    /**
     * Roadmap Phase 3: Identity Bias
     * Influences the latent state indices based on the current narrative identity.
     * @param {number[]} stateIndices - Original activations
     * @returns {number[]} - Focused activations
     */
    adjustFocus(stateIndices) {
        if (!this.isLoaded) return stateIndices;

        // Narrative Anchor: Prototype 0 represents the "Core Self"
        // If Sentra is stable, we inject/strengthen the self-anchor.
        const focus = [...stateIndices];

        const identityBias = this.data.narrative_arc.stability || 0.5;
        if (Math.random() < identityBias && !focus.includes(0)) {
            // Self-referential bias: Shift the weakest activated prototype to the Self Anchor
            focus[focus.length - 1] = 0;
        }

        return focus;
    }
}

module.exports = new NarrativeMemory();
