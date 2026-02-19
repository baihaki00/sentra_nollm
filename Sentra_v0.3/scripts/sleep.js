/**
 * Sentra v0.4 - Sleep Cycle
 * "The Dreaming Loop"
 * Consolidates Episodic Memory into long-term Semantic/Procedural structures.
 */

const SemanticMemory = require('../memory_systems/semantic');
const EpisodicMemory = require('../memory_systems/episodic');
const ProceduralMemory = require('../memory_systems/procedural');
const path = require('path');
const fs = require('fs');

async function sleep() {
    console.log(`\x1b[35m[Sleep Cycle] Sentra is dreaming...\x1b[0m`);

    const semantic = new SemanticMemory();
    const episodic = new EpisodicMemory();
    const procedural = new ProceduralMemory();

    await semantic.init();
    await episodic.init();

    // 1. Fetch unconsolidated episodes
    const unconsolidated = await new Promise((resolve, reject) => {
        episodic.db.all("SELECT * FROM episodes WHERE consolidated = 0", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    if (unconsolidated.length === 0) {
        console.log("No new memories to consolidate. Sentra is resting peacefully.");
        episodic.close();
        semantic.close();
        return;
    }

    console.log(`Processing ${unconsolidated.length} new episodes...`);

    const learningEvents = unconsolidated.filter(e => e.action_taken === 'meta_learn_fact');

    // 2. Semantic Consolidation Report
    if (learningEvents.length > 0) {
        console.log(`\x1b[36m[Semantic Consolidation]\x1b[0m Reinforced ${learningEvents.length} new facts:`);
        learningEvents.filter(e => e.reward > 0.3).forEach(e => {
            if (e.raw_input) console.log(`  > ${e.raw_input}`);
        });
    }

    // 3. Active Forgetting (Pruning)
    const mistakes = unconsolidated.filter(e => e.reward <= 0.3);
    if (mistakes.length > 0) {
        console.log(`\x1b[31m[Active Forgetting]\x1b[0m Pruning ${mistakes.length} mistakes:`);
        mistakes.forEach(e => {
            if (e.raw_input) console.log(`  - ${e.raw_input}`);
        });

        for (const mistake of mistakes) {
            // If it was a learning event, we must deconstruct the fact in the Knowledge Graph
            if (mistake.action_taken === 'meta_learn_fact' && mistake.raw_input) {
                try {
                    // Reverse parse the fact: "A [Subject] is a [Object]"
                    const match = mistake.raw_input.match(/^(?:(?:a|an)\b\s+)?(.+?)\s+is\s+(?:(?:a|an)\b\s+)?(.+)/i);
                    if (match) {
                        const subject = match[1].toLowerCase().trim();
                        const objectRaw = match[2].toLowerCase().trim();
                        const object = objectRaw.replace(/[.!?]+$/, "");

                        const subNode = await semantic.getNodeByLabel(subject);
                        const objNode = await semantic.getNodeByLabel(object);

                        if (subNode && objNode) {
                            await semantic.deleteEdge(subNode.node_id, objNode.node_id, 'is_a');
                            console.log(`\x1b[31m[Surgical Pruning]\x1b[0m Deleted edge: [${subject}] -> is_a -> [${object}]`);
                        }
                    }
                } catch (e) {
                    console.error("Failed to surgically prune fact:", e);
                }
            }
        }
    }

    // 4. Pattern Discovery (Stage 5)
    // Concept: Identify chains of actions that lead to a "Reward Anchor" (High Reward feedback)
    console.log(`\x1b[34m[Pattern Discovery]\x1b[0m Scouting for successful interaction chains...`);

    const draftSkillsPath = path.join(__dirname, '../data/cold/draft_skills.json');
    let drafts = [];
    if (fs.existsSync(draftSkillsPath)) {
        drafts = JSON.parse(fs.readFileSync(draftSkillsPath, 'utf8'));
    }

    // Look for successful chains (Minimum 2 steps ending in high reward or feedback)
    for (let i = 1; i < unconsolidated.length; i++) {
        const current = unconsolidated[i];
        const previous = unconsolidated[i - 1];

        console.log(`  Checking chain: [${previous.action_taken} (Ep ${previous.episode_id})] -> [${current.action_taken} (Ep ${current.episode_id})] (Reward: ${previous.reward})`);

        // A successful chain is: [Any Action (Rewarded >= 1.0)] -> [Positive Feedback Action]
        // Phase 21 FIX: Check for generic feedback patterns or specific action names
        const isFeedback = current.action_taken.includes('feedback_positive') ||
            current.action_taken.includes('reward') ||
            current.action_taken.includes('bootstrap') || // Catch-all for learned praise
            current.action_taken.includes('feedback');

        if (previous.reward >= 1.0 && isFeedback && previous.raw_input) {
            const patternID = `draft_${Date.now()}_${i}`;
            const params = previous.action_params ? JSON.parse(previous.action_params) : {};

            const newDraft = {
                draftID: patternID,
                description: `Automated sequence following: "${previous.raw_input}"`,
                trigger_sample: previous.raw_input,
                sequence: [previous.action_taken, current.action_taken],
                params_sample: params,
                reward_score: (previous.reward + current.reward) / 2
            };

            // Only add if it's a new unique trigger pattern (simplified)
            if (!drafts.some(d => d.trigger_sample === previous.raw_input)) {
                drafts.push(newDraft);
                console.log(`\x1b[32m[Pattern Discovery]\x1b[0m SUCCESS! Detected successful chain! Drafting automation for: "${previous.raw_input}"`);
            } else {
                console.log(`\x1b[33m[Pattern Discovery]\x1b[0m Pattern already exists for: "${previous.raw_input}"`);
            }
        } else if (previous.reward >= 1.0 && !isFeedback) {
            console.log(`\x1b[90m[Pattern Discovery]\x1b[0m Trigger matched high reward, but second action [${current.action_taken}] is not a recognized feedback anchor.\x1b[0m`);
        }
    }

    fs.writeFileSync(draftSkillsPath, JSON.stringify(drafts, null, 2));

    // 5. Procedural Pruning (Phase 28 FIX)
    // Identify skills that have consistently low rewards
    console.log(`\x1b[35m[Procedural Pruning]\x1b[0m Evaluating skill performance...`);

    // Skill Performance Aggregator
    const skillStats = {}; // { skillID: { totalReward: 0, count: 0 } }

    // Check all consolidated episodes (recent history)
    const recentEpisodes = await new Promise((resolve, reject) => {
        episodic.db.all("SELECT action_taken, reward FROM episodes WHERE timestamp > (datetime('now', '-2 days'))", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    for (const ep of recentEpisodes) {
        if (!ep.action_taken.startsWith('learned_') && !ep.action_taken.startsWith('auto_')) continue;
        const id = ep.action_taken;
        if (!skillStats[id]) skillStats[id] = { totalReward: 0, count: 0 };
        skillStats[id].totalReward += ep.reward;
        skillStats[id].count++;
    }

    for (const id in skillStats) {
        const stats = skillStats[id];
        const avg = stats.totalReward / stats.count;
        if (stats.count >= 3 && avg < 0.3) {
            console.log(`\x1b[31m[Procedural Pruning]\x1b[0m Skill ${id} has failing grade (avg: ${avg.toFixed(2)}). PRUNING.`);
            procedural.forgetSkill(id);
        } else if (stats.count >= 2 && avg < 0.5) {
            console.log(`\x1b[33m[Procedural Pruning]\x1b[0m Skill ${id} is underperforming (avg: ${avg.toFixed(2)}). DEMOTING.`);
            procedural.demoteSkill(id);
        }
    }

    // 6. Mark as consolidated (Stop Hard Deleting Mistakes)
    for (const ep of unconsolidated) {
        // We mark as consolidated regardless of reward. 
        // We no longer DELETE mistakes here, as we need them for WorldModel offline training during dreams.
        await episodic.markConsolidated(ep.episode_id);
    }

    console.log(`\x1b[32m[Consolidation Complete]\x1b[0m memories have been processed and optimized.`);

    episodic.close();
    semantic.close();
}

sleep().catch(console.error);
