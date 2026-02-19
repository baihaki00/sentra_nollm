/**
 * Verification for Roadmap Phase 1: Relationship Graph & Transitive Reasoning
 */
const SemanticMemory = require('../memory_systems/semantic');
const path = require('path');

async function testRoadmapPhase1() {
    console.log("Starting Roadmap Phase 1 Verification...");

    const semantic = new SemanticMemory();
    await semantic.init();

    try {
        // 1. Create Nodes
        console.log("Creating nodes...");
        const poodleId = await semantic.getOrCreateNode("Poodle", "Entity");
        const dogId = await semantic.getOrCreateNode("Dog", "Entity");
        const mammalId = await semantic.getOrCreateNode("Mammal", "Entity");
        const animalId = await semantic.getOrCreateNode("Animal", "Entity");

        // 2. Add Relationships
        console.log("Adding relationships...");
        await semantic.addRelationship(poodleId, dogId, 'is_a', 1.0);
        await semantic.addRelationship(dogId, mammalId, 'is_a', 0.9);
        await semantic.addRelationship(mammalId, animalId, 'is_a', 1.0);

        // 3. Test getRelationships
        console.log("Testing getRelationships...");
        const rels = await semantic.getRelationships(poodleId, 'is_a');
        if (rels.length > 0 && rels[0].label === 'Dog') {
            console.log("\x1b[32mSUCCESS: direct relationship found (Poodle -> is_a -> Dog)\x1b[0m");
        } else {
            console.log("\x1b[31mFAILURE: direct relationship not found\x1b[0m");
        }

        // 4. Test Transitive Inference
        console.log("Testing Transitive Inference (3 hops)...");
        const inferred = await semantic.inferTransitive(poodleId, 3, 'is_a');

        const labels = inferred.map(n => n.label);
        console.log("Inferred chain from Poodle:", labels.join(" -> "));

        if (labels.includes('Animal') && labels.includes('Mammal')) {
            console.log("\x1b[32mSUCCESS: Transitive inference worked! Poodle is an Animal.\x1b[0m");
        } else {
            console.log("\x1b[31mFAILURE: Transitive inference failed to find Animal or Mammal\x1b[0m");
        }

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        semantic.close();
    }
}

testRoadmapPhase1().catch(console.error);
