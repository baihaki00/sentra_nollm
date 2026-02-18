const EpisodicMemory = require('../memory_systems/episodic');
const WorldModel = require('../core/world_model');
const Homeostasis = require('../core/homeostasis');
const assert = require('assert');

const episodic = new EpisodicMemory();
const wm = new WorldModel();
const homeostasis = new Homeostasis(episodic);

setTimeout(async () => {
    try {
        console.log("Test 1: Setup - Log High/Low Surprise Events");
        // Clear DB or just add distinct ones.
        // High Surprise
        const idHigh = await episodic.log([1, 1, 1], "HighSurpriseAction", 1.0, null, 0.999);
        // Low Surprise
        const idLow = await episodic.log([0, 0, 0], "LowSurpriseAction", 0.0, null, 0.001);

        console.log(`Logged High (${idHigh}) and Low (${idLow}) surprise episodes.`);

        console.log("Test 2: Retrieve High Surprise");
        const highSurprise = await episodic.getHighSurprise(1);
        assert.strictEqual(highSurprise[0].episode_id, idHigh, "Should retrieve the high surprise episode first");
        assert(highSurprise[0].surprise > 0.5, "Surprise should be high");

        console.log("Test 3: Reflection & Update");
        // We simulate a reflection cycle. 
        // The World Model is untrained on [1,1,1] -> Reward 1.0. 
        // It should train, and the surprise should decrease.

        // Mocking console.log to keep output clean or just letting it flow.
        await homeostasis.reflect(wm);

        // Check if surprise was updated in DB
        const updatedEpisode = await episodic.getHighSurprise(5); // Get list again
        const refreshedHigh = updatedEpisode.find(e => e.episode_id === idHigh);

        console.log(`Old Surprise: 0.999 -> New Surprise: ${refreshedHigh.surprise}`);
        assert(refreshedHigh.surprise < 0.999, "Surprise should decrease after training/reflection");

        console.log("Prioritised Sweeping Tests Passed!");
        episodic.close();
    } catch (e) {
        console.error("Test Failed:", e);
        episodic.close();
        process.exit(1);
    }
}, 1000);
