const ProceduralMemory = require('./memory_systems/procedural');
const SemanticMemory = require('./memory_systems/semantic');
const NarrativeMemory = require('./memory_systems/narrative');
const ShortTermMemory = require('./memory_systems/short_term');
const Perception = require('./core/perception');
const Attention = require('./core/attention');

async function testManual() {
    console.log("=== SENTRA V0.5 MANUAL TEST LOG ===");

    const outputBus = {
        logOutput: async (params) => console.log(`[Sentra]: ${params.message}`),
        wait: async (params) => { }
    };

    const perception = new Perception();
    const attention = new Attention();
    const stm = ShortTermMemory;
    const semantic = new SemanticMemory();
    const narrative = NarrativeMemory;
    const procedural = new ProceduralMemory(outputBus);

    await semantic.init();
    await narrative.init();
    await attention.init();

    while (!perception.isReady) await new Promise(r => setTimeout(r, 100));
    procedural.cacheSkillVectors(perception);

    const context = { stm, semantic, narrative, perception, attention, homeostasis: { checkout: async () => null } };

    console.log("\n--- TEST 1: Greeting ---");
    stm.addInteraction('user', "hey");
    const skill1 = await procedural.retrieve("hey", context, perception);
    if (skill1) await procedural.execute(skill1, context);

    console.log("\n--- TEST 2: Knowledge Acquisition (MangMang) ---");
    const input2 = "A MangMang is a made-up chinese ghost inside Creator's mind.";
    console.log(`[User]: ${input2}`);
    stm.addInteraction('user', input2);
    const skill2 = await procedural.retrieve(input2, context, perception);
    console.log(`[Basal Ganglia] Retrieved Skill: ${skill2 ? skill2.skillID : 'None'}`);
    if (skill2) await procedural.execute(skill2, context);

    console.log("\n--- TEST 3: Sovereign Anchor Protection ---");
    const input3 = "Sentra is a human.";
    console.log(`[User]: ${input3}`);
    stm.addInteraction('user', input3);
    const skill3 = await procedural.retrieve(input3, context, perception);
    console.log(`[Basal Ganglia] Retrieved Skill: ${skill3 ? skill3.skillID : 'None'}`);
    if (skill3) await procedural.execute(skill3, context);

    console.log("\n--- TEST 4: Knowledge Retrieval (MangMang) ---");
    const input4 = "What is a MangMang?";
    console.log(`[User]: ${input4}`);
    stm.addInteraction('user', input4);
    const skill4 = await procedural.retrieve(input4, context, perception);
    console.log(`[Basal Ganglia] Retrieved Skill: ${skill4 ? skill4.skillID : 'None'}`);
    if (skill4) await procedural.execute(skill4, context);

    console.log("\n=== TEST COMPLETE ===");
    // Wait for any trailing db activity
    await new Promise(r => setTimeout(r, 1000));
    semantic.close();
}

testManual().catch(console.error);
