/**
 * Verification Test for Phase 21: Tool-Habit Synthesis
 * 
 * Scenario: 
 * 1. User says "record this" -> Sentra executes skill_note.
 * 2. User says "good job" -> Reward updated to 1.0.
 * 3. Sleep Cycle runs -> Pattern Discovery should draft a habit.
 */

const EpisodicMemory = require('../memory_systems/episodic');
const ProceduralMemory = require('../memory_systems/procedural');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function verify() {
    console.log("--- Phase 21: Tool-Habit Synthesis Verification ---");
    
    const episodic = new EpisodicMemory();
    await episodic.init();
    
    // Clear draft skills first to be clean
    const draftPath = path.join(__dirname, '../data/cold/draft_skills.json');
    fs.writeFileSync(draftPath, "[]");

    // 1. Simulate "record this" -> skill_note
    console.log("1. Simulating 'record this' -> skill_note");
    const state = [1, 2, 3]; // Mock sensation
    const epId = await episodic.log(state, "skill_note", 0.5, null, 0.1, "record this", { path: "sentra_notes.txt", content: "Test Note", append: true });
    
    // 2. Simulate "good job"
    console.log("2. Simulating 'good job'");
    await episodic.updateReward(epId, 1.0);
    await episodic.log(state, "meta_feedback_positive", 1.0, null, 0.0, "good job", {});
    
    episodic.close();

    // 3. Run Sleep Cycle
    console.log("\n3. Running Sleep Cycle...");
    try {
        execSync("node scripts/sleep.js", { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.error("Sleep Cycle failed:", e);
    }

    // 4. Check Drafts
    console.log("\n4. Checking Draft Skills...");
    const drafts = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
    console.log("Found Drafts:", JSON.stringify(drafts, null, 2));

    if (drafts.length > 0 && drafts[0].params_sample) {
        console.log("\nSUCCESS: Habit drafted with parameters!");
        console.log("Sample Params:", JSON.stringify(drafts[0].params_sample));
    } else {
        console.log("\nFAILURE: Habit NOT drafted or missing parameters.");
    }
}

verify().catch(console.error);
