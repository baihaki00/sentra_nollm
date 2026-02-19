/**
 * Integrated Demo: Multi-Intent Detection + Belief Consolidation
 *
 * This demo shows how Sentra handles a realistic scenario:
 * 1. User makes an ambiguous statement that could have multiple intents
 * 2. System generates candidate interpretations
 * 3. World model ranks candidates
 * 4. Best candidate is executed
 * 5. Episode is logged and later consolidated into belief during reflection
 */

const fs = require('fs');
const path = require('path');
const Perception = require('../core/perception.js');
const WorldModel = require('../core/world_model.js');
const ProceduralMemory = require('../memory_systems/procedural.js');
const SemanticMemory = require('../memory_systems/semantic.js');
const EpisodicMemory = require('../memory_systems/episodic.js');
const Homeostasis = require('../core/homeostasis.js');

(async () => {
    try {
        console.log('\n\x1b[36m════════════════════════════════════════════════════════\x1b[0m');
        console.log('\x1b[36m  Integrated Demo: Multi-Intent + Belief Consolidation\x1b[0m');
        console.log('\x1b[36m════════════════════════════════════════════════════════\x1b[0m\n');

        // Initialize systems
        const semantic = new SemanticMemory();
        const episodic = new EpisodicMemory();
        const perception = new Perception();
        const procedural = new ProceduralMemory(semantic);
        const worldModel = new WorldModel();
        const homeostasis = new Homeostasis();

        // Connect systems
        await semantic.init();
        await episodic.init();
        homeostasis.episodic = episodic;

        console.log('\x1b[33m[Demo Step 1]\x1b[0m User makes ambiguous input: "apple"\n');
        const ambiguousInput = "apple";
        console.log(`  Input: "${ambiguousInput}"\n  [This could mean: fruit OR company]\n`);

        console.log('\x1b[33m[Demo Step 2]\x1b[0m Generating candidate intent vectors...');
        let candidates = [];
        try {
            candidates = perception.generateCandidateVectors(ambiguousInput);
            console.log(`  Generated ${candidates ? candidates.length : 0} candidate vectors\n`);
        } catch (e) {
            console.log(`  Failed to generate candidates (this is OK—feature may require OODA context): ${e.message}\n`);
            // Fall back to simple scenario
            candidates = null;
        }

        console.log('\x1b[33m[Demo Step 3]\x1b[0m Simulating world model rollouts for top candidates...');
        if (candidates && candidates.length > 0) {
            let topCandidate = candidates[0];
            let topScore = -Infinity;
            
            for (let i = 0; i < Math.min(candidates.length, 3); i++) {
                try {
                    const prediction = worldModel.predict(candidates[i]);
                    const score = prediction.reward || 0;
                    console.log(`  Candidate ${i + 1}: predicted reward = ${score.toFixed(4)}`);
                    if (score > topScore) {
                        topScore = score;
                        topCandidate = candidates[i];
                    }
                } catch (e) {
                    console.log(`  Candidate ${i + 1}: prediction failed (${e.message})`);
                }
            }
            console.log(`\n  Selected top candidate with predicted reward: ${topScore.toFixed(4)}\n`);
        } else {
            console.log('  (Rollout feature requires full OODA context)\n');
        }

        console.log('\x1b[33m[Demo Step 4]\x1b[0m Logging episode with fact-like input...');
        const factInput = "apple is a fruit";
        const episodeId = await episodic.log([], 'teach', 0.8, null, 0.5, factInput, null);
        console.log(`  Logged episode ${episodeId}: "${factInput}"\n`);

        console.log('\x1b[33m[Demo Step 5]\x1b[0m Running reflection loop to consolidate belief...');
        try {
            await homeostasis.reflect(worldModel, semantic);
            console.log('\n  Reflection complete.\n');
        } catch (e) {
            console.log(`  Reflection error: ${e.message}\n`);
        }

        console.log('\x1b[33m[Demo Step 6]\x1b[0m Verifying belief was consolidated...');
        try {
            const belief = await semantic.getBeliefByProposition('apple is a fruit');
            if (belief && belief.belief_id) {
                console.log(`  ✓ Belief found: "${belief.proposition}"`);
                console.log(`    Confidence: ${belief.confidence}`);
                console.log(`    Subject ID: ${belief.subject_id}\n`);
            } else {
                const alternateBelief = await semantic.getBeliefByProposition('apple is fruit');
                if (alternateBelief && alternateBelief.belief_id) {
                    console.log(`  ✓ Belief found (alternate form): "${alternateBelief.proposition}"`);
                    console.log(`    Confidence: ${alternateBelief.confidence}\n`);
                } else {
                    console.log(`  ✗ Belief not found in semantic memory\n`);
                }
            }
        } catch (e) {
            console.log(`  Error retrieving belief: ${e.message}\n`);
        }

        console.log('\x1b[33m[Demo Step 7]\x1b[0m Checking dynamic thresholds...');
        console.log(`  Current Energy: ${homeostasis.energy.toFixed(2)}%`);
        console.log(`  Habit Threshold: ${homeostasis.getThreshold('habit')}`);
        console.log(`  Library Threshold: ${homeostasis.getThreshold('library')}\n`);

        console.log('\x1b[36m════════════════════════════════════════════════════════\x1b[0m');
        console.log('\x1b[32m✓ Demo Complete: Multi-Intent Detection & Belief Consolidation\x1b[0m');
        console.log('\x1b[36m════════════════════════════════════════════════════════\x1b[0m\n');

        process.exit(0);

    } catch (e) {
        console.error('\n\x1b[31mDemo error:\x1b[0m', e);
        process.exit(1);
    }
})();
