const Perception = require('../core/perception');
const ProceduralMemory = require('../memory_systems/procedural');
const OutputBus = require('../interfaces/output_bus');
const ego = require('../core/ego');

const perception = new Perception();
const outputBus = new OutputBus();
const procedural = new ProceduralMemory(outputBus);

async function testDynamics() {
    await ego.init();
    perception.loadVectors();
    procedural.cacheSkillVectors(perception);

    console.log(`\n--- TEST: Ego Attractor Dynamics ---\n`);

    // 1. Initial Match (No specific focus)
    const input = "show stuff"; 
    console.log(`Input: "${input}" (Neutral Context)`);
    const match1 = await procedural.retrieve(input, perception);
    console.log(`Winner: ${match1 ? match1.skillID : "NONE"}`);

    // 2. Set Ego Focus to "joke"
    console.log(`\nShifting Ego Magnet toward "joke"...`);
    ego.setFocus("joke");
    
    // 3. Match again with same ambiguous input
    console.log(`Input: "${input}" (Ego Context: "joke")`);
    const match2 = await procedural.retrieve(input, perception);
    console.log(`Winner with Ego Bias: ${match2 ? match2.skillID : "NONE"}`);

    // 4. Set Ego Focus to "files"
    console.log(`\nShifting Ego Magnet toward "files"...`);
    ego.setFocus("files");
    
    // 5. Match again
    console.log(`Input: "${input}" (Ego Context: "files")`);
    const match3 = await procedural.retrieve(input, perception);
    console.log(`Winner with Ego Bias: ${match3 ? match3.skillID : "NONE"}`);

}

testDynamics().catch(console.error);
