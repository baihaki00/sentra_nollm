const EpisodicMemory = require('../memory_systems/episodic');
const assert = require('assert');

const episodic = new EpisodicMemory();

setTimeout(async () => {
    try {
        console.log("Test 1: Log Episode");
        const state = [1, 2, 3];
        const action = "Test Action";
        const id = await episodic.log(state, action, 1.0, null, 0);
        console.log(`Episode logged with ID: ${id}`);
        assert(id, "Should return an episode ID");

        console.log("Test 2: Retrieve Recent");
        const recent = await episodic.getRecent(1);
        console.log("Recent Episode:", recent[0]);
        assert.strictEqual(recent[0].action_taken, action, "Action should match");
        assert.deepStrictEqual(JSON.parse(recent[0].state_vector), state, "State vector should match");

        console.log("Test 3: Retrieve Random (Reflection)");
        const random = await episodic.getRandom(1);
        console.log("Random Episode:", random[0]);
        assert(random.length > 0, "Should return at least one episode");

        console.log("Episodic Memory Tests Passed!");
        episodic.close();
    } catch (e) {
        console.error("Test Failed:", e);
        episodic.close();
        process.exit(1);
    }
}, 1000);
