/**
 * THE GREAT FLOOD: Volume Teaching Stress Test for Sentra Scaffold
 * Generates 1,000 facts and tests scaling/inference.
 */
const Homeostasis = require('../core/homeostasis');
const EpisodicMemory = require('../memory_systems/episodic');
const SemanticMemory = require('../memory_systems/semantic');
const WorldModel = require('../core/world_model');

async function volumeStressTest() {
    console.log("\x1b[35m=== THE GREAT FLOOD: Volume Teaching Stress Test ===\x1b[0m");

    const episodic = new EpisodicMemory();
    const semantic = new SemanticMemory();
    const worldModel = new WorldModel();

    await episodic.init();
    await semantic.init();

    try {
        // 1. Generate 1,000 facts (Geography Chain)
        // Format: City -> is_in -> State -> is_in -> Country
        console.log("Generating 1,000 relational facts...");
        const cities = 340; // ~1020 facts total
        const facts = [];

        for (let i = 1; i <= cities; i++) {
            const cityName = `City_${i}`;
            const stateName = `State_${Math.ceil(i / 10)}`; // 10 cities per state
            const countryName = `Country_${Math.ceil(i / 100)}`; // 10 states per country

            facts.push(`${cityName} is in ${stateName}`);
            facts.push(`${stateName} is in ${countryName}`);
            facts.push(`${cityName} is a city`);
        }

        // 2. Feed to Episodic Memory
        console.log(`Feeding ${facts.length} facts into episodic memory...`);
        const startTimeLog = Date.now();
        const state = [1, 1, 1];
        for (const fact of facts) {
            await episodic.log(state, 'skill_status', 1.0, state, 0.5, fact);
        }
        const logDuration = Date.now() - startTimeLog;
        console.log(`Logging completed in ${logDuration}ms (Avg: ${(logDuration / facts.length).toFixed(2)}ms per log)`);

        // 3. Trigger Reflection (The "Deep Dream")
        console.log("\nTriggering Large-Scale Reflection (Deep Dream)...");
        const homeostasis = new Homeostasis(episodic);
        homeostasis.energy = 99;

        const startTimeReflect = Date.now();
        // Consolidate in chunks until our test city is in the knowledge graph
        let testCityNode = null;
        let cycles = 0;
        const maxCycles = 500; // Cap to avoid infinite loop

        while (!testCityNode && cycles < maxCycles) {
            await homeostasis.reflect(worldModel, semantic);
            testCityNode = await semantic.getNodeByLabel("city_123");
            cycles++;
            if (cycles % 50 === 0) console.log(`Consolidation Cycle: ${cycles}...`);
        }
        const reflectDuration = Date.now() - startTimeReflect;

        console.log(`Consolidation completed in ${reflectDuration}ms (${cycles} cycles)`);

        if (!testCityNode) {
            throw new Error("Could not consolidate test city within cycle limit.");
        }

        // 4. Test Inference & Retrieval
        console.log("\nTesting Inference (Transitive Reasoning)...");
        const testCity = "City_123";
        const node = testCityNode;
        const startTimeInference = Date.now();
        const inferred = await semantic.inferTransitive(node.node_id, 3, 'is_in');
        const inferenceDuration = Date.now() - startTimeInference;

        console.log(`Inference chain for ${testCity}:`, inferred.map(n => n.label).join(" -> "));
        console.log(`Inference query duration: ${inferenceDuration}ms`);

        // 5. Success Metrics
        const labels = inferred.map(n => n.label);
        const targetCountry = "Country_2"; // City_123 -> State_13 -> Country_2

        if (labels.includes(targetCountry)) {
            console.log("\x1b[32mSTRESS TEST SUCCESS: Inferred deep relationship across 1,000+ facts.\x1b[0m");
        } else {
            console.log("\x1b[31mSTRESS TEST FAILURE: Could not infer deep relationship.\x1b[0m");
        }

    } catch (e) {
        console.error("Stress Test error:", e);
    } finally {
        episodic.close();
        semantic.close();
    }
}

volumeStressTest().catch(console.error);
