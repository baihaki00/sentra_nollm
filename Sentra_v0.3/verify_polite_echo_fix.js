/**
 * verify_polite_echo_fix.js
 */

const Perception = require('./core/perception');
const WorldModel = require('./core/world_model');
const ProceduralMemory = require('./memory_systems/procedural');
const OutputBus = require('./interfaces/output_bus');

async function verify() {
    console.log("--- 🔬 Verifying 'Polite Echo' Fix ---");

    const perception = new Perception();
    const worldModel = new WorldModel();
    const outputBus = new OutputBus();
    const procedural = new ProceduralMemory(outputBus);

    perception.loadVectors();
    procedural.cacheSkillVectors(perception);

    const input = "Hey!";
    console.log(`Input: "${input}"`);

    // 1. Generate candidate vectors
    const candidates = perception.generateCandidateVectors(input, 7);

    // 2. Evaluate candidates
    const best = procedural.evaluateCandidates(candidates, perception, {}, worldModel);

    console.log(`\nResults:`);
    if (best) {
        console.log(`  > Selected Skill: ${best.skill.skillID}`);
        console.log(`  > Final Score: ${best.score.toFixed(4)}`);
        console.log(`  > Raw Reward: ${best.rawScore.toFixed(4)}`);
        console.log(`  > Semantic Relevance: ${best.relevance.toFixed(4)} (Distance: ${best.dist})`);

        // Check against the feedback skill specifically
        const feedbackSkill = procedural.skills['meta_feedback_positive'];
        if (feedbackSkill && feedbackSkill.cachedVectors) {
            const fbVec = feedbackSkill.cachedVectors[0].vector;
            // Best candidate for feedback might be different, let's just find the closest
            let bestFbDist = Infinity;
            candidates.forEach(c => {
                const d = perception.hammingDistance(c, fbVec);
                if (d < bestFbDist) bestFbDist = d;
            });
            const fbRelevance = Math.max(0, 1 - (bestFbDist / 200));
            console.log(`  > Feedback Relevance: ${fbRelevance.toFixed(4)} (Best Dist: ${bestFbDist})`);
        }

        if (best.skill.skillID === 'skill_greet') {
            console.log("\n  \x1b[32m[PASSED]\x1b[0m 'Hey!' correctly triggered Greeting skill.");
        } else {
            console.log(`\n  \x1b[31m[FAILED]\x1b[0m Selected ${best.skill.skillID} instead of greeting.`);
        }
    } else {
        console.log("\n  \x1b[31m[FAILED]\x1b[0m No skill selected.");
    }
}

verify().catch(console.error);
