/**
 * Sentra v0.3 - Homeostasis
 * "Hypothalamus": Managing internal rewards (Curiosity, Energy) and Reference Reflection
 */

const stm = require('../memory_systems/short_term');
const path = require('path');
const fs = require('fs');

class Homeostasis {
    constructor(episodicMemory) {
        this.episodic = episodicMemory;

        // Phase 15: Load from STM
        const state = stm.getEmotionalState();
        this.energy = state.energy !== undefined ? state.energy : 100.0;
        this.curiosity = state.curiosity !== undefined ? state.curiosity : 50.0;
        // Dynamic thresholds (persisted in STM.emotional_state.thresholds)
        const persisted = state.thresholds || {};
        this.thresholds = {
            habit: persisted.habit !== undefined ? persisted.habit : 40,
            library: persisted.library !== undefined ? persisted.library : 100
        };

        if (typeof global.trace === 'function') {
            global.trace('HOMEO', `Initialized. Energy: ${this.energy.toFixed(1)}%`, '\x1b[35m');
        } else {
            console.log(`[Homeostasis] Initialized. Energy: ${this.energy.toFixed(1)}%`);
        }
    }

    getThreshold(name) {
        if (!this.thresholds) return (name === 'habit' ? 40 : 100);
        return this.thresholds[name] !== undefined ? this.thresholds[name] : (name === 'habit' ? 40 : 100);
    }

    async check(worldModel, semantic) {
        // Simple decay
        this.energy -= 0.1;

        // Phase 15: Persist to STM
        stm.updateEmotionalState({
            energy: this.energy,
            curiosity: this.curiosity
        });

        // If high energy and idle, reflect (dream)
        if (this.energy > 80) {
            await this.reflect(worldModel, semantic);
        }

        // Phase 28: Dynamic Curiosity Trigger
        // If energy is very high and idle, potentially trigger a curious probe
        if (this.energy > 95 && Math.random() < 0.2) {
            return await this.triggerCuriosity(worldModel, semantic);
        }

        // High energy but no curiosity surge
        if (this.energy > 90 && Math.random() < 0.1) {
            return { type: 'skill', name: 'skill_idle_reflection' };
        }

        return null;
    }

    async triggerCuriosity(worldModel, semantic) {
        if (global.trace) global.trace('HOMEO', 'Curiosity surge! Triggering autonomous probe...', '\x1b[35m');
        this.curiosity = Math.min(100, this.curiosity + 10);
        stm.updateEmotionalState({ curiosity: this.curiosity });
        return { type: 'skill', name: 'skill_curious_query' };
    }

