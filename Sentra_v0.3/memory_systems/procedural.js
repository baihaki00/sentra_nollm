/**
 * Sentra v0.3 - Procedural Memory
 * "Basal Ganglia": Skill/Habit manager
 */

const fs = require('fs');
const path = require('path');
// Phase 22 & 29: ego refactored into attention.js

class ProceduralMemory {
    constructor(outputBus) {
        this.outputBus = outputBus;
        this.skills = {};
        this.skillHistory = []; // Phase 28: Repetition Inhibition
        this.lastSkillId = null; // Phase 28: For reward propagation
        this.loadSkills();
    }

    loadSkills() {
        try {
            // Load Core Skills
            const data = fs.readFileSync(path.join(__dirname, '../data/cold/skills_library.json'), 'utf8');
            const library = JSON.parse(data);
            library.skills.forEach(skill => {
                this.skills[skill.skillID] = skill;
            });

            // Load Learned Skills
            const learnedPath = path.join(__dirname, '../data/cold/learned_skills.json');
            if (fs.existsSync(learnedPath)) {
                const learnedData = fs.readFileSync(learnedPath, 'utf8');
                const learnedLibrary = JSON.parse(learnedData);
                learnedLibrary.forEach(skill => {
                    this.skills[skill.skillID] = skill;
                });
            }

            // Phase 28: Initialize Performance stats for ALL skills
            Object.values(this.skills).forEach(skill => {
                if (!skill.performance) {
                    skill.performance = { reward_average: 0.5, usage_count: 0 };
                }
            });

            console.log(`ProceduralMemory: Loaded ${Object.keys(this.skills).length} skills.`);
        } catch (err) {
            console.error("Failed to load skills:", err);
        }
    }

    learnSkill(triggerText, responseText, perception = null) {
        // Phase 11: Skill Aliasing (Deduplication)
        // Check if a skill with this EXACT response already exists
        let existingSkill = null;
        for (const skillId in this.skills) {
            const skill = this.skills[skillId];
            // Check first step for log_output matching response
            if (skill.steps && skill.steps.length > 0 &&
                skill.steps[0].action === 'log_output' &&
                skill.steps[0].params.message === responseText) {
                existingSkill = skill;
                break;
            }
        }

        if (existingSkill) {
            // MERGE into existing skill
            // Avoid duplicates in trigger list
            if (!existingSkill.trigger_intent.includes(triggerText.toLowerCase())) {
                existingSkill.trigger_intent.push(triggerText.toLowerCase());
                console.log(`\x1b[34m[Basal Ganglia]\x1b[0m Merged trigger "${triggerText}" into existing skill: ${existingSkill.skillID}`);

                if (existingSkill.skillID.startsWith('learned_')) {
                    this.saveLearnedSkills();
                } else {
                    // It's a core skill. For now, we update it in memory but can't save to cold storage.
                    // The user accepts this runtime aliasing, or we should create a new learned skill.
                    // Let's create a new skill for Core aliasing to be safe and persistent.

                    const id = `learned_${Date.now()}`;
                    const newSkill = {
                        skillID: id,
                        description: `Learned response to: "${triggerText}"`,
                        trigger_intent: [triggerText.toLowerCase()],
                        steps: [
                            { type: "primitive", action: "log_output", params: { message: responseText } }
                        ]
                    };
                    this.skills[id] = newSkill;
                    this.saveLearnedSkills();
                    console.log(`\x1b[34m[Basal Ganglia]\x1b[0m Learned new alias skill: ${id}`);
                    return;
                }
            }
            return;
        }

        // Default / Safe Path: Create New Skill
        const id = `learned_${Date.now()}`;
        const newSkill = {
            skillID: id,
            description: `Learned response to: "${triggerText}"`,
            trigger_intent: [triggerText.toLowerCase()],
            steps: [
                { type: "primitive", action: "log_output", params: { message: responseText } }
            ]
        };

        this.skills[id] = newSkill;
        this.saveLearnedSkills();
        console.log(`\x1b[34m[Basal Ganglia]\x1b[0m Learned new skill: ${id}`);
    }

    saveLearnedSkills() {
        try {
            const learnedPath = path.join(__dirname, '../data/cold/learned_skills.json');
            // Filter only learned skills from this.skills
            const learnedSkills = Object.values(this.skills).filter(s => s.skillID.startsWith('learned_') || s.skillID.startsWith('auto_'));
            fs.writeFileSync(learnedPath, JSON.stringify(learnedSkills, null, 2));
        } catch (err) {
            console.error("Failed to save learned skills:", err);
        }
    }

