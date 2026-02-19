/**
 * Sentra v0.3 - Linguistic Teaching Script
 * This script "teaches" Sentra by generating exemplar vectors for functional categories.
 * This externalizes intelligence from code (DNA) to data (Brain Matter).
 */

const fs = require('fs');
const path = require('path');
const Perception = require('../core/perception');

const perception = new Perception();
const PROTOTYPE_FILE = path.join(__dirname, '../data/cold/functional_prototypes.json');

const trainingData = [
    { label: "declarative", phrases: ["Paris is the capital of France.", "Iron rusts when exposed to water.", "The sky is blue."] },
    { label: "interrogative", phrases: ["Who wrote Hamlet?", "Where is the nearest hospital?", "Can birds swim?", "Who are you?"] },
    { label: "imperative", phrases: ["Send the email.", "Restart the server.", "Update the app."] },
    { label: "exclamatory", phrases: ["WHUUTT!", "Eureka!", "Holy cow!"] },
    { label: "numeric", phrases: ["2 × 2", "10 kg", "1,000,000"] },
    { label: "symbolic", phrases: ["if x > 0: return x", "SELECT * FROM users;", "int main(){}"] },
    { label: "conditional", phrases: ["If battery < 20%, charge it.", "Unless you study, you will fail."] },
    { label: "temporal", phrases: ["Wait three seconds, then retry.", "In the 19th century, industry grew.", "Before sleeping, brush teeth."] },
    { label: "modal", phrases: ["You must update.", "It may snow tonight.", "He ought to apologize.", "Suppose we find a cure?"] },
    { label: "relational", phrases: ["A dog is bigger than a cat.", "X is a subset of Y.", "Steel is stronger than iron."] },
    { label: "causal", phrases: ["Heating water makes it boil.", "Traffic was slow due to an accident.", "Friction creates heat."] },
    { label: "abstraction", phrases: ["Triangles have three sides.", "Mathematics is the language of science.", "Algorithms are sets of instructions."] },
    { label: "metalinguistic", phrases: ["This paragraph is long.", "I counted ten words here.", "The term 'AI' is widely used.", "How many letters in 'sentra'?"] },
    { label: "procedural", phrases: ["First boil water, then add tea leaves.", "Turn on the computer, open the app, then log in.", "Step 1: gather tools. Step 2: assemble."] },
    { label: "belief", phrases: ["I feel this movie is boring.", "Pizza is the best food.", "I suppose you’re right."] },
    { label: "emotive", phrases: ["That’s so annoying.", "I’m so proud of you!", "Good luck!"] },
    { label: "negation", phrases: ["I did not eat the apple.", "It’s not my fault.", "No, that’s not right."] },
    { label: "socratic", phrases: ["Why do you think that is?", "What are the implications of this?", "How can we test this?"] },
    { label: "speculative", phrases: ["This algorithm might fail under load.", "The stock may rise.", "It will likely be a success."] }
];

async function teach() {
    console.log("[Teaching] Generating functional prototypes...");

    const prototypes = {};

    for (const item of trainingData) {
        console.log(`  - Teaching Category: ${item.label}`);
        const vectors = item.phrases.map(p => perception.textToVector(p).toString('hex'));
        prototypes[item.label] = vectors;
    }

    fs.writeFileSync(PROTOTYPE_FILE, JSON.stringify(prototypes, null, 2));
    console.log(`[Teaching] Saved ${trainingData.length} functional categories to ${PROTOTYPE_FILE}`);
}

teach();
