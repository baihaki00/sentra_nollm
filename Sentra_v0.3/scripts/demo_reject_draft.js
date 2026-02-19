const fs = require('fs');
const path = require('path');
const Perception = require('../core/perception');
const Procedural = require('../memory_systems/procedural');

(async () => {
  const DRAFTS_FILE = path.join(__dirname, '..', 'data', 'cold', 'draft_skills.json');
  const INHIBITED_FILE = path.join(__dirname, '..', 'data', 'hot', 'inhibited_drafts.json');

  // Ensure hot dir exists
  const hotDir = path.dirname(INHIBITED_FILE);
  if (!fs.existsSync(hotDir)) fs.mkdirSync(hotDir, { recursive: true });

  // Create a simple draft
  const draft = [{
    draftID: 'demo_draft_1',
    trigger_sample: 'demo trigger',
    description: 'Demo draft',
    sequence: ['skill_demo']
  }];
  fs.writeFileSync(DRAFTS_FILE, JSON.stringify(draft, null, 2));
  fs.writeFileSync(INHIBITED_FILE, JSON.stringify([], null, 2));

  const perception = new Perception(); perception.loadVectors();
  const procedural = new Procedural({ logOutput: async () => {} });

  console.log('=== Demo: initial check ===');
  const found = procedural.checkDrafts('demo trigger', perception);
  console.log('Found draft:', found ? found.draftID : null);

  console.log('\nSimulating user rejecting the proposal...');
  global.INHIBITED_DRAFTS = new Set();
  if (found) {
    global.INHIBITED_DRAFTS.add(found.draftID);
    fs.writeFileSync(INHIBITED_FILE, JSON.stringify(Array.from(global.INHIBITED_DRAFTS), null, 2));
    console.log('Persisted inhibited draft:', found.draftID);
  }

  console.log('\n=== Demo: after restart (reload inhibited file) ===');
  delete global.INHIBITED_DRAFTS;
  const raw = fs.readFileSync(INHIBITED_FILE, 'utf8');
  const arr = JSON.parse(raw || '[]');
  global.INHIBITED_DRAFTS = new Set(Array.isArray(arr) ? arr : []);
  console.log('Reloaded inhibited drafts:', Array.from(global.INHIBITED_DRAFTS));

  const found2 = procedural.checkDrafts('demo trigger', perception);
  console.log('Draft returned after inhibition:', found2 ? found2.draftID : null);

  console.log('\nDemo complete.');
})();
