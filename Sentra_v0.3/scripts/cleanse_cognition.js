/**
 * Sentra v0.3 - Cognitive Cleansing
 * Prunes junk habits that cause intent collisions.
 */

const fs = require('fs');
const path = require('path');

const learnedPath = path.join(__dirname, '../data/cold/learned_skills.json');
const learnedData = JSON.parse(fs.readFileSync(learnedPath, 'utf8'));

console.log(`[Cleansing] Loaded ${learnedData.length} learned skills.`);

// Filtering criteria:
// 1. Remove identity-related learned skills (let the anchor handle it)
// 2. Remove skills with 0 reward and usage
// 3. Remove duplicate triggers for "good morning" etc.
const prunned = learnedData.filter(skill => {
    const trigger = skill.trigger_intent[0]?.toLowerCase() || "";

    // Identity Pruning
    if (trigger.includes("who are you") || trigger.includes("your name")) return false;
    if (trigger.includes("yourself")) return false;

    // Junk Pruning
    if (skill.performance && skill.performance.reward_average === 0 && skill.performance.usage_count === 0) return false;

    // High-frequency Collision Pruning
    if (trigger === "tell me about yourself.") return false; // The joke collision

    return true;
});

console.log(`[Cleansing] Retained ${prunned.length} skills. Pruned ${learnedData.length - prunned.length}.`);

fs.writeFileSync(learnedPath, JSON.stringify(prunned, null, 2));
console.log("[Cleansing] Database updated.");