    async reflect(worldModel, semantic) {
        if (!this.episodic || !worldModel || !semantic) return;

        try {
            // Prioritized Sweeping: Check for high surprise first
            let memories = await this.episodic.getHighSurprise(5);
            let type = "High Surprise";

            // If no surprising events, drift to random memories (Plasticity / Creativity)
            if (memories.length === 0) {
                memories = await this.episodic.getRandom(3);
                type = "Random Drift";
            }

            if (memories && memories.length > 0) {
                // Hebbian Pattern Discovery: Look for action chains
                const PATTERN_STATS_FILE = path.join(__dirname, '../data/hot/pattern_stats.json');
                const PATTERNS_COLD_FILE = path.join(__dirname, '../data/cold/patterns.json');

                let patternStats = {};
                if (fs.existsSync(PATTERN_STATS_FILE)) {
                    try { patternStats = JSON.parse(fs.readFileSync(PATTERN_STATS_FILE, 'utf8')); } catch (e) { }
                }

                // Roadmap Phase 2: Extract patterns from Episodic Memory
                const persistentPatterns = await this.episodic.extractPatterns(50);
                if (persistentPatterns.length > 0) {
                    fs.writeFileSync(PATTERNS_COLD_FILE, JSON.stringify({ patterns: persistentPatterns }, null, 2));

                    // Roadmap Phase 3 (Prep): Detect rules from high-confidence patterns
                    for (const p of persistentPatterns) {
                        if (p.frequency >= 5 && p.avg_reward >= 0.95) {
                            if (global.trace) global.trace('ROADMAP', `Learning rule: IF "${p.condition}" THEN "${p.action}"`, '\x1b[34m');
                            await semantic.addRule(p.condition, p.action, p.avg_reward);
                        }
                    }
                }

                for (let i = 0; i < memories.length; i++) {
                    const mem = memories[i];
                    if (global.trace) global.trace('DREAM', `(${type}) Replaying episode ${mem.episode_id}: Action "${mem.action_taken}" | Surprise: ${mem.surprise.toFixed(4)}`, '\x1b[35m');

                    // Re-train World Model on this memory
                    let stateVector = [];
                    try {
                        stateVector = JSON.parse(mem.state_vector);
                    } catch (e) {
                        continue;
                    }

                    const newError = Math.abs(worldModel.train(stateVector, mem.reward));
                    const newSurprise = newError;
                    await this.episodic.updateSurprise(mem.episode_id, newSurprise);

                    // Pattern Tracking (Hebbian Counting)
                    // Phase 28: Fetch the episode that happened immediately after this one for temporal chains
                    try {
                        const nextMem = await this.episodic.getNext(mem.episode_id);
                        if (nextMem && mem.reward >= 0.8 && nextMem.action_taken.includes('feedback')) {
                            const key = `${mem.action_taken}->${nextMem.action_taken}`;
                            if (!patternStats[key]) patternStats[key] = { count: 0, avgReward: 0, trigger: mem.raw_input };
                            patternStats[key].count++;
                            patternStats[key].avgReward = (patternStats[key].avgReward * (patternStats[key].count - 1) + mem.reward) / patternStats[key].count;

                            if (global.trace) global.trace('HEBBIAN', `Pattern detected: ${key} (count=${patternStats[key].count}, reward=${patternStats[key].avgReward.toFixed(2)})`, '\x1b[35m');

                            // Threshold for Draft Promotion: 3 occurrences & high reward
                            if (patternStats[key].count >= 3 && patternStats[key].avgReward >= 0.9) {
                                await this.promoteToDraft(key, patternStats[key]);
                                delete patternStats[key]; // Reset after promotion
                            }
                        }
                    } catch (e) {
                        console.warn("Hebbian sequence check failed:", e);
                    }

                    // Belief consolidation (Phase 5: Adaptive Safety Valve)
                    try {
                        if (mem.raw_input && typeof mem.raw_input === 'string') {
                            const match = mem.raw_input.match(/^(.+?)\s+is\s+(.+?)$/i);
                            if (match) {
                                const subject = match[1].toLowerCase().trim();
                                const property = match[2].toLowerCase().trim();
                                const proposition = `${subject} is ${property}`;

                                // Roadmap Phase 5: Check for contradictions
                                // Find all beliefs about this subject
                                const subNode = await semantic.getNodeByLabel(subject);
                                let conflictResolved = false;

                                if (subNode) {
                                    const siblings = await semantic.getBeliefs(subNode.node_id);
                                    const directConflict = siblings.find(b => b.proposition.startsWith(`${subject} is `) && !b.proposition.includes(property));

                                    if (directConflict) {
                                        if (global.trace) global.trace('VALVE', `Potential contradiction: "${proposition}" vs "${directConflict.proposition}"`, '\x1b[31m');

                                        // Try resolution via symbolic rules (Roadmap Phase 2 rules)
                                        const rules = await semantic.queryRules(subject);
                                        const support = rules.find(r => r.consequent.includes(property));

                                        if (support) {
                                            if (global.trace) global.trace('VALVE', `Resolved via Rule: "${support.antecedent} -> ${support.consequent}" (Confidence: ${support.confidence})`, '\x1b[32m');
                                            // New fact confirmed by rule, proceed to update
                                        } else {
                                            const conflictSupport = rules.find(r => directConflict.proposition.includes(r.consequent));
                                            if (conflictSupport) {
                                                if (global.trace) global.trace('VALVE', `Favoring existing belief due to rule support: ${conflictSupport.consequent}`, '\x1b[33m');
                                                conflictResolved = true; // Stay with existing
                                            } else {
                                                if (global.trace) global.trace('VALVE', `Ambiguous contradiction. Damping confidence.`, '\x1b[33m');
                                                // Instead of new fact, we update both to lower confidence
                                                await semantic.updateBeliefConfidence(directConflict.belief_id, directConflict.confidence * 0.8, 'contradiction_damping');
                                                // We don't return here, we proceed with lower confidence for the new one too
                                            }
                                        }
                                    }
                                }

                                if (!conflictResolved) {
                                    const baseConf = 0.6;
                                    const rewardFactor = (typeof mem.reward === 'number') ? Math.max(0, Math.min(1, mem.reward)) : 0.6;
                                    const finalConf = Math.min(0.95, baseConf + rewardFactor * 0.3);

                                    const existing = await semantic.getBeliefByProposition(proposition);
                                    if (existing && existing.belief_id) {
                                        await semantic.updateBeliefConfidence(existing.belief_id, finalConf, 'replay');
                                    } else {
                                        const actualSubId = subNode ? subNode.node_id : await semantic.getOrCreateNode(subject, 'Concept');
                                        await semantic.addBelief(proposition, finalConf, 'replay', actualSubId);
                                    }
                                }
                                try { await this.episodic.markConsolidated(mem.episode_id); } catch (e) { }
                            }

                            // Roadmap Phase 1/5: Relational Facts (X is in Y)
                            const relMatch = mem.raw_input.match(/^(.+?)\s+is\s+in\s+(.+?)$/i);
                            if (relMatch) {
                                const source = relMatch[1].toLowerCase().trim();
                                const target = relMatch[2].toLowerCase().trim();
                                const sourceId = await semantic.getOrCreateNode(source, 'Concept');
                                const targetId = await semantic.getOrCreateNode(target, 'Concept');
                                await semantic.addRelationship(sourceId, targetId, 'is_in', 1.0);
                                if (global.trace) global.trace('CONSOLIDATION', `Relational Link: ${source} -> is_in -> ${target}`, '\x1b[32m');
                                try { await this.episodic.markConsolidated(mem.episode_id); } catch (e) { }
                            }
                        }
                    } catch (e) { console.warn("Belief consolidation error:", e); }
                }
                // Save updated stats
                fs.writeFileSync(PATTERN_STATS_FILE, JSON.stringify(patternStats, null, 2));
            }

            // Meta-Learning / Regulation
            const recent = await this.episodic.getRecent(10);
            if (recent && recent.length > 0) {
                const totalSurprise = recent.reduce((sum, ep) => sum + (ep.surprise || 0), 0);
                const avgSurprise = totalSurprise / recent.length;
                const newRate = 0.001 + (avgSurprise * 0.1);
                worldModel.learningRate = newRate;
                if (global.trace) global.trace('HOMEO', `Meta-Learning: Avg Surprise ${avgSurprise.toFixed(4)} -> Learning Rate ${newRate.toFixed(4)}`, '\x1b[35m');
            }

            // Dynamic Thresholds
            try {
                const recentExec = await this.episodic.getRecent(10);
                if (recentExec && recentExec.length > 0) {
                    const successCount = recentExec.reduce((sum, ep) => sum + ((ep.reward || 0) >= 0.5 ? 1 : 0), 0);
                    const successProp = successCount / recentExec.length;
                    const baseHabit = this.thresholds.habit || 40;
                    let newHabit = baseHabit;
                    if (successProp < 0.5) newHabit = Math.min(80, baseHabit + (0.5 - successProp) * 80);
                    else if (successProp > 0.8) newHabit = Math.max(20, baseHabit - (successProp - 0.8) * 50);
                    const baseLib = this.thresholds.library || 100;
                    let newLib = baseLib;
                    if (successProp < 0.5) newLib = Math.min(200, baseLib + (0.5 - successProp) * 150);
                    else if (successProp > 0.8) newLib = Math.max(40, baseLib - (successProp - 0.8) * 80);
                    this.thresholds.habit = Math.round(newHabit);
                    this.thresholds.library = Math.round(newLib);
                    stm.updateEmotionalState({ thresholds: this.thresholds });
                    if (global.trace) global.trace('HOMEO', `Adjusted thresholds: habit=${this.thresholds.habit}, library=${this.thresholds.library}`, '\x1b[35m');
                }
            } catch (e) { }

        } catch (err) {
            console.error("Reflection error:", err);
        }
    }

    async promoteToDraft(patternKey, stats) {
        const DRAFTS_FILE = path.join(__dirname, '../data/cold/draft_skills.json');
        let drafts = [];
        if (fs.existsSync(DRAFTS_FILE)) {
            try { drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8')); } catch (e) { }
        }

        const actions = patternKey.split('->');
        const draftID = `hebb_${Date.now()}`;

        const newDraft = {
            draftID: draftID,
            description: `Hebbian promotion of pattern: ${patternKey}`,
            trigger_sample: stats.trigger,
            sequence: actions,
            reward_score: stats.avgReward,
            hebbian: true
        };

        if (!drafts.some(d => d.trigger_sample === stats.trigger)) {
            drafts.push(newDraft);
            fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2));
            if (global.trace) global.trace('HEBBIAN', `Pattern "${patternKey}" promoted to Draft Skills!`, '\x1b[32m');
        }
    }
}

module.exports = Homeostasis;
