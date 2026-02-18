const ProceduralMemory = require('../memory_systems/procedural');
const OutputBus = require('../interfaces/output_bus');
const assert = require('assert');

// Mock Output Bus for testing
class MockOutputBus extends OutputBus {
    constructor() {
        super();
        this.params = [];
    }
    async logOutput(params) {
        this.params.push(params.message);
        console.log(`[MockOutput]: ${params.message}`);
    }
    async wait(params) {
        console.log(`[MockWait]: ${params.ms}ms`);
    }
}

const mockBus = new MockOutputBus();
const procedural = new ProceduralMemory(mockBus);

setTimeout(async () => {
    try {
        console.log("Test 1: Load Skills");
        // procedural constructor loads skills immediately
        // Wait a bit or assume sync load (it is sync in implementation)
        const skillsCount = Object.keys(procedural.skills).length;
        console.log(`Skills loaded: ${skillsCount}`);
        assert(skillsCount > 0, "Should load skills from JSON");

        console.log("Test 2: Retrieve Skill");
        const skill = procedural.retrieve("hello");
        console.log("Retrieved:", skill ? skill.skillID : "null");
        assert(skill, "Should retrieve skill_greet");
        assert.strictEqual(skill.skillID, "skill_greet");

        console.log("Test 3: Execute Primitive Skill");
        await procedural.execute(skill);
        assert(mockBus.params.includes("Hello! I am Sentra."), "Should have logged greeting");

        console.log("Test 4: Execute Complex Skill (Hierarchy)");
        const complexSkill = procedural.retrieve("greet_formal");
        assert(complexSkill, "Should retrieve skill_complex_greet");

        mockBus.params = []; // reset
        await procedural.execute(complexSkill);
        assert(mockBus.params.includes("attention!"), "Should verify first step");
        assert(mockBus.params.includes("Hello! I am Sentra."), "Should verify nested skill call");

        console.log("Procedural Memory Tests Passed!");
    } catch (e) {
        console.error("Test Failed:", e);
        process.exit(1);
    }
}, 100);
