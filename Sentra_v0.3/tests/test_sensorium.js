/**
 * Verification Test for Phase 20: The Sensorium
 */

const Perception = require('../core/perception');
const inputBus = require('../interfaces/input_bus');
const stm = require('../memory_systems/short_term');

async function testSensorium() {
    console.log("--- Testing Sensorium Integration ---");

    const perception = new Perception();
    perception.loadVectors();

    // 1. Scan Environment
    console.log("1. Scanning Environment...");
    const state = inputBus.scanEnvironment();
    console.log("Machine State:", JSON.stringify(state, null, 2));

    // 2. Normalize to Vector
    console.log("\n2. Normalizing State to Latent Vector...");
    const sensation = perception.normalize(state);
    console.log("Activated Prototypes for State:", sensation);

    if (sensation.length > 0) {
        console.log("SUCCESS: Environment mapped to latent space.");
    } else {
        console.log("FAILURE: No activation for environment state.");
    }

    // 3. Compare two different environments (simulated)
    console.log("\n3. Comparing different environments...");
    const state2 = { ...state, cwd: "C:\\Windows\\System32", free_memory: 100 };
    const sensation2 = perception.normalize(state2);
    console.log("Activated Prototypes (Windows Sys32 + Low Mem):", sensation2);

    const matchIndices = sensation.filter(idx => sensation2.includes(idx));
    console.log(`Overlap: ${matchIndices.length} / ${sensation.length}`);

    if (matchIndices.length < sensation.length) {
        console.log("SUCCESS: Different environments produce different latent sensations.");
    } else {
        console.log("WARNING: Environments are identical in latent space (check projection logic).");
    }
}

testSensorium();
