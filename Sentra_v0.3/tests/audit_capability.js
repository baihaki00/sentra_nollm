/**
 * Sentra v0.3 - Cognitive Capability Audit
 * Comprehensive benchmark for Layers 1-4 based on the Audit doc.
 */

const Perception = require('../core/perception');
const ProceduralMemory = require('../memory_systems/procedural');

const perception = new Perception();
const procedural = new ProceduralMemory();

const layer1Tests = [
    // Declarative
    { text: "Paris is the capital of France.", expected: "declarative" },
    { text: "0xFF equals 255 in decimal.", expected: "declarative" },
    { text: "Iron rusts when exposed to water.", expected: "declarative" },

    // Interrogative
    { text: "Who wrote Hamlet?", expected: "interrogative" },
    { text: "Where is the nearest hospital?", expected: "interrogative" },
    { text: "Can birds swim?", expected: "interrogative" },

    // Imperative/Command
    { text: "Send the email.", expected: "imperative" },
    { text: "Restart the server.", expected: "imperative" },
    { text: "Update the app.", expected: "imperative" },

    // Exclamatory
    { text: "WHUUTT!", expected: "exclamatory" },
    { text: "Eureka!", expected: "exclamatory" },
    { text: "Holy cow!", expected: "exclamatory" },

    // Numeric
    { text: "2 × 2", expected: "numeric" },
    { text: "10 kg", expected: "numeric" },
    { text: "1,000,000", expected: "numeric" },

    // Symbolic/Code
    { text: "if x > 0: return x", expected: "symbolic" },
    { text: "`SELECT * FROM users;`", expected: "symbolic" },
    { text: "int main(){}", expected: "symbolic" },

    // Conditional
    { text: "If battery < 20%, charge it.", expected: "conditional" },
    { text: "Unless you study, you will fail.", expected: "conditional" },

    // Temporal
    { text: "Wait three seconds, then retry.", expected: "temporal" },
    { text: "In the 19th century, industry grew.", expected: "temporal" },
    { text: "Before sleeping, brush teeth.", expected: "temporal" },

    // Modal
    { text: "You must update.", expected: "modal" },
    { text: "It may snow tonight.", expected: "modal" },
    { text: "He ought to apologize.", expected: "modal" },
    { text: "Suppose we find a cure?", expected: "modal" },

    // Relational
    { text: "A dog is bigger than a cat.", expected: "relational" },
    { text: "X is a subset of Y.", expected: "relational" },
    { text: "Steel is stronger than iron.", expected: "relational" },

    // Causal
    { text: "Heating water makes it boil.", expected: "causal" },
    { text: "Traffic was slow due to an accident.", expected: "causal" },
    { text: "Friction creates heat.", expected: "causal" },

    // Abstraction
    { text: "Triangles have three sides.", expected: "abstraction" },
    { text: "Mathematics is the language of science.", expected: "abstraction" },
    { text: "Algorithms are sets of instructions.", expected: "abstraction" },

    // Metalinguistic
    { text: "This paragraph is long.", expected: "metalinguistic" },
    { text: "I counted ten words here.", expected: "metalinguistic" },
    { text: "The term 'AI' is widely used.", expected: "metalinguistic" },

    // Instructional
    { text: "First boil water, then add tea leaves.", expected: "procedural" },
    { text: "Turn on the computer, open the app, then log in.", expected: "procedural" },
    { text: "Step 1: gather tools. Step 2: assemble.", expected: "procedural" },

    // Belief/Opinion
    { text: "I feel this movie is boring.", expected: "belief" },
    { text: "Pizza is the best food.", expected: "belief" },
    { text: "I suppose you’re right.", expected: "belief" },

    // Emotive
    { text: "That’s so annoying.", expected: "emotive" },
    { text: "I’m so proud of you!", expected: "emotive" },
    { text: "Good luck!", expected: "emotive" },

    // Negation
    { text: "I did not eat the apple.", expected: "negation" },
    { text: "It’s not my fault.", expected: "negation" },
    { text: "No, that’s not right.", expected: "negation" },

    // Socratic
    { text: "Why do you think that is?", expected: "socratic" },
    { text: "What are the implications of this?", expected: "socratic" },
    { text: "How can we test this?", expected: "socratic" },

    // Speculative
    { text: "This algorithm might fail under load.", expected: "speculative" },
    { text: "The stock may rise.", expected: "speculative" },
    { text: "It will likely be a success.", expected: "speculative" }
];

const layer2Tests = [
    { text: "Dog is an animal.", expected: "simple" },
    { text: "Dog is an animal and it barks.", expected: "compound" },
    { text: "If a dog is trained, it can follow commands.", expected: "complex" },
    { text: "If a dog is trained and rewarded consistently, it will obey commands unless distracted.", expected: "nested" }
];

