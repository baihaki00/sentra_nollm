const Perception = require('./core/perception');
const fs = require('fs');
const path = require('path');

const PROTOTYPE_FILE = path.join(__dirname, './data/cold/functional_prototypes.json');
const p = new Perception();

const terms = {
    "negative_feedback": ["wrong", "no", "incorrect", "false", "stop", "bad", "shut up"],
    "confirmation": ["yes", "y", "correct", "sure", "ok", "confirm", "yep", "yeah"],
    "rejection": ["no", "n", "nope", "cancel", "reject", "false", "nah"],
    "greeting": ["hello", "hi", "hey", "greetings", "good morning"],
    "question": ["what", "who", "where", "when", "why", "how", "?"],
    "fact_learn": ["is a", "is an", "is learning"],
    "fact_query": ["what is", "who is"],
    "feedback": ["good", "excellent", "well done"],
    "reflection": ["think", "reflect", "ponder"],
    "command": ["status", "check", "report"]
};

const current = JSON.parse(fs.readFileSync(PROTOTYPE_FILE, 'utf8'));

for (const [category, words] of Object.entries(terms)) {
    const vectors = words.map(w => p.textToVector(w).toString('hex'));
    // Merge: add to existing or create new
    if (current[category]) {
        current[category] = [...new Set([...current[category], ...vectors])];
    } else {
        current[category] = vectors;
    }
}

fs.writeFileSync(PROTOTYPE_FILE, JSON.stringify(current, null, 2));
console.log(`Updated functional prototypes. Total categories: ${Object.keys(current).length}`);
