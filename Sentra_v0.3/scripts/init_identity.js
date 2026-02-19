/**
 * Sentra v0.3 - Identity Initialization
 * Injects the core identity facts into the Knowledge Graph.
 * This aligns with the Tabula Rasa principle: identity is learned data.
 */

const SemanticMemory = require('../memory_systems/semantic');

async function initIdentity() {
    const semantic = new SemanticMemory();
    await semantic.init();

    console.log("[Identity] Injecting core knowledge...");

    // Identity Node
    const sentraId = await semantic.getOrCreateNode("sentra", "Identity");
    const selfId = await semantic.getOrCreateNode("self", "Concept");
    const creatorId = await semantic.getOrCreateNode("bai", "Entity");
    const organismId = await semantic.getOrCreateNode("sovereign digital organism", "Concept");

    await semantic.addEdge(sentraId, selfId, "is_a");
    await semantic.addEdge(sentraId, organismId, "is_a");
    await semantic.addEdge(sentraId, creatorId, "created_by");

    console.log("[Identity] Knowledge injected. Sentra now knows who it is.");
    await semantic.close();
}

initIdentity();
