/**
 * Verification for Roadmap Phase 4: Intelligent Retrieval (Persistent Priming)
 */
const Perception = require('../core/perception');
const SemanticMemory = require('../memory_systems/semantic');

async function testRoadmapPhase4() {
    console.log("Starting Roadmap Phase 4 Verification...");

    const perception = new Perception();
    const semantic = new SemanticMemory();
    await semantic.init();

    try {
        // 1. Seed Relationship: Space -> causes -> Zero Gravity
        console.log("Seeding semantic relationship...");
        const spaceId = await semantic.getOrCreateNode("Space", "Entity");
        const zeroGId = await semantic.getOrCreateNode("Zero Gravity", "Entity");
        await semantic.addRelationship(spaceId, zeroGId, 'causes', 1.0);

        // 2. Scenario: First turn we talk about "Space"
        const input1 = "Tell me about Space";
        const priming1 = []; // Empty start
        console.log(`Turn 1 Input: "${input1}"`);

        const indices1 = await perception.normalize(input1, semantic, priming1);
        console.log("Indices 1:", indices1);

        // 3. Scenario: Second turn is ambiguous: "It is interesting"
        // But with "Space" in priming context, it should move toward "Zero Gravity"
        const input2 = "It is interesting";
        const priming2 = ["Space"]; // Context from Turn 1
        console.log(`Turn 2 Input: "${input2}" with Priming: ${priming2}`);

        // Measure base distance to "Zero Gravity" without priming
        const baseVec2 = perception.textToVector(input2);
        const zeroGVec = perception.textToVector("Zero Gravity");
        const distNoPriming = perception.hammingDistance(baseVec2, zeroGVec);

        // Measure distance with priming
        const enrichedVec2 = await perception.normalize(input2, semantic, priming2);
        // Note: we need the vector for distance, not top-5 indices.
        const actualEnrichedVec = await perception.enrichWithSemanticContext(input2, baseVec2, semantic, priming2);
        const distWithPriming = perception.hammingDistance(actualEnrichedVec, zeroGVec);

        console.log(`Hamming Distance to 'Zero Gravity' (No Priming): ${distNoPriming}`);
        console.log(`Hamming Distance to 'Zero Gravity' (With Space Priming): ${distWithPriming}`);

        if (distWithPriming < distNoPriming) {
            const reduction = distNoPriming - distWithPriming;
            console.log(`\x1b[32mSUCCESS: Persistent Priming verified! Distance reduced by ${reduction} bits.\x1b[0m`);
        } else {
            console.log("\x1b[31mFAILURE: Priming did not move the ambiguous input closer to previous turn's related concepts.\x1b[0m");
        }

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        semantic.close();
    }
}

testRoadmapPhase4().catch(console.error);
