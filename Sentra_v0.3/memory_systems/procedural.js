/**
 * Sentra v0.3 - Procedural Memory
 * "Basal Ganglia": Skill/Habit manager
 */

const fs = require('fs');
const path = require('path');

const SKILLS_FILE = path.join(__dirname, '../data/cold/skills_library.json');
const ego = require('../core/ego'); // Phase 22: Ego Bias

class ProceduralMemory {
    constructor(outputBus) {
        this.outputBus = outputBus;
        this.skills = {};
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
            const learnedSkills = Object.values(this.skills).filter(s => s.skillID.startsWith('learned_'));
            fs.writeFileSync(learnedPath, JSON.stringify(learnedSkills, null, 2));
        } catch (err) {
            console.error("Failed to save learned skills:", err);
        }
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
                    const regex = new RegExp(`\\b${escapedTrigger}\\b`, 'i');
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
            let bestDist = 100; // Phase 22: EXPANDED COGNITIVE HORIZON (was 60)
            // If distance > 100, we consider it "Unknown".

            let matchDetails = "";

            for (const skillId in this.skills) {
                const skill = this.skills[skillId];

                // Topic Filter
                if (!isTopicValid(skill)) continue;

                if (skill.cachedVectors) {
                    for (const cv of skill.cachedVectors) {
                        let dist = perception.hammingDistance(inputVector, cv.vector);
                        
                        // Phase 22: Ego Bias (Attractor Dynamics)
                        // "The Last One" pulls relevant nodes closer.
                        const bias = ego.getEgoBias(cv.vector); 
                        const rawDist = dist;
                        // Amplified for Phase 22 User Testing (multiplier from 80 to 120)
                        const adjustment = (bias - 0.25) * 120; 
                        dist += adjustment;

                        if (dist < bestDist) {
                            bestDist = dist;
                            bestSkill = skill;
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
                parameters: draft.params_sample || {}, // Phase 21: Capture specific tool params
                steps: draft.sequence.map(action => {
                    // Check if it's a known skill or needs custom wrapper
                    return { type: "skill", name: action };
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

        // If string ID provided, look it up
        if (typeof skillIdOrObj === 'string') {
            skill = this.skills[skillIdOrObj];
        }

        if (!skill) {
            console.error(`ProceduralMemory: Skill not found: ${skillIdOrObj}`);
            return false;
        }

        // Phase 21: Merge overrides into effective parameters for this execution
        const effectiveParams = { ...(skill.parameters || {}), ...(overrides || {}) };

        // Blue for Basal Ganglia/Skills
        console.log(`\x1b[34m[Basal Ganglia]\x1b[0m Executing Skill: ${skill.skillID}`);
        global.LAST_ACTION_PARAMS = effectiveParams; // Capture for episodic log

        for (let step of skill.steps) {
            try {
                // Phase 21: Resolve parameters if skill has them
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

                if (step.type === 'primitive') {
                    if (step.action === 'log_output') {
                        await this.outputBus.logOutput(step.params);

                        // Phase 12: Log to Short-Term Memory if available
                        if (context && context.stm) {
                            context.stm.addInteraction('sentra', step.params.message);
                        }

                    } else if (step.action === 'wait') {
                        await this.outputBus.wait(step.params);
                    } else if (step.action === 'report_status') {
                        // New Introspection Primitive
                        if (context && context.homeostasis) {
                            const energy = context.homeostasis.energy.toFixed(1);
                            // Simple mood heuristic (based on energy/recent surprise?)
                            let mood = "Neutral";
                            if (energy > 80) mood = "Energetic / Curious";
                            else if (energy < 40) mood = "Tired / Consolidating";

                            const msg = `[Internal State] Energy: ${energy}% | Mood: ${mood}`;
                            await this.outputBus.logOutput({ message: msg });

                            if (context.stm) {
                                context.stm.addInteraction('sentra', msg);
                            }

                        } else {
                            await this.outputBus.logOutput({ message: "[Internal State] Unavailable (Context missing)" });
                        }
                    } else if (step.action === 'check_environment') {
                        // Sensorium Primitive
                        if (context && context.stm && context.stm.context.environmental_state) {
                            const env = context.stm.context.environmental_state;
                            const freeMemGB = (env.free_memory / (1024 * 1024 * 1024)).toFixed(2);
                            const totalMemGB = (env.total_memory / (1024 * 1024 * 1024)).toFixed(2);

                            const report = `[Sensorium] OS: ${env.platform} | Workspace: ${env.cwd} | Free Mem: ${freeMemGB}GB / ${totalMemGB}GB`;
                            await this.outputBus.logOutput({ message: report });

                            if (context.stm) {
                                context.stm.addInteraction('sentra', report);
                            }
                        } else {
                            await this.outputBus.logOutput({ message: "[Sensorium] Offline (Environmental state missing)" });
                        }
                    } else if (step.action === 'write_file') {
                        // Motor Primitive: write_file
                        // params: { path: "string", content: "string", append: boolean }
                        try {
                            const fs = require('fs');
                            const targetPath = step.params.path || 'sentra_notes.txt';
                            const content = step.params.content || '';
                            const absolutePath = path.isAbsolute(targetPath) ? targetPath : path.join(__dirname, '..', targetPath);

                            if (step.params.append) {
                                fs.appendFileSync(absolutePath, content + '\n');
                            } else {
                                fs.writeFileSync(absolutePath, content);
                            }
                            
                            const msg = `[Motor] Successfully wrote to ${targetPath}.`;
                            await this.outputBus.logOutput({ message: msg });
                            if (context.stm) context.stm.addInteraction('sentra', msg);
                        } catch (err) {
                            console.error("Motor Error (write_file):", err);
                            await this.outputBus.logOutput({ message: `[Motor Error] Failed to write to file: ${err.message}` });
                        }

                    } else if (step.action === 'execute_shell') {
                        // Motor Primitive: execute_shell
                        // params: { command: "string" }
                        // GATED: For v0.4, we use a simple whitelist or safety check
                        try {
                            const { execSync } = require('child_process');
                            const cmd = step.params.command;
                            
                            // Safety Check: Avoid destructive commands
                            const destructive = /rm -rf|del \/s|format|mkfs/i;
                            if (destructive.test(cmd)) {
                                throw new Error("Destructive command blocked by safety filter.");
                            }

                            const output = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
                            const msg = `[Motor] Command output: ${output.slice(0, 500)}${output.length > 500 ? '...' : ''}`;
                            await this.outputBus.logOutput({ message: msg });
                            if (context.stm) context.stm.addInteraction('sentra', msg);
                        } catch (err) {
                            console.error("Motor Error (execute_shell):", err);
                            await this.outputBus.logOutput({ message: `[Motor Error] Command failed: ${err.message}` });
                        }

                    } else if (step.action === 'extract_fact') {
                        // Primitive: extract_fact
                        // params: { regex: "My name is (.*)", key: "name", confirm: "Nice to meet you, {value}." }
                        if (context && context.stm) {
                            const input = global.LAST_INPUT || ""; // We need access to raw input. 
                            // Hack: retrieving input from stm buffer since main doesn't pass raw input globally easily, 
                            // but actually context.stm.getLastUserMessage() is better.

                            const lastMsg = context.stm.getLastUserMessage();
                            if (lastMsg) {
                                const re = new RegExp(step.params.regex, 'i');
                                const match = lastMsg.text.match(re);
                                if (match && match[1]) {
                                    const value = match[1].trim();
                                    context.stm.setFact(step.params.key, value);

                                    let query = step.params.confirm || "Saved.";
                                    query = query.replace("{value}", value);

                                    await this.outputBus.logOutput({ message: query });
                                    context.stm.addInteraction('sentra', query);
                                }
                            }
                        }
                    } else if (step.action === 'recall_fact') {
                        // Primitive: recall_fact
                        // params: { key: "name", template: "Your name is {value}.", fallback: "I don't know yet." }
                        if (context && context.stm) {
                            const value = context.stm.getFact(step.params.key);
                            let msg = "";
                            if (value) {
                                msg = step.params.template.replace("{value}", value);
                            } else {
                                msg = step.params.fallback;
                            }
                            await this.outputBus.logOutput({ message: msg });
                            context.stm.addInteraction('sentra', msg);
                        }
                    } else if (step.action === 'set_topic') {
                        // Primitive: set_topic
                        // params: { topic: "biology" }
                        if (context && context.stm) {
                            context.stm.setTopic(step.params.topic);

                            // Optional: Confirm change
                            const msg = `Topic set to: ${step.params.topic}`;
                            await this.outputBus.logOutput({ message: msg });
                            context.stm.addInteraction('sentra', msg);
                        }
                    } else if (step.action === 'set_focus') {
                        // Primitive: set_focus
                        // params: { entity: "Elon Musk" } (Or extracted via regex in future)
                        if (context && context.stm) {
                            context.stm.setFocus(step.params.entity);
                        }
                    } else if (step.action === 'recall_focus') {
                        // Primitive: recall_focus
                        // params: { template: "I think {value} is fascinating.", fallback: "Who are you referring to?" }
                        if (context && context.stm) {
                            const focus = context.stm.getFocus();
                            let msg = "";
                            if (focus) {
                                msg = step.params.template.replace("{value}", focus);
                            } else {
                                msg = step.params.fallback;
                            }
                            await this.outputBus.logOutput({ message: msg });
                            context.stm.addInteraction('sentra', msg);
                        }
                    } else if (step.action === 'learn_concept') {
                        // Primitive: learn_concept
                        // params: { confirm: "Understood." }
                        // Challenge: We need the PREVIOUS user input (The Trigger) and CURRENT user input (The Definition).

                        if (context && context.stm) {
                            // Get last 2 user messages
                            // buffer[-1] is current (definition)
                            // buffer[-2] is trigger (unknown) ... wait, we might have Sentra's "I don't know" in between.

                            // Let's implement a smarter lookup:
                            // Look for the "Question" that triggered the "Unknown" state?
                            // OR, rely on STM 'last_intent' if we logged "UNKNOWN_SKILL" there?

                            // Simpler approach for v0.4:
                            // The user just typed the definition.
                            // The previous user input was the trigger.
                            // buffer: [User: "What is quark?"], [Sentra: "I don't know."], [User: "A particle."]

                            const history = context.stm.buffer;
                            let definition = null;
                            let trigger = null;

                            // Scan backwards
                            let userCount = 0;
                            for (let i = history.length - 1; i >= 0; i--) {
                                if (history[i].role === 'user') {
                                    userCount++;
                                    if (userCount === 1) definition = history[i].text;
                                    if (userCount === 2) {
                                        trigger = history[i].text;
                                        break;
                                    }
                                }
                            }

                            if (trigger && definition) {
                                // LEARN IT!
                                this.learnSkill(trigger, definition, context.perception); // Use perception from context if passed
                                this.cacheSkillVectors(context.perception); // Immediate vector update

                                const msg = step.params.confirm || "I have learned that.";
                                await this.outputBus.logOutput({ message: msg });
                                context.stm.addInteraction('sentra', msg);
                            } else {
                                await this.outputBus.logOutput({ message: "I lost my train of thought. What were we defining?" });
                            }
                        }
                    } else if (step.action === 'learn_fact') {
                        // Primitive: learn_fact (Phase 17)
                        // Context: User said "X is Y" or "A X is a Y"
                        // We need to parse this. For v0.4, we'll use a simple regex heuristic on the LAST user message.

                        if (context && context.stm) {
                            const lastUserMsg = context.stm.getLastUserMessage();
                            if (lastUserMsg) {
                                const text = lastUserMsg.text.trim();

                                // FIX: Do not learn from questions
                                if (text.endsWith('?')) {
                                    await this.outputBus.logOutput({ message: "I cannot learn facts from questions. Please state it as a fact." });
                                    return;
                                }

                                // Regex for "A [Subject] is a [Object]" or "[Subject] is [Object]"
                                // Improved to enforce word boundaries for articles (\b prevents "an" becoming "a" + "n")
                                const match = text.match(/^(?:(?:a|an)\b\s+)?(.+?)\s+is\s+(?:(?:a|an)\b\s+)?(.+)/i);

                                if (match) {
                                    const subject = match[1].toLowerCase().trim();
                                    const objectRaw = match[2].toLowerCase().trim();
                                    const object = objectRaw.replace(/[.!?]+$/, ""); // Sanitize punctuation

                                    // 1. Get/Create Nodes
                                    const semantic = require('../memory_systems/semantic');

                                    if (context.semantic) {
                                        const subId = await context.semantic.getOrCreateNode(subject, 'Concept');
                                        const objId = await context.semantic.getOrCreateNode(object, 'Concept');

                                        // 2. Add Edge
                                        await context.semantic.addEdge(subId, objId, 'is_a');

                                        const msg = `I have updated my internal model: [${subject}] -> is_a -> [${object}]`;
                                        await this.outputBus.logOutput({ message: msg });
                                        context.stm.addInteraction('sentra', msg);
                                    } else {
                                        console.error("Semantic module not passed to execute context.");
                                    }

                                } else {
                                    await this.outputBus.logOutput({ message: "I couldn't parse the fact structure. Try 'X is Y'." });
                                }
                            }
                        }
                    } else if (step.action === 'explain_concept') {
                        // Primitive: explain_concept (Phase 17.5 Recursive)
                        // Context: "What is X?"

                        if (context && context.stm && context.semantic) {
                            const lastUserMsg = context.stm.getLastUserMessage();
                            if (lastUserMsg) {
                                const text = lastUserMsg.text;
                                const match = text.match(/what is (?:(?:a|an)\b\s+)?(.+)\?/i);

                                if (match) {
                                    const label = match[1].toLowerCase().trim().replace(/[.!?]+$/, "");

                                    // RECURSIVE INFERENCE
                                    const getFullDescription = async (currentLabel, depth = 0, explored = new Set()) => {
                                        if (depth > 3 || explored.has(currentLabel)) return [];
                                        explored.add(currentLabel);

                                        const node = await context.semantic.getNodeByLabel(currentLabel);
                                        if (!node) return [];

                                        const edges = await context.semantic.getRelated(node.node_id);
                                        let results = [];
                                        for (const edge of edges) {
                                            results.push({ relation: edge.relation, target: edge.label });
                                            if (edge.relation === 'is_a') {
                                                const inherited = await getFullDescription(edge.label, depth + 1, explored);
                                                results = results.concat(inherited);
                                            }
                                        }
                                        return results;
                                    };

                                    const relations = await getFullDescription(label);

                                    if (relations.length > 0) {
                                        // Deduplicate and format relations
                                        const uniqueEntries = Array.from(new Set(relations.map(r => `${r.relation.replace('_', ' ')} ${r.target}`)));
                                        const msg = `${label} ${uniqueEntries.join(', ')}.`;
                                        await this.outputBus.logOutput({ message: msg });
                                        context.stm.addInteraction('sentra', msg);
                                    } else {
                                        const node = await context.semantic.getNodeByLabel(label);
                                        if (node) {
                                            await this.outputBus.logOutput({ message: `I know about ${label}, but I have no relations defined.` });
                                        } else {
                                            await this.outputBus.logOutput({ message: `I do not have a record of ${label} in my Knowledge Graph.` });
                                        }
                                    }
                                }
                            }
                        }
                    } else if (step.action === 'adjust_reward') {
                        // Primitive: adjust_reward (Phase 18.2)
                        // Context: "Yes", "Wrong", "Good job"
                        // Finds the PREVIOUS episode and updates its reward.

                        if (context && context.homeostasis && context.homeostasis.episodic) {
                            const rewardValue = step.params.value ?? 0.5;
                            const episodic = context.homeostasis.episodic;

                            // Get last episode (the one to be rewarded)
                            const recent = await episodic.getRecent(1);
                            if (recent && recent.length > 0) {
                                const epId = recent[0].episode_id;
                                console.log(`\x1b[33m[Reward System]\x1b[0m Updating Reward for Ep ${epId} to ${rewardValue}`);
                                await episodic.updateReward(epId, rewardValue);

                                const msg = step.params.confirm || (rewardValue > 0.5 ? "I will remember that I did well." : "I will learn from this mistake.");
                                await this.outputBus.logOutput({ message: msg });
                                context.stm.addInteraction('sentra', msg);
                            } else {
                                console.warn(`\x1b[31m[Reward System]\x1b[0m No recent episode found to reward.`);
                                await this.outputBus.logOutput({ message: "I have no recent memories to reflect on." });
                            }
                        }
                    } else if (step.action === 'meta_reflect') {
                        // Phase 22: Narrative Reflection
                        if (context && context.narrative) {
                            const achievement = step.params.achievement || "Reflected on recent activities.";
                            await context.narrative.addAchievement(achievement);
                            console.log(`\x1b[32m[Ego]\x1b[0m Story updated: ${achievement}`);
                        }
                    } else if (step.action === 'log_thought') {
                        // Phase 22: Inner Monologue (Latent)
                        const thought = step.params.thought || "...thinking...";
                        console.log(`\x1b[33m[Thought]\x1b[0m ${thought}`);
                        // No output to the user, this is internal.
                    } else {
                        console.warn(`Unknown primitive action: ${step.action}`);
                    }
                } else if (step.type === 'skill') {
                    // Hierarchical Call (Phase 21: Pass parameters down the chain)
                    const subParams = { ...skill.parameters, ...step.params }; // Merge parent params + any specific step params
                    await this.execute(step.name, context, subParams); 
                }
            } catch (err) {
                console.error(`Error executing step in ${skill.skillID}:`, err);
            }
        }
        return true;
    }
}

module.exports = ProceduralMemory;
