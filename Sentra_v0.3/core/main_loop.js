/**
 * Sentra v0.3 - Main Loop
 * The "Heartbeat" of the digital organism.
 * Observe -> Orient -> Decide -> Act
 */

const readline = require('readline');
const Perception = require('./perception');
const Attention = require('./attention');
const SemanticMemory = require('../memory_systems/semantic');
const EpisodicMemory = require('../memory_systems/episodic');
const ProceduralMemory = require('../memory_systems/procedural');
const stm = require('../memory_systems/short_term'); // Phase 12: Prefrontal Cortex
const Homeostasis = require('./homeostasis');
const OutputBus = require('../interfaces/output_bus');
const WorldModel = require('./world_model');
const narrative = require('../memory_systems/narrative'); // Phase 22: Narrative Identity (Ego)
// Phase 22 & Phase 29: ego refactored into attention.js as "Central Attractor"

const fs = require('fs');
const path = require('path');

const perception = new Perception();
const attention = new Attention();
const semantic = new SemanticMemory();
const episodic = new EpisodicMemory();
const inputBus = require('../interfaces/input_bus');
const outputBus = new OutputBus();
const procedural = new ProceduralMemory(outputBus);
const homeostasis = new Homeostasis(episodic);
const worldModel = new WorldModel();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// CLI Flags for Granular Debugging (Phase 22)
const FLAGS = {
    homeo: process.argv.includes('--homeo'),
    stm: process.argv.includes('--stm'),
    inner: process.argv.includes('--inner'),
    valve: process.argv.includes('--valve'),
    dream: process.argv.includes('--dream'),
    sem: process.argv.includes('--sem'),
    all: process.argv.includes('--debugall')
};

/**
 * Robust Logger: Console (Conditional) + Disk (Always)
 */
function trace(type, message, color = '\x1b[0m') {
    const activityLine = `[${type}] ${message}`;

    // Always write to Disk for SBI
    try {
        fs.appendFileSync(path.join(__dirname, '../data/debug.log'), activityLine + '\n');
    } catch (e) { }

    // Conditional Console Log
    const flagKey = type.toLowerCase();
    if (FLAGS.all || FLAGS[flagKey]) {
        console.log(`${color}[${type}]\x1b[0m ${message}`);
    }
}

