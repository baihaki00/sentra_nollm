/**
 * Verification for Roadmap Phase 3: Inference Engine (Semantic Enrichment)
 */
const Perception = require('../core/perception');
const SemanticMemory = require('../memory_systems/semantic');

async function testRoadmapPhase3() {
    console.log("Starting Roadmap Phase 3 Verification...");

    const perception = new Perception();
    const semantic = new SemanticMemory();
    await semantic.init();

    try {
        // 1. Seed Relationship: Dog -> is_a -> Animal
        console.log("Seeding semantic relationship...");
        const dogId = await semantic.getOrCreateNode("Dog", "Entity");
        const animalId = await semantic.getOrCreateNode("Animal", "Entity");
        await semantic.addRelationship(dogId, animalId, 'is_a', 1.0);

        // 2. Test Enrichment
        const input = "Look at that Dog";
        const baseVector = perception.textToVector(input);
        const baseIndices = perception.getActivePrototypes(baseVector);

        console.log(`Base Indices for "${input}":`, baseIndices);

        console.log("Applying Semantic Enrichment...");
        const enrichedVector = await perception.enrichWithSemanticContext(input, baseVector, semantic);
        const enrichedIndices = perception.getActivePrototypes(enrichedVector);

        console.log(`Enriched Indices for "${input}":`, enrichedIndices);

        // 3. Validation: Measure distance reduction
        const animalVector = perception.textToVector("Animal");

        const distBaseToAnimal = perception.hammingDistance(baseVector, animalVector);
        const distEnrichedToAnimal = perception.hammingDistance(enrichedVector, animalVector);

        console.log(`Hamming Distance (Base -> Animal): ${distBaseToAnimal}`);
        console.log(`Hamming Distance (Enriched -> Animal): ${distEnrichedToAnimal}`);

        if (distEnrichedToAnimal < distBaseToAnimal) {
            const reduction = distBaseToAnimal - distEnrichedToAnimal;
            console.log(`\x1b[32mSUCCESS: Semantic Priming detected! Distance reduced by ${reduction} bits.\x1b[0m`);
        } else {
            console.log("\x1b[31mFAILURE: Enrichment did not move the vector closer to the semantic context.\x1b[0m");
        }

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        semantic.close();
    }
}

testRoadmapPhase3().catch(console.error);