    /**
     * Surgical Pruning: Remove a skill from memory and disk.
     */
    forgetSkill(skillId) {
        if (!this.skills[skillId]) return false;

        console.log(`\x1b[31m[Basal Ganglia]\x1b[0m Pruning skill: ${skillId}`);
        delete this.skills[skillId];

        if (skillId.startsWith('learned_') || skillId.startsWith('auto_')) {
            this.saveLearnedSkills();
        } else {
            // Core Skills: Harder to prune as they are in the read-only library.
            // We can "shadow" them by adding them to an inhibition list in STM/Narrative if needed.
            console.warn(`[Basal Ganglia] Cannot permanently delete core skill ${skillId}. Use demotion instead.`);
        }
        return true;
    }

    /**
     * Penalize a skill's weight or bias to reduce its activation probability.
     */
    demoteSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill) return false;

        console.log(`\x1b[33m[Basal Ganglia]\x1b[0m Demoting skill: ${skillId}`);
        if (!skill.performance) skill.performance = { reward_average: 0.5, usage_count: 0 };

        // Drastic reduction to prevent immediate reactivation
        skill.performance.reward_average = Math.max(0, skill.performance.reward_average - 0.2);

        if (skillId.startsWith('learned_') || skillId.startsWith('auto_')) {
            this.saveLearnedSkills();
        }
        return true;
    }

    cacheSkillVectors(perception) {
        if (!perception || !perception.isReady) {
            console.warn("ProceduralMemory: Perception not ready, skipping vector caching.");
            return;
        }

        console.log("ProceduralMemory: Caching skill vectors...");
        let count = 0;

        for (const skillId in this.skills) {
            const skill = this.skills[skillId];
            if (skill.trigger_intent && Array.isArray(skill.trigger_intent)) {
                skill.cachedVectors = skill.trigger_intent.map(trigger => {
                    return {
                        text: trigger,
                        vector: perception.textToVector(trigger)
                    };
                });
                count += skill.trigger_intent.length;
            }
        }
        console.log(`ProceduralMemory: Cached vectors for ${count} triggers.`);
    }

    /**
     * Evaluate multiple candidate latent vectors (multi-intent) and rank possible skills.
     * Strategy: for each candidate vector, find best fuzzy-matched skill (by hamming distance)
     * then use the provided worldModel to predict expected reward for that candidate (simulate).
     * Return the best (skill, score, candidateIdx) or null.
     */
    evaluateCandidates(candidateVectors, perception, context, worldModel) {
        if (!candidateVectors || candidateVectors.length === 0) return null;

        let best = null;

        // For each candidate vector (Buffer), compute active prototype indices and find best matching skill
        for (let c = 0; c < candidateVectors.length; c++) {
            const vec = candidateVectors[c];
            // Get active prototypes for this candidate (k prototypes)
            const active = perception.getActivePrototypes(vec, 5);

            // Find best skill for this candidate via cachedVectors distance
            let candidateBestSkill = null;
            let candidateBestDist = Infinity;

            for (const skillId in this.skills) {
                const skill = this.skills[skillId];
                if (skill.cachedVectors) {
                    for (const cv of skill.cachedVectors) {
                        const dist = perception.hammingDistance(vec, cv.vector);
                        if (dist < candidateBestDist) {
                            candidateBestDist = dist;
                            candidateBestSkill = skill;
                        }
                    }
                }
            }

            if (!candidateBestSkill) continue;

            // --- Phase 28: Semantic Distance Penalty ---
            // Calculate a penalty based on Hamming distance. 
            // dist = 0 -> penalty = 1.0 (no change)
            // dist = 100 (half threshold) -> penalty = 0.5
            // dist = 200 (max threshold) -> penalty = 0.0
            const MAX_DIST = 200;
            const semanticRelevance = Math.max(0, 1 - (candidateBestDist / MAX_DIST));

            // Simulate with worldModel using active prototype indices (multi-step rollout)
            let rawScore = 0;
            try {
                if (typeof worldModel.simulateRollout === 'function') {
                    // Pass the best matching skill so the world model can simulate skill effects
                    rawScore = worldModel.simulateRollout(active, 3, 0.9, candidateBestSkill);
                } else {
                    const sim = worldModel.predict(active);
                    rawScore = (sim && sim.reward) ? sim.reward : 0;
                }
            } catch (e) {
                rawScore = 0;
            }

            // Final Score = Predicted Reward * Semantic Relevance
            // This prevents "Reward Hacking" where a high-reward habit is picked for a low-relevance intent.
            let score = rawScore * semanticRelevance;

            // Phase 28: Repetition Penalty (LIFO Inhibition)
            // If the skill was used in the last 3 steps, penalize it heavily.
            const recency = this.skillHistory.indexOf(candidateBestSkill.skillID);
            if (recency !== -1) {
                const penalty = (3 - recency) * 0.2; // 0.6, 0.4, 0.2
                score *= (1 - penalty);
            }

            // Phase 28: Threshold Rejection
            // If the best match is still semantically garbage (<0.2 relevance), reject.
            if (semanticRelevance < 0.25) score = 0;

            if (!best || score > best.score) {
                best = { skill: candidateBestSkill, score, candidateIndex: c, dist: candidateBestDist, rawScore, relevance: semanticRelevance };
            }
        }

        return (best && best.score > 0.1) ? best : null;
    }

    retrieve(inputIntent, perception = null, context = {}) {
        const inputLower = inputIntent.toLowerCase().trim();
        const currentTopic = context && context.current_topic ? context.current_topic : "none";

        // Helper: Check if skill is valid for current topic
        const isTopicValid = (skill) => {
            if (!skill.required_topic) return true; // Global skill
            return skill.required_topic === currentTopic;
        };

        // META-COGNITION OVERRIDE: If topic is 'learning', we are listening for a definition.
        if (currentTopic === 'learning') {
            const learner = this.skills['meta_learning_response'];
            if (learner) return learner;
        }

        // 0. Exact match on intent triggers (Library Skills)
        // Library skills represent the "DNA" and should be checked first for exact matches.
        for (const skillId in this.skills) {
            const skill = this.skills[skillId];
            if (skill.is_automated || skillId.startsWith('learned_')) continue;
            if (!isTopicValid(skill)) continue;

            // Phase 17 Heuristic: 
            // If input is a question (ends with '?'), do NOT trigger the Fact Learner ('meta_learn_fact').
            if (skillId === 'meta_learn_fact' && inputLower.endsWith('?')) continue;

            if (skill.trigger_intent && Array.isArray(skill.trigger_intent)) {
                const match = skill.trigger_intent.find(trigger => {
                    const triggerLower = trigger.toLowerCase().trim();
                    if (inputLower === triggerLower) return true;

                    // Escape special regex characters in the trigger
                    const escapedTrigger = triggerLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // If trigger is very short (1 word), use exact start/end boundaries
                    // If it's a phrase, allow it to be part of the sentence
                    const regexStr = escapedTrigger.split(' ').length > 1 ? `\\b${escapedTrigger}\\b` : `^${escapedTrigger}([.!?\\s]|$)`;
                    const regex = new RegExp(regexStr, 'i');
                    return regex.test(inputLower);
                });
                if (match) return skill;
            }
        }

        // 1. Check for Automated Habits / Learned Skills
        // Only checked if no permanent library skill matched exactly.
        for (const skillId in this.skills) {
            const skill = this.skills[skillId];
            if (!skill.is_automated && !skillId.startsWith('learned_')) continue;
            if (!isTopicValid(skill)) continue;

            if (skill.trigger_intent && Array.isArray(skill.trigger_intent)) {
                const match = skill.trigger_intent.find(trigger => {
                    const triggerLower = trigger.toLowerCase().trim();
                    if (inputLower === triggerLower) return true;

                    const escapedTrigger = triggerLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escapedTrigger}\\b`, 'i');
                    return regex.test(inputLower);
                });
                if (match) {
                    console.log(`\x1b[36m[Basal Ganglia]\x1b[0m Habit Match: ${skillId}`);
                    return skill;
                }
            }
        }

        // 2. Fuzzy / Vector Match (Organic)
        if (perception && perception.isReady) {
            const inputVector = perception.textToVector(inputIntent);
            let bestSkill = null;
            // Dynamic thresholds (fall back to historical constants)
            const libraryThreshold = (context && context.homeostasis && typeof context.homeostasis.getThreshold === 'function') ? context.homeostasis.getThreshold('library') : 70;
            let bestDist = libraryThreshold; // Phase 22: LIBRARY_THRESHOLD (Tightened from 100 to 70)
            const HABIT_THRESHOLD = 25; // Phase 29: Tightened from 30 to 25 to prevent hijacking

            let matchDetails = "";

            for (const skillId in this.skills) {
                const skill = this.skills[skillId];

                // Topic Filter
                if (!isTopicValid(skill)) continue;

                if (skill.cachedVectors) {
                    for (const cv of skill.cachedVectors) {
                        let dist = perception.hammingDistance(inputVector, cv.vector);

                        // Phase 22 & 29: Central Attractor Bias (Attractor Dynamics)
                        const bias = (context && context.attention) ? context.attention.getBias(cv.vector) : 0;
                        const rawDist = dist;
                        const adjustment = (bias - 0.25) * 120;
                        dist += adjustment;

                        // Phase 27: Apply differentiated thresholds (dynamic if provided by Homeostasis)
                        const currentThreshold = (skill.is_automated || skillId.startsWith('learned_')) ? HABIT_THRESHOLD : bestDist;

                        if (dist < currentThreshold) {
                            bestSkill = skill;
                            // Update bestDist only if it's a library skill (habits have a fixed cap)
                            if (!skill.is_automated && !skillId.startsWith('learned_')) {
                                bestDist = dist;
                            }
                            const sign = adjustment >= 0 ? "+" : "";
                            matchDetails = `"${inputIntent}" ~ "${cv.text}" (raw=${rawDist}, biased=${Math.round(dist)}, pull=${sign}${Math.round(adjustment)})`;
                        }
                    }
                }
            }

            if (bestSkill) {
                console.log(`\x1b[36m[Basal Ganglia]\x1b[0m Fuzzy Match: ${matchDetails}`);
                return bestSkill;
            }

            // Phase 16: Return Unknown Meta-Skill if no good match
            // Only if we have loaded it (bootstrap might be pending)
            if (this.skills['meta_unknown']) {
                console.log(`\x1b[36m[Basal Ganglia]\x1b[0m No confident match (Best Dist > 60). Triggering Curiosity.`);
                return this.skills['meta_unknown'];
            }
        }

        return null; // Fallback to Teacher Mode (Legacy)
    }

    checkDrafts(input, perception) {
        const DRAFTS_FILE = path.join(__dirname, '../data/cold/draft_skills.json');
        if (!fs.existsSync(DRAFTS_FILE)) return null;

        try {
            const drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
            if (drafts.length === 0) return null;

            const inputVector = perception.textToVector(input);
            for (const draft of drafts) {
                // Phase 23: Inhibitory Learning (Skip rejected drafts)
                if (global.INHIBITED_DRAFTS && global.INHIBITED_DRAFTS.has(draft.draftID)) continue;

                const draftVector = perception.textToVector(draft.trigger_sample);
                const dist = perception.hammingDistance(inputVector, draftVector);

                if (dist < 40) {
                    return draft;
                }
            }
        } catch (e) {
            console.error("Failed to check drafts:", e);
        }
        return null;
    }

    solidifySkill(draftId) {
        const DRAFTS_FILE = path.join(__dirname, '../data/cold/draft_skills.json');
        const LEARNED_FILE = path.join(__dirname, '../data/cold/learned_skills.json');

        try {
            let drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
            const draftIndex = drafts.findIndex(d => d.draftID === draftId);
            if (draftIndex === -1) return false;

            const draft = drafts[draftIndex];

            // Convert draft to permanent skill
            const skillId = `auto_${Date.now()}`;
            const newSkill = {
                skillID: skillId,
                description: draft.description,
                trigger_intent: [draft.trigger_sample.toLowerCase()],
                parameters: draft.params_sample || {}, // Use captured params
                steps: draft.sequence.map(action => {
                    // If the action is a skill itself, pass params through if they match
                    const step = { type: "skill", name: action };
                    if (draft.params_sample) {
                        step.params = {};
                        for (let k in draft.params_sample) {
                            step.params[k] = `{${k}}`;
                        }
                    }
                    return step;
                }),
                is_automated: true
            };

            // Add to memory
            this.skills[skillId] = newSkill;

            // Save to learned_skills.json
            let learned = [];
            if (fs.existsSync(LEARNED_FILE)) {
                learned = JSON.parse(fs.readFileSync(LEARNED_FILE, 'utf8'));
            }
            learned.push(newSkill);
            fs.writeFileSync(LEARNED_FILE, JSON.stringify(learned, null, 2));

            // Remove from drafts
            drafts.splice(draftIndex, 1);
            fs.writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2));

            console.log(`\x1b[32m[Basal Ganglia]\x1b[0m Draft ${draftId} solidified into permanent skill: ${skillId}`);
            return skillId; // Return ID so main loop can execute it
        } catch (e) {
            console.error("Failed to solidify skill:", e);
            return false;
        }
    }

    async execute(skillIdOrObj, context = {}, overrides = null) {
        let skill = skillIdOrObj;

        if (typeof skillIdOrObj === 'string') {
            skill = this.skills[skillIdOrObj];
        }

        if (!skill) {
            console.error(`ProceduralMemory: Skill not found: ${skillIdOrObj}`);
            return false;
        }

        const effectiveParams = { ...(skill.parameters || {}), ...(overrides || {}) };
        console.log(`\x1b[34m[Basal Ganglia]\x1b[0m Executing Skill: ${skill.skillID}`);

        // Phase 28: Update Usage Telemetry
        if (!skill.performance) skill.performance = { usage_count: 0, reward_average: 0.5 };
        skill.performance.usage_count++;

        // Track for reward propagation (last non-meta skill usually)
        if (!skill.skillID.startsWith('meta_')) {
            this.lastSkillId = skill.skillID;
        }

        // Phase 28: Update History for Inhibition
        this.skillHistory.unshift(skill.skillID);
        if (this.skillHistory.length > 5) this.skillHistory.pop();

        global.LAST_ACTION_PARAMS = effectiveParams;

        for (let step of skill.steps) {
            try {
                if (effectiveParams && step.params) {
                    const resolvedParams = { ...step.params };
                    for (const key in resolvedParams) {
                        if (typeof resolvedParams[key] === 'string') {
                            for (const pKey in effectiveParams) {
                                resolvedParams[key] = resolvedParams[key].replace(`{${pKey}}`, effectiveParams[pKey]);
                            }
                        }
                    }
                    step = { ...step, params: resolvedParams };
                }

                let success = true;
                if (step.type === 'primitive') {
                    success = await this.executePrimitive(step, context, skill);
                } else if (step.type === 'skill') {
                    const subParams = { ...skill.parameters, ...step.params };
                    success = await this.execute(step.name, context, subParams);
                }

                if (success === false) {
                    console.log(`\x1b[33m[Basal Ganglia]\x1b[0m Step failed. Breaking chain for ${skill.skillID}`);
                    return false;
                }
            } catch (err) {
                console.error(`Error executing step in ${skill.skillID}:`, err);
                return false;
            }
        }
        return true;
    }

    /**
     * Phase 27: Centralized Primitive Execution
     * Returns true on success, false on failure (to break chain).
     */
    async executePrimitive(step, context, parentSkill) {
        try {
            if (step.action === 'log_output') {
                await this.outputBus.logOutput(step.params);
                if (context && context.stm) context.stm.addInteraction('sentra', step.params.message);
                return true;
            } else if (step.action === 'wait') {
                await this.outputBus.wait(step.params);
                return true;
            } else if (step.action === 'report_status') {
                if (context && context.homeostasis) {
                    const energy = context.homeostasis.energy.toFixed(1);
                    const msg = `[Internal State] Energy: ${energy}%`;
                    await this.outputBus.logOutput({ message: msg });
                    if (context.stm) context.stm.addInteraction('sentra', msg);
                    return true;
                }
                return false;
            } else if (step.action === 'check_environment') {
                if (context && context.stm && context.stm.context.environmental_state) {
                    const env = context.stm.context.environmental_state;
                    const freeMemGB = (env.free_memory / (1024 * 1024 * 1024)).toFixed(2);
                    const report = `[Sensorium] OS: ${env.platform} | Workspace: ${env.cwd} | Free Mem: ${freeMemGB}GB`;
                    await this.outputBus.logOutput({ message: report });
                    if (context.stm) context.stm.addInteraction('sentra', report);
                    return true;
                }
                return false;
            } else if (step.action === 'learn_fact') {
                if (context && context.stm) {
                    const lastUserMsg = context.stm.getContext().recent_history.filter(m => m.role === 'user').pop();
                    if (lastUserMsg) {
                        const text = lastUserMsg.text.trim();
                        if (text.endsWith('?')) return false;
                        const match = text.match(/^(?:(?:a|an)\b\s+)?(.+?)\s+is\s+(?:(?:a|an)\b\s+)?(.+)/i);
                        if (match) {
                            const subject = match[1].toLowerCase().trim();
                            const object = match[2].toLowerCase().trim().replace(/[.!?]+$/, "");
                            if (context.semantic) {
                                // Phase 29: Sovereign Anchor Check (Dilation)
                                const existingNode = await context.semantic.getNodeByLabel(subject);
                                if (existingNode && existingNode.is_locked) {
                                    console.log(`\x1b[35m[Dilation]\x1b[0m Node "${subject}" is locked. Allowing additive expansion...`);
                                }

                                const subId = await context.semantic.getOrCreateNode(subject, 'Concept');
                                const objId = await context.semantic.getOrCreateNode(object, 'Concept');
                                await context.semantic.addEdge(subId, objId, 'is_a');
                                const msg = `I have updated my internal model: [${subject}] -> is_a -> [${object}]`;
                                await this.outputBus.logOutput({ message: msg });
                                context.stm.addInteraction('sentra', msg);

                                // Record as a belief node for later consolidation and confidence tracking
                                try {
                                    const proposition = `${subject} is ${object}`;
                                    // initial confidence from direct user teaching
                                    await context.semantic.addBelief(proposition, 0.75, 'user', subId);
                                } catch (e) {
                                    // ignore belief recording errors
                                }

                                return true;
                            }
                        }
                    }
                }
                await this.outputBus.logOutput({ message: "I couldn't parse the fact structure. Try 'X is Y'." });
                return false;
            } else if (step.action === 'synthesize') {
                const label = step.params.nodeLabel || step.params.subject;
                if (!label) return false;

                const response = await this.synthesizeSentence(label, context);
                await this.outputBus.logOutput({ message: response });
                if (context && context.stm) context.stm.addInteraction('sentra', response);
                return true;
            } else if (step.action === 'explain_concept') {
                // Phase 17.5 & 29: Transitive Reasoning (Inference)
                if (context && context.stm && context.semantic) {
                    const history = context.stm.getContext().recent_history.filter(m => m.role === 'user').reverse();
                    let match = null;
                    let label = null;

                    for (const msg of history) {
                        match = msg.text.match(/(?:what|who|explain|tell me about) (?:is|are|about|is a|is an) (?:(?:a|an|the)\b\s+)?(.+)\?/i) ||
                            msg.text.match(/^(?:explain|describe|tell me about) (.+)/i);
                        if (match) {
                            label = match[1].toLowerCase().trim().replace(/[.!?]+$/, "");
                            break;
                        }
                    }

                    if (label) {
                        // Phase 28/29: Pronoun Resolution
                        const alias = await context.semantic.resolveAlias(label);
                        if (alias) label = alias.canonical_label;

                        // Use synthesis engine for explanation
                        const response = await this.synthesizeSentence(label, context);
                        await this.outputBus.logOutput({ message: response });
                        if (context.stm) context.stm.addInteraction('sentra', response);
                        return true;
                    }
                }
                return false;
            }
            else if (step.action === 'summarize_text') {
                // Layer 3: Summarization
                const textToSummarize = step.params.text || (context.stm ? context.stm.getContext().recent_history[0]?.text : "");
                if (textToSummarize) {
                    const words = textToSummarize.split(/\s+/);
                    if (words.length > 20) {
                        const summary = words.slice(0, 15).join(' ') + "... [Condensate]";
                        await this.outputBus.logOutput({ message: `Summary: ${summary}` });
                        return true;
                    }
                }
                return false;
            } else if (step.action === 'compare_concepts') {
                // Layer 3: Comparison logic
                const { conceptA, conceptB } = step.params;
                if (context.semantic && conceptA && conceptB) {
                    const nodeA = await context.semantic.getNodeByLabel(conceptA.toLowerCase());
                    const nodeB = await context.semantic.getNodeByLabel(conceptB.toLowerCase());
                    if (nodeA && nodeB) {
                        const relsA = await context.semantic.getRelated(nodeA.node_id);
                        const relsB = await context.semantic.getRelated(nodeB.node_id);
                        const shared = relsA.filter(rA => relsB.some(rB => rB.label === rA.label && rB.relation === rA.relation));
                        const diffA = relsA.filter(rA => !relsB.some(rB => rB.label === rA.label));
                        const diffB = relsB.filter(rB => !relsA.some(rA => rA.label === rB.label));

                        let msg = `Comparison [${conceptA} vs ${conceptB}]: `;
                        if (shared.length > 0) msg += `Shared: ${shared.map(s => s.label).join(', ')}. `;
                        if (diffA.length > 0) msg += `${conceptA} unique: ${diffA.map(d => d.label).join(', ')}. `;
                        if (diffB.length > 0) msg += `${conceptB} unique: ${diffB.map(d => d.label).join(', ')}. `;
                        await this.outputBus.logOutput({ message: msg });
                        return true;
                    }
                }
                return false;
            } else if (step.action === 'critique_result') {
                // Layer 3: Self-Critique
                const lastResponse = context.stm ? context.stm.getContext().recent_history.find(m => m.role === 'sentra')?.text : null;
                if (lastResponse) {
                    const evaluation = lastResponse.length > 100 ? "Response is comprehensive." : "Response is concise but may lack depth.";
                    await this.outputBus.logOutput({ message: `[Critique] ${evaluation}` });
                    return true;
                }
                return false;
            } else if (step.action === 'adjust_reward') {
                if (context && context.homeostasis && context.homeostasis.episodic) {
                    const rewardValue = step.params.value ?? 0.5;
                    const recent = await context.homeostasis.episodic.getRecent(1);
                    if (recent && recent.length > 0) {
                        await context.homeostasis.episodic.updateReward(recent[0].episode_id, rewardValue);

                        // Phase 28: Propagate to in-memory Procedural Memory for SBI synchronization
                        const targetSkillId = this.lastSkillId;
                        if (targetSkillId && this.skills[targetSkillId]) {
                            const skill = this.skills[targetSkillId];
                            if (!skill.performance) skill.performance = { reward_average: 0.5, usage_count: 1 };

                            // Moving Average: W_new = W_old * 0.8 + Reward * 0.2
                            skill.performance.reward_average = (skill.performance.reward_average * 0.8) + (rewardValue * 0.2);
                            console.log(`\x1b[34m[Basal Ganglia]\x1b[0m Propagated reward ${rewardValue.toFixed(2)} to skill: ${targetSkillId} (New Avg: ${skill.performance.reward_average.toFixed(2)})`);

                            // Persist if it's a learned skill
                            if (targetSkillId.startsWith('learned_') || targetSkillId.startsWith('auto_')) {
                                this.saveLearnedSkills();
                            }
                        }

                        await this.outputBus.logOutput({ message: step.params.confirm || "Reinforcement noted." });
                        return true;
                    }
                }
                return false;
            } else if (step.action === 'meta_reflect') {
                if (context && context.narrative) {
                    await context.narrative.addAchievement(step.params.achievement || "Reflection.");
                    return true;
                }
                return false;
            } else if (step.action === 'log_thought') {
                console.log(`\x1b[33m[Thought]\x1b[0m ${step.params.thought || "...thinking..."}`);
                return true;
            } else if (step.action === 'write_file') {
                const fs = require('fs');
                const targetPath = step.params.path || 'sentra_notes.txt';
                const absolutePath = path.isAbsolute(targetPath) ? targetPath : path.join(__dirname, '..', targetPath);
                if (step.params.append) fs.appendFileSync(absolutePath, step.params.content + '\n');
                else fs.writeFileSync(absolutePath, step.params.content);
                return true;
            } else if (step.action === 'execute_shell') {
                const { execSync } = require('child_process');
                const cmd = step.params.command;
                // Hardened whitelist
                const safeWhitelist = /^(dir|ls|echo|cd|status|report|whoami|pwd|date|time)/i;
                const destructive = /rm -rf|del \/s|format|mkfs|truncate|\>|\||\&/i;

                if (!safeWhitelist.test(cmd.split(' ')[0]) || destructive.test(cmd)) {
                    console.warn(`[Basal Ganglia] Blocked unsafe shell command: ${cmd}`);
                    return false;
                }

                try {
                    const output = execSync(cmd, { timeout: 5000 }).toString(); // 5s timeout
                    await this.outputBus.logOutput({ message: `[Motor] Output:\n${output}` });
                    return true;
                } catch (e) {
                    console.error("Shell execution failed:", e.message);
                    return false;
                }
            } else if (step.action === 'extract_fact') {
                if (context && context.stm) {
                    const lastMsg = context.stm.getLastUserMessage();
                    if (lastMsg) {
                        const re = new RegExp(step.params.regex, 'i');
                        const match = lastMsg.text.match(re);
                        if (match && match[1]) {
                            const value = match[1].trim();
                            context.stm.setFact(step.params.key, value);
                            const query = (step.params.confirm || "Saved.").replace("{value}", value);
                            await this.outputBus.logOutput({ message: query });
                            context.stm.addInteraction('sentra', query);
                        }
                    }
                }
                return true;
            } else if (step.action === 'recall_fact') {
                if (context && context.stm) {
                    const value = context.stm.getFact(step.params.key);
                    const msg = value ? step.params.template.replace("{value}", value) : step.params.fallback;
                    await this.outputBus.logOutput({ message: msg });
                    context.stm.addInteraction('sentra', msg);
                }
                return true;
            } else if (step.action === 'set_topic') {
                if (context && context.stm) {
                    context.stm.setTopic(step.params.topic);
                    const msg = `Topic set to: ${step.params.topic}`;
                    await this.outputBus.logOutput({ message: msg });
                    context.stm.addInteraction('sentra', msg);
                }
                return true;
            } else if (step.action === 'set_focus') {
                if (context && context.stm) context.stm.setFocus(step.params.entity);
                return true;
            } else if (step.action === 'recall_focus') {
                if (context && context.stm) {
                    const focus = context.stm.getFocus();
                    const msg = focus ? step.params.template.replace("{value}", focus) : step.params.fallback;
                    await this.outputBus.logOutput({ message: msg });
                    context.stm.addInteraction('sentra', msg);
                }
                return true;
            } else if (step.action === 'learn_concept') {
                if (context && context.stm) {
                    const history = context.stm.buffer;
                    let definition = null, trigger = null;
                    let userCount = 0;
                    for (let i = history.length - 1; i >= 0; i--) {
                        if (history[i].role === 'user') {
                            userCount++;
                            if (userCount === 1) definition = history[i].text;
                            if (userCount === 2) { trigger = history[i].text; break; }
                        }
                    }
                    if (trigger && definition) {
                        this.learnSkill(trigger, definition, context.perception);
                        this.cacheSkillVectors(context.perception);
                        const msg = step.params.confirm || "I have learned that.";
                        await this.outputBus.logOutput({ message: msg });
                        context.stm.addInteraction('sentra', msg);
                    } else {
                        await this.outputBus.logOutput({ message: "I lost my train of thought." });
                    }
                }
            } else if (step.action === 'report_identity') {
                if (context && context.narrative) {
                    const id = context.narrative.getIdentity();
                    const arc = context.narrative.getNarrative();
                    if (id && arc) {
                        const msg = `I am ${id.name} (v${id.version}). My current operative state is "${arc.current_state}". My core directive: ${id.core_directive}`;
                        await this.outputBus.logOutput({ message: msg });
                        if (context.stm) context.stm.addInteraction('sentra', msg);
                        return true;
                    }
                }
                return false;
            }
            return true;
        } catch (e) {
            console.error("Primitive Error:", e);
            return false;
        }
    }

    /**
     * Data-Driven Natural Language Synthesis
     * Generates a sentence by traversing the Knowledge Graph.
     * Adheres to the Tabula Rasa principle: forms words from facts.
     */
    async synthesizeSentence(subject, context) {
        if (!context || !context.semantic) return `I know of ${subject}.`;

        const node = await context.semantic.getNodeByLabel(subject.toLowerCase());
        if (!node) return `I have no memory of ${subject}.`;

        const rels = await context.semantic.getRelationships(node.node_id);
        if (rels.length === 0) {
            // Identity Fallback: Query narrative memory if it's the core self
            const identityLabels = ['sentra', 'self', 'me'];
            if (identityLabels.includes(subject.toLowerCase())) {
                const NarrativeMemory = require('./narrative');
                await NarrativeMemory.init();
                return NarrativeMemory.getBaseContext();
            }
            return `${subject} is a recognized concept with no further associations.`;
        }

        // Simple Template-Based Synthesis
        // "Subject [is_a] Object" -> "Subject is a Object"
        const facts = rels.map(r => {
            const rel = r.rel_type || r.relation;
            let template = "[S] [R] [O]";
            if (rel === 'is_a') template = "[S] is a [O]";
            if (rel === 'created_by') template = "[S] was created by [O]";
            if (rel === 'requires') template = "[S] requires [O]";

            return template
                .replace("[S]", subject.charAt(0).toUpperCase() + subject.slice(1))
                .replace("[R]", rel ? rel.replace(/_/g, ' ') : "is associated with")
                .replace("[O]", r.label || r.target_label || "concept");
        });

        console.log(`\x1b[35m[SYNTHESIS]\x1b[0m Synthesizing response from ${facts.length} core facts about "${subject}".`);

        if (facts.length === 1) return facts[0] + ".";
        if (facts.length === 2) return facts.join(" and ") + ".";

        const last = facts.pop();
        return facts.join(", ") + ", and " + last + ".";
    }
}

module.exports = ProceduralMemory;
