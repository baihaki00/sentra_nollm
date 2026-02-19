/**
 * Verification for Roadmap Phase 5: Adaptive Safety Valve
 */
const Homeostasis = require('../core/homeostasis');
const EpisodicMemory = require('../memory_systems/episodic');
const SemanticMemory = require('../memory_systems/semantic');
const WorldModel = require('../core/world_model');

async function testRoadmapPhase5() {
    console.log("Starting Roadmap Phase 5 Verification...");

    const episodic = new EpisodicMemory();
    const semantic = new SemanticMemory();
    const worldModel = new WorldModel();

    await episodic.init();
    await semantic.init();

    try {
        // 1. Scenario: Establish a "True" fact and a rule
        console.log("Setting up baseline: 'Sky is blue' + rule 'Sky -> blue'");
        const skyId = await semantic.getOrCreateNode("sky", "Concept");
        await semantic.addBelief("sky is blue", 0.9, 'initial', skyId);
        await semantic.addRule("sky", "blue", 1.0);

        // 2. Scenario: Feedback contradictory episode: "Sky is green"
        console.log("Seeding contradictory episode: 'Sky is green'");
        const state = [1, 2, 3];
        await episodic.log(state, 'skill_status', 1.0, state, 0.5, "sky is green");

        // 3. Trigger Reflection
        const homeostasis = new Homeostasis(episodic);
        homeostasis.energy = 95;
        console.log("Running reflection (Safety Valve should trigger)...");
        await homeostasis.reflect(worldModel, semantic);

        // 4. Verify Resolution
        const beliefs = await semantic.getBeliefs(skyId);
        console.log("Beliefs for 'sky':", beliefs.map(b => `${b.proposition} (conf=${b.confidence.toFixed(2)})`));

        const greenBelief = beliefs.find(b => b.proposition === 'sky is green');
        const blueBelief = beliefs.find(b => b.proposition === 'sky is blue');

        if (blueBelief && (!greenBelief || greenBelief.confidence < 0.6)) {
            console.log("\x1b[32mSUCCESS: Safety Valve resolution worked! Favored 'blue' via rule.\x1b[0m");
        } else {
            console.log("\x1b[31mFAILURE: Contradiction not correctly handled.\x1b[0m");
        }

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        episodic.close();
        semantic.close();
    }
}

testRoadmapPhase5().catch(console.error);
