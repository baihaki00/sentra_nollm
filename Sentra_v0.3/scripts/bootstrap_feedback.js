const fs = require('fs');
const path = require('path');

const SKILLS_FILE = path.join(__dirname, '../data/cold/skills_library.json');

function bootstrapFeedback() {
    const data = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf8'));

    const feedbackSkill = {
        skillID: "meta_feedback",
        description: "Adjust reward based on user feedback (Yes/No/Wrong)",
        trigger_intent: ["yes", "correct", "good job", "no", "wrong", "that is incorrect"],
        steps: [
            {
                type: "primitive",
                action: "adjust_reward",
                params: {
                    // We'll use a placeholder logic: the primitive should ideally check the intent
                    // For now, we'll keep it simple: if it contains 'no' or 'wrong', it's 0.0
                    // But wait, primitives receive the skill, not the raw input.
                    // We should split this into meta_feedback_positive and meta_feedback_negative.
                }
            }
        ]
    };

    // Better implementation: Split them for clarity in retrieval
    const posFeedback = {
        skillID: "meta_feedback_positive",
        description: "Positive reinforcement",
        trigger_intent: ["yes", "correct", "good job", "hell yeah", "spot on"],
        steps: [
            { type: "primitive", action: "adjust_reward", params: { value: 1.0, confirm: "I'm glad I met your expectations." } }
        ]
    };

    const negFeedback = {
        skillID: "meta_feedback_negative",
        description: "Negative reinforcement",
        trigger_intent: ["no", "wrong", "trash", "incorrect", "that's wrong"],
        steps: [
            { type: "primitive", action: "adjust_reward", params: { value: 0.0, confirm: "Noted. I'll correct my model during sleep." } }
        ]
    };

    // Add if not exists
    [posFeedback, negFeedback].forEach(s => {
        if (!data.skills.find(existing => existing.skillID === s.skillID)) {
            data.skills.push(s);
        }
    });

    fs.writeFileSync(SKILLS_FILE, JSON.stringify(data, null, 4));
    console.log("Feedback skills bootstrapped successfully.");
}

bootstrapFeedback();
