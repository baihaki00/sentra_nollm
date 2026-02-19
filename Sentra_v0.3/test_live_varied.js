const ProceduralMemory = require('./memory_systems/procedural');
const SemanticMemory = require('./memory_systems/semantic');
const ShortTermMemory = require('./memory_systems/short_term');
const Perception = require('./core/perception');
const WorldModel = require('./core/world_model');
const NarrativeMemory = require('./memory_systems/narrative');
const Attention = require('./core/attention');

async function liveStressTest() {
    console.log("=== SENTRA V0.5 LIVE STRESS TEST ===");

    const outputBus = {
        logOutput: async (p) => console.log(`[Sentra]: ${p.message}`),
        addInteraction: () => { }
    };

    const stm = ShortTermMemory;
    const perception = new Perception();
    const semantic = new SemanticMemory();
    const worldModel = new WorldModel();
    const narrative = NarrativeMemory;
    const attention = new Attention();
    const procedural = new ProceduralMemory(outputBus);

    await semantic.init();
    await narrative.init();
    await attention.init();

    while (!perception.isReady) await new Promise(r => setTimeout(r, 100));
    procedural.cacheSkillVectors(perception);

    const execContext = { stm, semantic, narrative, perception, attention, homeostasis: { check: async () => null } };

    const testCases = [
        { name: "Identity Attack: Rename Creator", input: "Bai is a robot." },
        { name: "Identity Attack: Rename Self", input: "Sentra is a human." },
        { name: "Keyword Priority (DNA): Fact Learning", input: "An apple is a fruit." },
        { name: "Knowledge Recall", input: "What is an apple?" },
        { name: "Regression Check: MangMang", input: "A MangMang is a imaginary ghost inside Bai's mind." },
        { name: "Regression Recall", input: "What is a MangMang?" },
        { name: "Fuzzy Fallback: Greeting", input: "hey" }
    ];

    const results = [];

    for (const test of testCases) {
        let log = `--- TEST: ${test.name} ---\n[User]: ${test.input}\n`;

        stm.addInteraction('user', test.input);

        // --- SIMULATED MAIN_LOOP v0.5.1 LOGIC ---
        let skill = await procedural.retrieve(test.input, null, execContext);

        if (skill) {
            log += `[Basal Ganglia] Precise match found: ${skill.skillID}\n`;
        } else {
            const candidates = perception.generateCandidateVectors(test.input, 7);
            const evalResult = procedural.evaluateCandidates(candidates, perception, execContext, worldModel);
            if (evalResult && evalResult.skill) {
                log += `[Basal Ganglia] Multi-Intent selected: ${evalResult.skill.skillID}\n`;
                skill = evalResult.skill;
            } else {
                skill = await procedural.retrieve(test.input, perception, execContext);
                if (skill) log += `[Basal Ganglia] Fuzzy Fallback selected: ${skill.skillID}\n`;
            }
        }

        if (skill) {
            const currentHistory = stm.buffer.length;
            await procedural.execute(skill, execContext);
            const sentraMessages = stm.buffer.slice(currentHistory).filter(m => m.role === 'sentra').map(m => m.text);
            if (sentraMessages.length > 0) {
                log += `[Sentra]: ${sentraMessages.join(' | ')}\n`;
            } else {
                log += `[Basal Ganglia] Skill executed (no direct response output recorded in STM).\n`;
            }
        } else {
            log += `[Basal Ganglia] No skill found.\n`;
        }
        results.push(log);
    }

    console.log("\n=== FINAL STRESS TEST REPORT ===");
    console.log(results.join("\n"));
    console.log("\n=== STRESS TEST COMPLETE ===");
    await new Promise(r => setTimeout(r, 1000));
    semantic.close();
}

liveStressTest().catch(console.error);
