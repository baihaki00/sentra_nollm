/**
 * Verification script for Hebbian drafting and curiosity drive
 */
const Homeostasis = require('../core/homeostasis');
const EpisodicMemory = require('../memory_systems/episodic');
const WorldModel = require('../core/world_model');
const SemanticMemory = require('../memory_systems/semantic');
const stm = require('../memory_systems/short_term');
const fs = require('fs');
const path = require('path');

async function testHebbian() {
    console.log("Starting Hebbian Verification...");

    const episodic = new EpisodicMemory();
    const worldModel = new WorldModel();
    const semantic = new SemanticMemory();

    await episodic.init();
    await semantic.init();

    // 1. Seed episodic memory with a pattern: "check files" -> feedback_positive
    // Done 3 times to exceed Hebbian threshold
    const state = [1, 2, 3]; // mock active prototypes
    console.log("Seeding episodes...");
    for (let i = 0; i < 3; i++) {
        await episodic.log(state, 'skill_status', 1.0, state, 0.5, "check files");
        await episodic.log(state, 'meta_feedback_positive', 1.0, state, 0.5, "good job");
    }

    const homeostasis = new Homeostasis(episodic);

    // Clear pattern_stats.json to start fresh
    const STATS_FILE = path.join(__dirname, '../data/hot/pattern_stats.json');
    if (fs.existsSync(STATS_FILE)) fs.unlinkSync(STATS_FILE);

    // 2. Run reflect
    console.log("Running reflection...");
    await homeostasis.reflect(worldModel, semantic);

    // 3. Verify draft creation
    const DRAFTS_FILE = path.join(__dirname, '../data/cold/draft_skills.json');
    if (fs.existsSync(DRAFTS_FILE)) {
        const drafts = JSON.parse(fs.readFileSync(DRAFTS_FILE, 'utf8'));
        const hebbianDraft = drafts.find(d => d.hebbian === true);
        if (hebbianDraft) {
            console.log("\x1b[32mSUCCESS: Hebbian draft created!\x1b[0m");
            console.log("Draft ID:", hebbianDraft.draftID);
            console.log("Sequence:", hebbianDraft.sequence);
        } else {
            console.log("\x1b[31mFAILURE: No Hebbian draft found.\x1b[0m");
        }
    } else {
        console.log("\x1b[31mFAILURE: draft_skills.json not found.\x1b[0m");
    }

    // 4. Test Curiosity Probe
    console.log("Testing Curiosity Initiative...");
    homeostasis.energy = 96;
    const recommendation = await homeostasis.check(worldModel, semantic);
    if (recommendation && recommendation.name === 'skill_curious_query') {
        console.log("\x1b[32mSUCCESS: Curiosity probe recommended!\x1b[0m");
    } else {
        console.log("\x1b[31mFAILURE: Curiosity probe not recommended at high energy.\x1b[0m");
    }

    episodic.close();
    semantic.close();
}

testHebbian().catch(console.error);
