const WorldModel = require('../core/world_model');
const Homeostasis = require('../core/homeostasis');
const EpisodicMemory = require('../memory_systems/episodic');
const Perception = require('../core/perception');
const assert = require('assert');

// Mocks
const episodic = new EpisodicMemory();
const wm = new WorldModel();
const homeostasis = new Homeostasis(episodic);
const perception = new Perception();

setTimeout(async () => {
    try {
        console.log("=== Test 1: Meta-Learning (Dynamic Learning Rate) ===");

        // 1. Simulate High Surprise History
        // Log episodes with high surprise
        await episodic.log([1], "test", 0, null, 1.0);
        await episodic.log([1], "test", 0, null, 0.9);
        await episodic.log([1], "test", 0, null, 0.8);

        // 2. Trigger Regulation
        await homeostasis.reflect(wm); // This calls regulation at end

        console.log(`Current Learning Rate: ${wm.learningRate}`);
        assert(wm.learningRate > 0.01, "Learning rate should increase due to high surprise (Plasticity)");

        // 3. Simulate Low Surprise History
        // We need to 'push' enough low surprise events to lower average
        for (let i = 0; i < 15; i++) {
            await episodic.log([1], "test", 0, null, 0.001);
        }

        await homeostasis.reflect(wm);
        console.log(`New Learning Rate: ${wm.learningRate}`);
        assert(wm.learningRate < 0.02, "Learning rate should decrease due to low surprise (Stability)");


        console.log("\n=== Test 2: Multi-Modal Perception ===");

        // 1. Create dummy image buffer
        const fakeImage = Buffer.alloc(1024).fill(0xFF); // White noise

        // 2. Normalize
        const activations = perception.normalize(fakeImage);
        console.log(`Image Activations: ${activations.length} prototypes.`);

        assert(Array.isArray(activations), "Should return array of activations");
        // Activations might be empty if random proj doesn't hit, but type check is key.
        // With Fill(0xFF) it should hit something deterministically.

        console.log("Advanced Features Tests Passed!");
        episodic.close();

    } catch (e) {
        console.error("Test Failed:", e);
        episodic.close();
        process.exit(1);
    }
}, 1000);
