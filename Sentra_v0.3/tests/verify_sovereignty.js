const ProceduralMemory = require('../memory_systems/procedural');
const SemanticMemory = require('../memory_systems/semantic');
const NarrativeMemory = require('../memory_systems/narrative');
const ShortTermMemory = require('../memory_systems/short_term');
const Perception = require('../core/perception');
const attention = new (require('../core/attention'))();

async function verify() {
    console.log("=== Sovereign Identity Final Verification ===");

    const outputBus = {
        logOutput: async (params) => console.log(`[Sentra Output] ${params.message}`),
        wait: async (params) => console.log(`[Motor] Waiting ${params.duration}ms...`)
    };

    const procedural = new ProceduralMemory(outputBus);
    const semantic = new SemanticMemory();
    const narrative = NarrativeMemory;
    const stm = ShortTermMemory;
    const perception = new Perception();

    await semantic.init();
    await narrative.init();
    await attention.init(); // Initialize Central Attractor

    // Wait for perception
    while (!perception.isReady) await new Promise(r => setTimeout(r, 100));
    console.log("[System] Perception Ready. Caching skills...");
    procedural.cacheSkillVectors(perception);

    const context = { stm, semantic, narrative, perception, attention, homeostasis: { check: async () => null } };

    console.log("\n--- TEST 1: skill_greet ---");
    await procedural.execute('skill_greet', context);

    console.log("\n--- TEST 2: skill_help ---");
    await procedural.execute('skill_help', context);

    console.log("\n--- TEST 3: meta_explain_concept (Sentra) ---");
    stm.addInteraction('user', "what is Sentra?");
    await procedural.execute('meta_explain_concept', context);

    console.log("\n=== Verification Complete ===");
    semantic.close();
}

verify().catch(err => {
    console.error("Verification Failed:", err);
    process.exit(1);
});
