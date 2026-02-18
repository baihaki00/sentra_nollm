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

const perception = new Perception();
const attention = new Attention();
const semantic = new SemanticMemory();
const episodic = new EpisodicMemory();
const outputBus = new OutputBus();
const procedural = new ProceduralMemory(outputBus);
const homeostasis = new Homeostasis(episodic);
const worldModel = new WorldModel();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    // Initialize Modules
    await semantic.init();
    await episodic.init();
    perception.loadVectors(); // Ensure vectors loaded

    // Connect Perception to Procedural Memory (Phase 10)
    procedural.cacheSkillVectors(perception);

    // Initial Thought
    console.log(`\x1b[36mSentra v0.4: Cognitive Expansion Active.\x1b[0m`);
    console.log(`--------------------------`);

    // Warm-up vectors
    console.log("Waiting for vectors to load...");
    await new Promise(r => setTimeout(r, 100));

    while (true) {
        // 1. Observe (Input)
        const input = await askQuestion(`\nInput > `);

        if (!input || input.trim() === "") continue;
        if (input.toLowerCase() === 'exit') {
            rl.close();
            semantic.close();
            episodic.close();
            break;
        }

        // Phase 12: Record to Short-Term Memory (The "Now")
        stm.addInteraction('user', input);

        // 2. Observe (Perception)
        const sensation = perception.normalize(input);

        // 3. Orient (Attention)
        const focusState = attention.focus(sensation);

        // 3.5 Associate (Semantic Memory & RAM)
        console.log(`\x1b[36m[Neural Activity]\x1b[0m Activated Prototypes: [${sensation.slice(0, 5).join(',')}]`);
        const context = stm.getContext();
        console.log(`\x1b[35m[Prefrontal]\x1b[0m Context Buffer: ${context.recent_history.length} items.`);

        try {
            const concept = await semantic.getNodeByLabel(input);
            if (concept) {
                console.log(`\x1b[36m[Association]\x1b[0m Recognized Concept: ${concept.label} (${concept.type})`);
            }
        } catch (err) {
            // Ignore semantic errors (likely just not found)
        }

        // 4. Decide (World Model) - Placeholder for Phase 5

        // 5. Act (Procedural Memory & Output Bus)
        let actionName = "thought_loop";

        if (global.LEARNING_STATE && global.LEARNING_STATE.active) {
            // WE ARE IN TEACHER MODE
            const trigger = global.LEARNING_STATE.trigger;
            const response = input;

            // Phase 11: Pass perception to update cache if alias created
            procedural.learnSkill(trigger, response, perception);

            // Re-cache vectors (handled partly inside learnSkill if optimized, but doing it here ensures safety)
            procedural.cacheSkillVectors(perception);

            console.log(`\x1b[32m[Sentra]: Understood. I have learned to reply "${response}".\x1b[0m`);

            // Log Sentra's output to STM
            stm.addInteraction('sentra', `Understood. I have learned to reply "${response}".`);

            // Reset State
            global.LEARNING_STATE = null;
            actionName = "learn_response";

        } else {
            // NORMAL MODE
            // Phase 10: Pass perception for fuzzy matching
            // Phase 12: Pass Context for future contextual retrieval
            const skill = procedural.retrieve(input, perception, stm.getContext());

            if (skill) {
                console.log(`\x1b[35m[Decision]\x1b[0m Intent matches skill: ${skill.skillID}`);

                // Pass context (homeostasis AND stm) for introspection and logging
                // We pass 'stm' so the primitive can log the output if needed, or we can check 'executed' status
                const executionResult = await procedural.execute(skill, { homeostasis, stm, perception, semantic });

                // Note: procedural.execute currently returns true/false. 
                // In Phase 12, we rely on procedural.execute to log to STM if we modify it, 
                // OR we accept that for now only User input is in RAM until we upgrade procedural.js

                actionName = skill.skillID;
            } else {
                console.log(`\x1b[35m[Decision]\x1b[0m No skill found. Entering Teacher Mode.`);
                const prompt = "I don't know how to respond to that. What should I say?";
                console.log(`\x1b[32m[Sentra]: ${prompt}\x1b[0m`);

                stm.addInteraction('sentra', prompt);

                // Set State to LEARNING
                global.LEARNING_STATE = {
                    active: true,
                    trigger: input
                };
                actionName = "ask_for_help";
            }
        }

        // 6. Learn (Episodic Memory & Homeostasis)
        // Online Training: Update World Model immediately
        const surprise = Math.abs(worldModel.train(focusState, 0.5));
        console.log(`\x1b[33m[Neuroplasticity]\x1b[0m World Model updated. Error/Surprise: ${surprise.toFixed(4)}`);

        // Log the interaction
        await episodic.log(focusState, actionName, 0.5, null, surprise);
        console.log(`\x1b[33m[Hippocampus]\x1b[0m Episode logged.`);

        // Trigger internal regulation (Reflection)
        await homeostasis.check(worldModel);
    }
}

if (require.main === module) {
    main();
}
