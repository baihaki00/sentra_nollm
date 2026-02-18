const SemanticMemory = require('../memory_systems/semantic');
const assert = require('assert');

// Test Semantic Memory
const sm = new SemanticMemory();

// Give time for DB connection
setTimeout(async () => {
    try {
        console.log("Test 1: Add Node");
        const catId = await sm.addNode("Cat", "Entity");
        console.log(`Node 'Cat' created with ID: ${catId}`);
        assert(catId, "Should return a node ID");

        console.log("Test 2: Retrieve Node");
        const node = await sm.getNode(catId);
        console.log("Retrieved:", node);
        assert.strictEqual(node.label, "Cat", "Label should be Cat");

        console.log("Test 3: Add Edge (Relation)");
        const animalId = await sm.addNode("Animal", "Concept");
        await sm.addEdge(catId, animalId, "is_a");
        console.log(`Edge created: Cat is_a Animal`);

        console.log("Test 4: Get Related");
        const related = await sm.getRelated(catId);
        console.log("Related to Cat:", related);
        assert(related.length > 0, "Should find related nodes");
        assert.strictEqual(related[0].label, "Animal", "Should be related to Animal");

        console.log("Semantic Memory Tests Passed!");
        sm.close();
    } catch (e) {
        console.error("Test Failed:", e);
        sm.close();
        process.exit(1);
    }
}, 1000);
