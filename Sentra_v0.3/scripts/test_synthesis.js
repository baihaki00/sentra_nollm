/**
 * Sentra v0.3 - Synthesis Verification (v2)
 */

const ProceduralMemory = require('../memory_systems/procedural');
const SemanticMemory = require('../memory_systems/semantic');
const Perception = require('../core/perception');

async function test() {
    console.log("[Verification] Initialize Memory Systems...");
    const semantic = new SemanticMemory();
    await semantic.init();

    const perception = new Perception();
    const procedural = new ProceduralMemory();

    const context = { semantic, perception };

    // Clear and ensure Paris knowledge exists
    console.log("[Verification] Setting up test data...");
    await semantic.deleteNodeByLabel("paris");
    const parisId = await semantic.getOrCreateNode("paris", "City");
    const franceId = await semantic.getOrCreateNode("france", "Country");
    await semantic.addEdge(parisId, franceId, "is_a");

    const testCases = ["sentra", "paris"];

    for (const subject of testCases) {
        console.log(`\n--- Subject: ${subject} ---`);
        const node = await semantic.getNodeByLabel(subject);
        if (node) {
            const rels = await semantic.getRelationships(node.node_id);
            console.log(`  Relationships found: ${rels.length}`);
            for (const r of rels) {
                console.log(`    - [${subject}] --(${r.rel_type})--> [${r.label}]`);
            }
        } else {
            console.log(`  Node not found: ${subject}`);
        }

        const sentence = await procedural.synthesizeSentence(subject, context);
        console.log(`Generated Response: ${sentence}`);
    }

    console.log("\n[Verification] Complete.");
    await semantic.close();
    process.exit(0);
}

test().catch(e => {
    console.error("Test Failed:", e);
    process.exit(1);
});
