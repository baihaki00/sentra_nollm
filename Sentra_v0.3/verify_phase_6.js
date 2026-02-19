/**
 * Phase 6 Verification: Sovereign Alignment
 * Tests case-insensitivity, reward propagation, and telemetry sync.
 */

const SemanticMemory = require('./memory_systems/semantic');
const ProceduralMemory = require('./memory_systems/procedural');
const OutputBus = require('./interfaces/output_bus');
const path = require('path');
const fs = require('fs');

async function verify() {
    console.log("--- Phase 6 Verification Start ---");

    // 1. Semantic Case-Insensitivity
    console.log("\n[Test 1] Semantic Case-Insensitivity...");
    const semantic = new SemanticMemory();
    await semantic.init();

    // Create a node with mixed case
    const label = "TestNode_" + Date.now();
    await semantic.getOrCreateNode(label);

    // Retrieve with different case
    const retrieved = await semantic.getNodeByLabel(label.toLowerCase());
    const retrievedUpper = await semantic.getNodeByLabel(label.toUpperCase());

    if (retrieved && retrievedUpper && retrieved.node_id === retrievedUpper.node_id) {
        console.log("✅ SUCCESS: Case-insensitive retrieval verified.");
    } else {
        console.error("❌ FAILED: Case-insensitive retrieval failed.");
    }

    // 2. Reward Propagation
    console.log("\n[Test 2] Reward Propagation (Moving Average)...");
    const outputBus = new OutputBus();
    const procedural = new ProceduralMemory(outputBus);

    // Mock a skill and context
    const skillId = 'skill_greet'; // Use a core skill
    const skill = procedural.skills[skillId];
    if (skill) {
        const initialReward = skill.performance?.reward_average || 0.5;
        console.log(`Initial reward for ${skillId}: ${initialReward.toFixed(2)}`);

        // Execute skill to set it as lastExecutedSkillId
        await procedural.execute(skillId);

        // Mock adjust_reward call
        const step = { action: 'adjust_reward', params: { value: 1.0 } };
        const context = {
            homeostasis: {
                episodic: {
                    getRecent: () => Promise.resolve([{ episode_id: 1 }]),
                    updateReward: () => Promise.resolve(1)
                }
            }
        };

        await procedural.executePrimitive(step, context, {});

        const newReward = skill.performance.reward_average;
        const expected = (initialReward * 0.8) + (1.0 * 0.2);

        if (Math.abs(newReward - expected) < 0.01) {
            console.log(`✅ SUCCESS: Reward propagated. Base: ${initialReward.toFixed(2)} -> New: ${newReward.toFixed(2)}`);
        } else {
            console.error(`❌ FAILED: Reward propagation failed. Expected ~${expected.toFixed(2)}, got ${newReward.toFixed(2)}`);
        }
    }

    // 3. Telemetry Sync (OutputBus)
    console.log("\n[Test 3] Telemetry Sync (OutputBus via Trace)...");
    let traceTriggered = false;
    global.trace = (type, msg) => {
        if (type === 'OUTPUT') traceTriggered = true;
    };

    await outputBus.logOutput({ message: "Telemetry Test" });

    if (traceTriggered) {
        console.log("✅ SUCCESS: OutputBus linked to global.trace.");
    } else {
        console.error("❌ FAILED: OutputBus bypasses global.trace.");
    }

    console.log("\n--- Verification Complete ---");
    process.exit(0);
}

verify().catch(console.error);
