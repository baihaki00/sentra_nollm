/**
 * Sentra v0.4 - Short-Term Memory (STM)
 * "Prefrontal Cortex/Working Memory"
 * 
 * Responsibilities:
 * 1. Maintain active context (Topic, User Intent).
 * 2. Hold a buffer of recent interactions (The "Now").
 * 3. Provide context to Procedural Memory for decision making.
 * 
 * Storage: 
 * - data/hot/working_context.json (Current State)
 * - data/hot/short_term_buffer.json (Recent History)
 */

const fs = require('fs');
const path = require('path');

const CONTEXT_PATH = path.join(__dirname, '../data/hot/working_context.json');
const BUFFER_PATH = path.join(__dirname, '../data/hot/short_term_buffer.json');
const MAX_BUFFER_SIZE = 10; // Keep last 10 turns

class ShortTermMemory {
    constructor() {
        this.context = {
            current_topic: "none",
            user_facts: {},
            attention_focus: null,
            last_intent: null
        };
        this.buffer = [];
        this.init();
    }

    init() {
        try {
            if (fs.existsSync(CONTEXT_PATH)) {
                this.context = JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf8'));
            } else {
                this.saveContext(); // Create default
            }

            if (fs.existsSync(BUFFER_PATH)) {
                this.buffer = JSON.parse(fs.readFileSync(BUFFER_PATH, 'utf8'));
            } else {
                this.saveBuffer(); // Create default
            }
            console.log("\x1b[35m[ShortTermMemory]\x1b[0m Initialized.");
        } catch (err) {
            console.error("STM Initialization Error:", err);
        }
    }

    saveContext() {
        fs.writeFileSync(CONTEXT_PATH, JSON.stringify(this.context, null, 2));
    }

    saveBuffer() {
        fs.writeFileSync(BUFFER_PATH, JSON.stringify(this.buffer, null, 2));
    }

    /**
     * Add an interaction to the Short-Term Buffer.
     * @param {string} role - 'user' or 'sentra'
     * @param {string} text - The content
     * @param {object} metadata - Extra info (vectors, sentiment)
     */
    addInteraction(role, text, metadata = {}) {
        const item = {
            role,
            text,
            timestamp: Date.now(),
            ...metadata
        };

        this.buffer.push(item);

        // Trim buffer
        if (this.buffer.length > MAX_BUFFER_SIZE) {
            this.buffer = this.buffer.slice(-MAX_BUFFER_SIZE);
        }

        this.saveBuffer();

        // Heuristic: Update Topic?
        // Very simple logic for v0.4: If user sets a topic explicitly or keywords found
        // Future: Use Semantic Memory to infer topic
    }

    /**
     * Updates the persistent context state.
     * @param {string} key 
     * @param {any} value 
     */
    updateContext(key, value) {
        this.context[key] = value;
        this.saveContext();
        console.log(`\x1b[35m[ShortTermMemory]\x1b[0m Context Updated: ${key} = ${JSON.stringify(value)}`);
    }

    /**
     * Store a specific fact about the user or world.
     * @param {string} key 
     * @param {any} value 
     */
    setFact(key, value) {
        if (!this.context.user_facts) this.context.user_facts = {};
        this.context.user_facts[key] = value;
        this.saveContext();
        console.log(`\x1b[35m[ShortTermMemory]\x1b[0m Fact Learned: ${key} = ${value}`);
    }

    /**
     * Retrieve a specific fact.
     * @param {string} key 
     */
    getFact(key) {
        if (!this.context.user_facts) return null;
        return this.context.user_facts[key] || null;
    }

    /**
     * Set the current conversational topic.
     * @param {string} topic 
     */
    setTopic(topic) {
        this.context.current_topic = topic;
        this.saveContext();
        console.log(`\x1b[35m[ShortTermMemory]\x1b[0m Topic Switched: "${topic}"`);
    }

    getTopic() {
        return this.context.current_topic || "none";
    }

    /**
     * Set the current attention focus (Entity/Subject).
     * @param {string} entity 
     */
    setFocus(entity) {
        this.context.attention_focus = entity;
        this.saveContext();
        console.log(`\x1b[35m[ShortTermMemory]\x1b[0m Focus Set: "${entity}"`);
    }

    getFocus() {
        return this.context.attention_focus || null;
    }

    /**
     * Retrieve the full current context for decision making.
     */
    getContext() {
        return {
            ...this.context,
            recent_history: this.buffer
        };
    }

    getLastUserMessage() {
        for (let i = this.buffer.length - 1; i >= 0; i--) {
            if (this.buffer[i].role === 'user') return this.buffer[i];
        }
        return null;
    }

    /**
     * Update the emotional state (Energy, Mood, etc.)
     * @param {object} state - e.g. { energy: 90, curiosity: 50 }
     */
    updateEmotionalState(state) {
        this.context.emotional_state = { ...this.context.emotional_state, ...state };
        this.saveContext();
        // console.log(`\x1b[35m[ShortTermMemory]\x1b[0m Emotion Updated: ${JSON.stringify(state)}`); // Too verbose?
    }

    getEmotionalState() {
        return this.context.emotional_state || { energy: 100, curiosity: 50 };
    }
}

module.exports = new ShortTermMemory(); // Singleton
