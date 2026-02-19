const ProceduralMemory = require('./memory_systems/procedural');

async function debugRetrieve() {
    const procedural = new ProceduralMemory({ logOutput: async () => { } });
    const input = "A MangMang is a imaginary ghost inside Bai's mind.";
    const skill = await procedural.retrieve(input, null, {});

    console.log(`Input: "${input}"`);
    console.log(`Retrieved Skill ID: ${skill ? skill.skillID : 'NONE'}`);

    if (skill) {
        console.log("Triggers for this skill:");
        console.log(skill.trigger_intent);
    }
}

debugRetrieve().catch(console.error);