async function main() {
    const isDebug = process.argv.includes('--debug');
    if (isDebug) console.log(`\x1b[33m[Debug Mode] Verbose logging enabled.\x1b[0m`);

    // Initialize Modules
    await semantic.init();
    await episodic.init();
    await narrative.init(); // Initialize Narrative
    await attention.init(); // Initialize Central Attractor
    perception.loadVectors(); // Ensure vectors loaded

    // Connect Perception to Procedural Memory (Phase 10)
    procedural.cacheSkillVectors(perception);

    // Load persisted inhibited drafts (in-memory set) so rejected drafts survive restarts
    try {
        const inhibitedFile = path.join(__dirname, '../data/hot/inhibited_drafts.json');
        if (fs.existsSync(inhibitedFile)) {
            const raw = fs.readFileSync(inhibitedFile, 'utf8');
            const arr = JSON.parse(raw || '[]');
            global.INHIBITED_DRAFTS = new Set(Array.isArray(arr) ? arr : []);
            console.log(`[Startup] Loaded ${global.INHIBITED_DRAFTS.size} inhibited drafts.`);
        } else {
            // ensure hot directory exists and create empty file
            const hotDir = path.join(__dirname, '../data/hot');
            if (!fs.existsSync(hotDir)) fs.mkdirSync(hotDir, { recursive: true });
            fs.writeFileSync(inhibitedFile, JSON.stringify([], null, 2));
            global.INHIBITED_DRAFTS = new Set();
        }
    } catch (e) {
        console.warn('Failed to load inhibited drafts:', e);
        global.INHIBITED_DRAFTS = new Set();
    }

    // Initial Thought
    console.log(`\x1b[36mSentra v0.5: Cognitive Expansion Active.\x1b[0m`);
    console.log(`--------------------------`);

    // Warm-up vectors
    console.log("Waiting for vectors to load...");
    await new Promise(r => setTimeout(r, 100));

    // Phase 28: Initial Cognitive Handshake
    console.log(`\x1b[35m[Bootstrap]\x1b[0m Establishing Sovereign Identity...`);
    const bootContext = { stm, semantic, episodic, narrative, attention, homeostasis, outputBus, inputBus, perception };
    await procedural.execute('skill_greet', bootContext);

    let lastFocusState = null;
    let lastActionName = null;

    while (true) {
        // Phase 28: Emit Skill Statistics for Brain Inspector
        const skillList = Object.entries(procedural.skills).map(([id, skill]) => ({
            id,
            usage: skill.performance?.usage_count || 0,
            reward: skill.performance?.reward_average || 0.5
        })).filter(s => s.usage > 0);
        trace('SKILL_STATS', JSON.stringify(skillList));

        // 0. Peripheral Sense (The Sensorium)
        const envState = inputBus.scanEnvironment();
        const envSensation = await perception.normalize(envState);
        stm.updateContext('environmental_state', envState);

        // Phase 22: Inject Narrative Identity into STM
        stm.updateContext('narrative_identity', narrative.getBaseContext());

        // Phase 22: Active Initiative (The "Spark")
        // Check internal state and potentially act before asking for input.
        const recommendation = await homeostasis.check(worldModel, semantic);

        // Define Context for potential action
        const context = { stm, semantic, episodic, narrative, attention, homeostasis, outputBus, inputBus, perception };

        if (recommendation) {
            console.log(`\x1b[35m[Initiative]\x1b[0m High drive detected. Executing: ${recommendation.name}`);
            await procedural.execute(recommendation.name, context);
        }

        // 1. Observe (Input)
        const input = await askQuestion(`\nInput > `);

        if (!input || input.trim() === "") continue;
        if (input.toLowerCase() === 'exit') {
            rl.close();
            semantic.close();
            episodic.close();
            break;
        }

        // Detect Negative Feedback (Phase 28 FIX - Sovereign Synthesis)
        const classification = perception.classify(input);
        const isNegativeFeedback = classification === 'negative_feedback';
        if (isNegativeFeedback && lastFocusState && lastActionName) {
            console.log(`\x1b[31m[Neuroplasticity]\x1b[0m Negative feedback detected! Penalizing previous action: ${lastActionName}`);
            const penaltySurprise = Math.abs(worldModel.train(lastFocusState, -1.0)); // Strong negative reward
            console.log(`\x1b[31m[Neuroplasticity]\x1b[0m World Model penalized. Penalty Surprise: ${penaltySurprise.toFixed(4)}`);

            // If it was a learned skill, demote it immediately
            if (lastActionName.startsWith('learned_') || lastActionName.startsWith('auto_')) {
                procedural.demoteSkill(lastActionName);
            }
        }

        // Phase 12: Record to Short-Term Memory (The "Now")
        stm.addInteraction('user', input);

        // Initialize Roadmap Phase 4 Context
        const workingContext = stm.getContext(); // Get working context early to initialize semantic_priming
        if (!workingContext.semantic_priming) workingContext.semantic_priming = [];

        // 2. Orient (Intelligent Retrieval)
        const stateIndices = await perception.normalize(input, semantic, workingContext.semantic_priming);

        // Phase 22 & 29: Central Attractor Dynamics
        // Shift the attractor toward the current input topic
        attention.setAttractor(input);
        if (global.trace) global.trace('ATTENTION', `Central Attractor shifting toward "${input}"`, '\x1b[30m');

        // Update Semantic Priming (Phase 4): Store nodes found in current input for next turn
        const words = input.split(/\s+/).map(w => w.replace(/[.,!?;:]+/g, ''));
        for (const word of words) {
            if (word.length < 3) continue;
            const node = await semantic.getNodeByLabel(word);
            if (node && !workingContext.semantic_priming.includes(node.label)) {
                workingContext.semantic_priming.unshift(node.label);
                if (workingContext.semantic_priming.length > 3) workingContext.semantic_priming.pop(); // Sliding window
            }
        }

        // Roadmap Phase 3: Predict with Semantic Inference
        const prediction = await worldModel.predictWithInference(stateIndices, semantic);

        // Narrative Identity bias
        const focusIndices = narrative.adjustFocus(stateIndices);

        // Phase 22: Reflection Step (The "Inner Monologue")
        if (global.trace) global.trace('INNER', 'Thinking...', '\x1b[33m');

        attention.applyDrift(); // Natural cognitive variability
        // Combine text sensation with environmental sensation
        const combinedSensation = [...new Set([...stateIndices, ...envSensation])];
        const focusState = attention.focus(combinedSensation);
        let surprise = 0; // per-turn surprise/error metric (declared at loop scope)

        // 3.5 Associate (Semantic Memory & RAM)
        const activityLine = `[NEURAL] Activated Prototypes: [${stateIndices.slice(0, 5).join(',')}]`;
        console.log(`\x1b[36m[NEURAL]\x1b[0m Activated Prototypes: [${stateIndices.slice(0, 5).join(',')}]`);

        // Roadmap Phase 4: Data Pipe to SBI
        try {
            fs.appendFileSync(path.join(__dirname, '../data/debug.log'), activityLine + '\n');
        } catch (e) {
            // Silently fail if log is locked/missing
        }

        console.log(`\x1b[35m[Prefrontal]\x1b[0m Context Buffer: ${workingContext.recent_history.length} items.`);

        try {
            const concept = await semantic.getNodeByLabel(input);
            if (concept) {
                console.log(`\x1b[36m[Association]\x1b[0m Recognized Concept: ${concept.label} (${concept.type})`);
            }
        } catch (err) {
            // Ignore semantic errors (likely just not found)
        }

        // 4. Decide (World Model) - Placeholder for Phase 5

        // Act (Procedural Memory & Output Bus)
        let actionName = "thought_loop";
        let generatedResponse = null;
        let expectedResponse = { type: 'statement', confidence: 0 };

        // Define execution context for Phase 22 & 29 (Attention & Narrative)
        const execContext = { homeostasis, stm, perception, semantic, narrative, attention };

        let handledByState = false;

        if (global.PROPOSAL_STATE && global.PROPOSAL_STATE.active) {
            // WE ARE IN PROPOSAL MODE
            const draft = global.PROPOSAL_STATE.draft;
            const classification = perception.classify(input);

            if (classification === 'confirmation') {
                const newSkillId = procedural.solidifySkill(draft.draftID);
                if (newSkillId) {
                    const msg = "Automation successful. I've added a new permanent skill to my repertoire. Executing chain now...";
                    console.log(`\x1b[32m[Sentra]: ${msg}\x1b[0m`);
                    stm.addInteraction('sentra', msg);
                    await procedural.execute(newSkillId, context);
                }
                global.PROPOSAL_STATE = null;
                actionName = "solidify_skill";
                handledByState = true;
            } else if (classification === 'rejection') {
                // 1. Perception: Signal Vector Generation
                const indices = await perception.normalize(input); // Changed lastInput to input
                console.log(`\x1b[30m[NEURAL]: [${indices.join(', ')}]\x1b[0m`);

                // Phase 22 & 29: Central Attractor Dynamics
                // Shift the attractor toward the current input topic
                attention.setAttractor(input); // Changed lastInput to input
                console.log(`\x1b[30m[Attention]: Central Attractor shifting toward "${input}"\x1b[0m`); // Changed lastInput to input
                const msg = "Understood. I'll stick to my current reflexes.";
                console.log(`\x1b[32m[Sentra]: ${msg}\x1b[0m`);
                stm.addInteraction('sentra', msg);
                if (!global.INHIBITED_DRAFTS) global.INHIBITED_DRAFTS = new Set();
                global.INHIBITED_DRAFTS.add(draft.draftID);
                // Persist inhibited drafts to disk
                try {
                    const inhibitedFile = path.join(__dirname, '../data/hot/inhibited_drafts.json');
                    fs.writeFileSync(inhibitedFile, JSON.stringify(Array.from(global.INHIBITED_DRAFTS), null, 2));
                    console.log(`[Persistence] Inhibited draft ${draft.draftID} saved.`);
                } catch (e) {
                    console.warn('Failed to persist inhibited draft:', e);
                }
                global.PROPOSAL_STATE = null;
                actionName = "reject_proposal";
                handledByState = true;
            } else {
                // FALL THROUGH: Input is not a confirmation/rejection, so clearly it's a NEW INTENT
                global.PROPOSAL_STATE = null;
                console.log(`\x1b[33m[Decision]\x1b[0m Proposal ignored. Processing new intent...`);
            }
        }

        // Only proceed if not handled by Proposal/Learning confirmation
        if (!handledByState) {
            if (global.LEARNING_STATE && global.LEARNING_STATE.active) {
                // WE ARE IN TEACHER MODE
                const trigger = global.LEARNING_STATE.trigger;
                const response = input;
                procedural.learnSkill(trigger, response, perception);
                procedural.cacheSkillVectors(perception);
                console.log(`\x1b[32m[Sentra]: Understood. I have learned to reply "${response}".\x1b[0m`);
                stm.addInteraction('sentra', `Understood. I have learned to reply "${response}".`);
                global.LEARNING_STATE = null;
                actionName = "learn_response";
            } else {
                // 5. NORMAL MODE (Flow optimized for Phase 25)
                generatedResponse = null;
                surprise = 0; // aggregated surprise/error for this turn (initialized)

                // Phase 28: Predict expected response type before generating
                expectedResponse = worldModel.predictExpectedResponseType(focusState);

                // Add "Cognitive Jitter" to confidence for high-fidelity visualization
                // Factors in surprise from last turn to make the dial feel "alive"
                const flux = (Math.random() * 0.04) - 0.02; // ±2% jitter
                const stabilityBias = (surprise < 0.1) ? 0.05 : -0.05; // Confidence boost if world is predictable
                const displayConfidence = Math.min(0.98, Math.max(0.1, expectedResponse.confidence + flux + stabilityBias));

                trace('EXPECTATION', `Predicted response type: ${expectedResponse.type} (confidence: ${displayConfidence.toFixed(2)})`, '\x1b[36m');

                // 5.1 First, try to fulfill the immediate intent via PRECISE match (DNA Triggers)
                // Passing null for perception ensures we only do the precise loop inside retrieve
                let skill = procedural.retrieve(input, null, { ...workingContext, homeostasis, attention });

                if (skill) {
                    trace('DECISION', `Precise match found: ${skill.skillID}`, '\x1b[35m');
                } else {
                    // 5.2 Fallback: Multi-Intent evaluation (Generative/Fuzzy Ranking)
                    try {
                        const candidates = perception.generateCandidateVectors(input, 7);
                        const evalResult = procedural.evaluateCandidates(candidates, perception, { ...workingContext, homeostasis }, worldModel);
                        if (evalResult && evalResult.skill) {
                            trace('MULTIINTENT', `Selected skill ${evalResult.skill.skillID} (simReward=${evalResult.score.toFixed(3)}) from candidate #${evalResult.candidateIndex}`, '\x1b[36m');
                            skill = evalResult.skill;
                        }
                    } catch (e) {
                        console.warn("MultiIntent evaluation failed:", e);
                    }

                    // 5.3 Final Fallback: Standard Fuzzy Retrieval (if Multi-Intent didn't find anything confident)
                    if (!skill) {
                        skill = procedural.retrieve(input, perception, { ...workingContext, homeostasis, attention });
                    }
                }
                // (Inner re-initialization removed to avoid shadowing)
                if (skill) {
                    trace('DECISION', `Intent matches skill: ${skill.skillID}`, '\x1b[35m');
                    await procedural.execute(skill, execContext);
                    actionName = skill.skillID;
                    // Phase 28: Capture generated response for adequacy check
                    const recentHistory = stm.getContext().recent_history;
                    const lastSentraMsg = recentHistory.filter(m => m.role === 'sentra').pop();
                    if (lastSentraMsg) generatedResponse = lastSentraMsg.text;
                }

                if (!skill) {
                    console.log(`\x1b[35m[Decision]\x1b[0m No skill found. Entering Teacher Mode.`);
                    const prompt = "I don't know how to respond to that. What should I say?";

                    // Layer 4: Uncertainty-triggered Self-Audit
                    if (expectedResponse.confidence < 0.2) {
                        console.log(`\x1b[33m[Metacognition]\x1b[0m High uncertainty detected (conf: ${expectedResponse.confidence.toFixed(2)}). Requesting clarification.`);
                    }

                    console.log(`\x1b[32m[Sentra]: ${prompt}\x1b[0m`);
                    stm.addInteraction('sentra', prompt);
                    generatedResponse = prompt;
                    global.LEARNING_STATE = { active: true, trigger: input };
                    actionName = "ask_for_help";
                }
            }

            // Phase 28: Adequacy Check - semantic comparison of response vs input intent
            if (generatedResponse && perception.isReady) {
                const inputVector = perception.textToVector(input);
                const responseVector = perception.textToVector(generatedResponse);
                const adequacyDistance = perception.hammingDistance(inputVector, responseVector);
                // Lower distance = higher adequacy (more similar)
                // For adequacy, we want response to be semantically related but not identical
                // Good adequacy: distance between 50-150 (related but distinct)
                // Poor adequacy: distance > 200 (unrelated) or < 30 (too similar/echo)
                const adequacyThreshold = 200;
                const adequacy = adequacyDistance < adequacyThreshold ?
                    Math.max(0, 1 - (adequacyDistance / adequacyThreshold)) : 0;

                console.log(`\x1b[33m[Adequacy Check]\x1b[0m Response adequacy: ${adequacy.toFixed(2)} (distance: ${adequacyDistance})`);

                if (adequacy < 0.3 && actionName !== "ask_for_help" && actionName !== "skill_greet") {
                    console.log(`\x1b[31m[Adequacy Check]\x1b[0m Low adequacy detected. Response may not match intent.`);
                    // Could trigger regeneration or clarification request here
                    // For now, we log it and let the system learn from feedback
                }

                // Phase 28: Compare predicted vs actual response type
                const actualResponseType = perception.classify(generatedResponse);
                if (actualResponseType !== expectedResponse.type) {
                    console.log(`\x1b[33m[Expectation Mismatch]\x1b[0m Expected: ${expectedResponse.type}, Got: ${actualResponseType}`);
                    // Update world model with actual response type for learning and record surprise
                    try {
                        surprise = Math.abs(worldModel.train(focusState, 0.5, actualResponseType));
                    } catch (e) {
                        surprise = 0;
                    }
                    global.WORLD_MODEL_UPDATED = true; // Flag to prevent double update
                }
            }

            // 5.2 Second, check for automation potential AFTER responding
            const draftMatch = procedural.checkDrafts(input, perception);
            if (draftMatch && !global.INHIBITED_DRAFTS?.has(draftMatch.draftID)) {
                const sequenceDesc = draftMatch.sequence.join(' -> ');
                console.log(`\x1b[35m[Prophet]\x1b[0m Anticipating sequence: ${sequenceDesc}`);
                const prompt = `I noticed that "${input}" often leads to: [${sequenceDesc}]. Should I automate this? (Yes/No)`;
                console.log(`\x1b[32m[Sentra]: ${prompt}\x1b[0m`);
                stm.addInteraction('sentra', prompt);
                global.PROPOSAL_STATE = { active: true, draft: draftMatch };
            }
        }

        // 6. Learn (Episodic Memory & Homeostasis)
        // Online Training: Update World Model immediately (if not already updated in adequacy check)
        if (!global.WORLD_MODEL_UPDATED) {
            try {
                surprise = Math.abs(worldModel.train(focusState, 0.5));
            } catch (e) {
                surprise = 0;
            }
            console.log(`\x1b[33m[Neuroplasticity]\x1b[0m World Model updated. Error/Surprise: ${surprise.toFixed(4)}`);
        }
        global.WORLD_MODEL_UPDATED = false; // Reset flag

        // Log the interaction
        // We need to capture the params used during execution. 
        // Procedural.execute should ideally return the params it used for the skill if they were dynamically resolved.
        const lastParams = global.LAST_ACTION_PARAMS || null;
        await episodic.log(focusState, actionName, 0.5, null, surprise, input, lastParams);
        console.log(`\x1b[33m[Hippocampus]\x1b[0m Episode logged.`);
        global.LAST_ACTION_PARAMS = null; // Reset

        // Trigger internal regulation (Reflection)
        await homeostasis.check(worldModel, semantic);

        // Store state for reinforcement in next turn
        lastFocusState = [...focusState];
        lastActionName = actionName;
    }
}


if (require.main === module) {
    main();
}
