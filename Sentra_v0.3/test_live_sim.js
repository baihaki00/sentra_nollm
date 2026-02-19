const ProceduralMemory = require('./memory_systems/procedural');
const Perception = require('./core/perception');
const WorldModel = require('./core/world_model');

async function testLiveSimulation() {
    console.log("=== SENTRA V0.5 LIVE RETRIEVAL SIMULATION ===");

    const outputBus = { logOutput: async (p) => console.log(`[Sentra]: ${p.message}`) };
    const perception = new Perception();
    const worldModel = new WorldModel();
    const procedural = new ProceduralMemory(outputBus);

    while (!perception.isReady) await new Promise(r => setTimeout(r, 100));
    procedural.cacheSkillVectors(perception);

    const input = "A MangMang is a imaginary ghost inside Bai's mind.";
    const context = { current_topic: "none" };

    console.log(`\nInput: "${input}"`);

    // SIMULATED MAIN_LOOP LOGIC v0.5.1
    console.log("\n[Step 1] Attempting Precise Retrieval...");
    let skill = await procedural.retrieve(input, null, context);

    if (skill) {
        console.log(`[Result] Precise match found: ${skill.skillID} (PRIORITY WIN)`);
    } else {
        console.log("[Result] No precise match. Falling back to Fuzzy/Multi-Intent...");
        const candidates = perception.generateCandidateVectors(input, 7);
        const evalResult = procedural.evaluateCandidates(candidates, perception, context, worldModel);
        if (evalResult) {
            console.log(`[Result] Fuzzy match found: ${evalResult.skill.skillID}`);
            skill = evalResult.skill;
        }
    }

    console.log("\n--- VERIFICATION ---");
    if (skill && skill.skillID === 'meta_learn_fact') {
        console.log("✅ PASS: Correctly prioritized 'meta_learn_fact' over fuzzy feedback.");
    } else {
        console.log(`❌ FAIL: Got ${skill ? skill.skillID : 'NONE'}`);
    }
}

testLiveSimulation().catch(console.error);
