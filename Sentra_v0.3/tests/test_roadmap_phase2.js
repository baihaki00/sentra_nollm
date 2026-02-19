/**
 * Verification for Roadmap Phase 2: Pattern Learning
 */
const Homeostasis = require('../core/homeostasis');
const EpisodicMemory = require('../memory_systems/episodic');
const SemanticMemory = require('../memory_systems/semantic');
const WorldModel = require('../core/world_model');
const fs = require('fs');
const path = require('path');

async function testRoadmapPhase2() {
    console.log("Starting Roadmap Phase 2 Verification...");

    const episodic = new EpisodicMemory();
    const semantic = new SemanticMemory();
    const worldModel = new WorldModel();

    await episodic.init();
    await semantic.init();

    try {
        // 1. Seed episodic memory with a repeated successful pattern
        // We need 5 occurrences to trigger the rule promotion threshold
        console.log("Seeding 5 repeated patterns...");
        const state = [1, 1, 1];
        for (let i = 0; i < 5; i++) {
            await episodic.log(state, 'skill_joke', 1.0, state, 0.5, "tell me a joke");
        }

        const homeostasis = new Homeostasis(episodic);
        homeostasis.energy = 90; // Trigger reflection

        // 2. Run reflection
        console.log("Running reflection...");
        await homeostasis.reflect(worldModel, semantic);

        // 3. Verify patterns.json
        const PATTERNS_FILE = path.join(__dirname, '../data/cold/patterns.json');
        if (fs.existsSync(PATTERNS_FILE)) {
            const content = JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf8'));
            const p = content.patterns.find(x => x.condition === 'tell me a joke');
            if (p) {
                console.log("\x1b[32mSUCCESS: Pattern persisted to patterns.json\x1b[0m");
                console.log(`Pattern: "${p.condition}" -> "${p.action}" (freq=${p.frequency})`);
            } else {
                console.log("\x1b[31mFAILURE: Pattern not found in patterns.json\x1b[0m");
            }
        } else {
            console.log("\x1b[31mFAILURE: patterns.json not created\x1b[0m");
        }

        // 4. Verify rules in Semantic DB
        console.log("Checking rules in Semantic DB...");
        const rules = await semantic.queryRules("tell me a joke");
        if (rules.length > 0) {
            console.log("\x1b[32mSUCCESS: Rule learned and stored in DB!\x1b[0m");
            console.log("Rule:", rules[0].antecedent, "->", rules[0].consequent);
        } else {
            console.log("\x1b[31mFAILURE: Rule not found in semantic DB\x1b[0m");
        }

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        episodic.close();
        semantic.close();
    }
}

testRoadmapPhase2().catch(console.error);