async function runAudit() {
    console.log("\x1b[35m[Audit]\x1b[0m Starting Cognitive Capability Audit (Layers 1-4)...");

    let l1Score = 0;
    console.log("\n\x1b[36m--- Layer 1: Utterance Type Handling ---\x1b[0m");
    for (const test of layer1Tests) {
        const result = perception.classify(test.text);
        if (result === test.expected) {
            console.log(`\x1b[32m[PASS]\x1b[0m "${test.text}" -> ${result}`);
            l1Score++;
        } else {
            console.log(`\x1b[31m[FAIL]\x1b[0m "${test.text}" -> Expected: ${test.expected}, Got: ${result}`);
        }
    }

    let l2Score = 0;
    console.log("\n\x1b[36m--- Layer 2: Structural Complexity ---\x1b[0m");
    for (const test of layer2Tests) {
        const result = perception.detectComplexity(test.text);
        if (result === test.expected) {
            console.log(`\x1b[32m[PASS]\x1b[0m "${test.text}" -> ${result}`);
            l2Score++;
        } else {
            console.log(`\x1b[31m[FAIL]\x1b[0m "${test.text}" -> Expected: ${test.expected}, Got: ${result}`);
        }
    }

    console.log("\n\x1b[36m--- Layer 3: Cognitive Operations ---\x1b[0m");
    // Mock Procedural execution
    const mockOutputBus = {
        logOutput: async (obj) => {
            console.log(`\x1b[34m[Primitive Output]\x1b[0m ${obj.message}`);
            return true;
        }
    };
    procedural.outputBus = mockOutputBus;

    const l3Tests = [
        {
            action: 'summarize_text',
            params: { text: "The cognitive capability audit is a comprehensive evaluation of Sentra's architecture, covering utterance handling, structural complexity, reasoning engine, metacognition, world model, and autonomous agency." },
            name: "Summarization"
        },
        {
            action: 'compare_concepts',
            params: { conceptA: "Mars", conceptB: "Earth" },
            name: "Comparison (Requires Semantic Memory)"
        },
        {
            action: 'critique_result',
            params: {},
            name: "Self-Critique"
        }
    ];

    let l3Score = 0;
    for (const test of l3Tests) {
        console.log(`Testing Layer 3 Operation: ${test.name}`);
        // Mock context for critique
        const mockContext = {
            stm: {
                getContext: () => ({
                    recent_history: [{ role: 'sentra', text: "Sentra is a sovereign agent." }]
                })
            },
            semantic: {
                getNodeByLabel: async (label) => ({ node_id: label === "mars" ? 1 : 2 }),
                getRelated: async (id) => []
            }
        };
        const success = await procedural.executePrimitive({ action: test.action, params: test.params }, mockContext);
        if (success) {
            console.log(`\x1b[32m[PASS]\x1b[0m Operation "${test.name}" executed successfully.`);
            l3Score++;
        } else {
            console.log(`\x1b[31m[FAIL]\x1b[0m Operation "${test.name}" failed.`);
        }
    }

    console.log("\n\x1b[36m--- Layer 4: Metacognition ---\x1b[0m");
    const l4Tests = [
        { input: "Who are you?", expectedAction: "identity_anchor" },
        { input: "How many letters in 'sentra'?", expectedType: "metalinguistic" }
    ];

    let l4Score = 0;
    for (const test of l4Tests) {
        const l1Type = perception.classify(test.input);
        console.log(`Testing Metacognition Input: "${test.input}" (Type: ${l1Type})`);
        if (test.expectedAction === "identity_anchor") {
            if (l1Type === 'interrogative' && (test.input.toLowerCase().includes('you') || test.input.toLowerCase().includes('sentra'))) {
                console.log(`\x1b[32m[PASS]\x1b[0m Identity Anchor trigger confirmed.`);
                l4Score++;
            } else {
                console.log(`\x1b[31m[FAIL]\x1b[0m Identity Anchor trigger failed.`);
            }
        } else if (test.expectedType) {
            if (l1Type === test.expectedType) {
                console.log(`\x1b[32m[PASS]\x1b[0m Correct Metalinguistic classification.`);
                l4Score++;
            } else {
                console.log(`\x1b[31m[FAIL]\x1b[0m Failed Metalinguistic classification.`);
            }
        }
    }

    console.log(`\nLayer 1 Score: ${l1Score}/${layer1Tests.length}`);
    console.log(`Layer 2 Score: ${l2Score}/${layer2Tests.length}`);
    console.log(`Layer 3 Score: ${l3Score}/${l3Tests.length}`);
    console.log(`Layer 4 Score: ${l4Score}/${l4Tests.length}`);

    console.log("\n\x1b[35m[Audit]\x1b[0m Audit completed.");
}

if (require.main === module) {
    runAudit();
}
