const fs = require('fs');
const path = require('path');
const Perception = require('../core/perception');
const Procedural = require('../memory_systems/procedural');

(async () => {
  const DRAFTS_FILE = path.join(__dirname, '..', 'data', 'cold', 'draft_skills.json');
  const INHIBITED_FILE = path.join(__dirname, '..', 'data', 'hot', 'inhibited_drafts.json');

  // Backup originals if they exist
  const backup = {};
  if (fs.existsSync(DRAFTS_FILE)) backup.drafts = fs.readFileSync(DRAFTS_FILE, 'utf8');
  if (fs.existsSync(INHIBITED_FILE)) backup.inhibited = fs.readFileSync(INHIBITED_FILE, 'utf8');

  try {
    // Ensure hot dir exists
    const hotDir = path.dirname(INHIBITED_FILE);
    if (!fs.existsSync(hotDir)) fs.mkdirSync(hotDir, { recursive: true });

    // Create a draft file with one draft
    const draft = [{
      draftID: 'test_draft_persist_1',
      trigger_sample: 'persist me please',
      description: 'Test draft for inhibited persistence',
      sequence: ['skill_test_a', 'skill_test_b']
    }];
    fs.writeFileSync(DRAFTS_FILE, JSON.stringify(draft, null, 2));

    // Ensure inhibited file is empty
    fs.writeFileSync(INHIBITED_FILE, JSON.stringify([], null, 2));

    // Initialize perception and procedural
    const perception = new Perception();
    perception.loadVectors();
    const procedural = new Procedural({ logOutput: async () => {} });

    // First check: draft should be found
    const found = procedural.checkDrafts('persist me please', perception);
    if (!found) {
      console.error('FAIL: draft was not found on first check');
      process.exit(2);
    }
    console.log('OK: Found draft:', found.draftID);

    // Simulate rejection: add to global and persist
    global.INHIBITED_DRAFTS = new Set();
    global.INHIBITED_DRAFTS.add(found.draftID);
    fs.writeFileSync(INHIBITED_FILE, JSON.stringify(Array.from(global.INHIBITED_DRAFTS), null, 2));
    console.log('OK: Persisted inhibited draft to', INHIBITED_FILE);

    // Simulate restart: clear any in-memory globals and reload from file
    delete global.INHIBITED_DRAFTS;
    // Re-load inhibited file like main loop does
    const raw = fs.readFileSync(INHIBITED_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    global.INHIBITED_DRAFTS = new Set(Array.isArray(arr) ? arr : []);
    console.log('OK: Reloaded inhibited drafts:', Array.from(global.INHIBITED_DRAFTS));

    // Now call checkDrafts again - it should return null because inhibited
    const found2 = procedural.checkDrafts('persist me please', perception);
    if (found2) {
      console.error('FAIL: draft was returned despite being inhibited');
      process.exit(3);
    }
    console.log('OK: Draft was correctly inhibited after reload');

    console.log('TEST PASSED');
    process.exit(0);
  } catch (e) {
    console.error('ERROR during test:', e);
    process.exit(1);
  } finally {
    // Restore backups
    try {
      if (backup.drafts !== undefined) fs.writeFileSync(DRAFTS_FILE, backup.drafts);
      else fs.unlinkSync(DRAFTS_FILE);
    } catch (e) {}
    try {
      if (backup.inhibited !== undefined) fs.writeFileSync(INHIBITED_FILE, backup.inhibited);
      else fs.unlinkSync(INHIBITED_FILE);
    } catch (e) {}
  }
})();
