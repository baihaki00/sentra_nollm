const Perception = require('../core/perception');
const SemanticMemory = require('../memory_systems/semantic');
const EpisodicMemory = require('../memory_systems/episodic');
const ProceduralMemory = require('../memory_systems/procedural');
const stm = require('../memory_systems/short_term');
const Homeostasis = require('../core/homeostasis');
const OutputBus = require('../interfaces/output_bus');

const perception = new Perception();
const semantic = new SemanticMemory();
const episodic = new EpisodicMemory();
const outputBus = new OutputBus(); 
const procedural = new ProceduralMemory(outputBus);
const homeostasis = new Homeostasis(episodic);

const INPUTS = [
    "hello", "hi", "who are you?", "Sentra is an AI.", "An airplane is a vehicle.",
    "A cat is an animal.", "Water is a liquid.", "Fire is hot.", "Earth is a planet.",
    "The sun is a star.", "JavaScript is a language.", "Python is a language.",
    "good job", "well done", "correct", "check files", "list current directory",
    "record this", "Sentra is a Bai's creation.", "An airplane is a transport.",
    "What is an airplane?", "What is a cat?", "What is Sentra?", "hello", "hey",
    "how are you?", "status", "report status", "ponder", "think", "reflect",
    "joke", "tell me a joke", "help", "what can you do", "yes", "hell yeah",
    "spot on", "no", "wrong", "trash", "incorrect", "that's wrong", "take a note",
    "record this", "check files", "Good morning!", "Good evening!", "What is a quark?",
    "A quark is a particle.", "A proton is a particle.", "An electron is a particle.",
    "A neutron is a particle.", "What is a proton?", "What is an electron?",
    "good job", "nice work", "spot on", "status", "check environment", 
    "Sentra is a philosopher.", "A philosopher is a thinker.", "A thinker is a human.",
    "A human is a biological organism.", "Sentra is a digital organism.",
    "What is a thinker?", "What is a biological organism?", "What is a digital organism?",
    "correct", "yes", "check files", "record this", "Good morning", "hello again",
    "Sentra is loyal.", "Loyalty is a virtue.", "A virtue is a quality.",
    "What is loyalty?", "What is a virtue?", "good job", "excellent", "well done"
];

async function runTest() {
    await semantic.init();
    await episodic.init();
    perception.loadVectors();
    procedural.cacheSkillVectors(perception);

    console.log(`\n--- STARTING BULK VERIFICATION (${INPUTS.length} Inputs) ---\n`);

    let stats = {
        total: INPUTS.length,
        learned_greedy: 0,
        meta_matches: 0,
        skill_matches: 0,
        unknown: 0
    };

    for (const input of INPUTS) {
        console.log(`\nInput: "${input}"`);
        
        // Simulate Match
        const skill = await procedural.retrieve(input, perception);
        
        if (skill) {
            console.log(`Matched ID: ${skill.skillID}`);
            if (skill.skillID.startsWith('learned_')) stats.learned_greedy++;
            else if (skill.skillID.startsWith('meta_')) stats.meta_matches++;
            else stats.skill_matches++;
        } else {
            console.log(`Matched ID: NONE (Curiosity/Unknown)`);
            stats.unknown++;
        }
    }

    console.log(`\n--- TEST COMPLETE ---`);
    console.log(JSON.stringify(stats, null, 2));
    
    semantic.close();
    episodic.close();
}

runTest().catch(console.error);
