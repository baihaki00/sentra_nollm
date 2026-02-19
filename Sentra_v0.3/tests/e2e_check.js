const Perception = require('../core/perception');
const ProceduralMemory = require('../memory_systems/procedural');
const WorldModel = require('../core/world_model');
const OutputBus = require('../interfaces/output_bus');
const Episodic = require('../memory_systems/episodic');
const fs = require('fs');
const path = require('path');

(async () => {
  const results = [];

  // Perception
  try {
    const p = new Perception();
    p.loadVectors();
    results.push({ check: 'perception.prototypes', ok: Array.isArray(p.prototypes) && p.prototypes.length > 0, details: p.prototypes.length });
  } catch (e) {
    results.push({ check: 'perception.init', ok: false, details: String(e) });
  }

  // Procedural
  try {
    const ob = new OutputBus();
    const proc = new ProceduralMemory(ob);
    results.push({ check: 'procedural.load_skills', ok: Object.keys(proc.skills).length > 0, details: Object.keys(proc.skills).length });
    // cache vectors
    const p2 = new Perception(); p2.loadVectors();
    proc.cacheSkillVectors(p2);
    results.push({ check: 'procedural.cache_vectors', ok: true });
  } catch (e) {
    results.push({ check: 'procedural', ok: false, details: String(e) });
  }

  // WorldModel
  try {
    const wm = new WorldModel();
    const pred = wm.predict([0,1,2]);
    results.push({ check: 'world_model.predict', ok: pred && typeof pred.reward !== 'undefined' });
  } catch (e) {
    results.push({ check: 'world_model', ok: false, details: String(e) });
  }

  // Interfaces: OutputBus basic calls
  try {
    const ob = new OutputBus();
    if (typeof ob.logOutput === 'function') {
      await ob.logOutput({ message: 'E2E check' });
      results.push({ check: 'output_bus.logOutput', ok: true });
    } else results.push({ check: 'output_bus.logOutput', ok: false });
  } catch (e) {
    results.push({ check: 'output_bus', ok: false, details: String(e) });
  }

  // Episodic DB sanity (file exists)
  try {
    const ep = new Episodic();
    const dbPath = path.join(__dirname, '..', 'data', 'cold', 'narrative_memory.json');
    const exists = fs.existsSync(dbPath);
    results.push({ check: 'episodic.db_file', ok: exists, details: exists ? dbPath : 'missing' });
  } catch (e) {
    results.push({ check: 'episodic.init', ok: false, details: String(e) });
  }

  console.log('\nE2E Check Results:');
  console.log(JSON.stringify(results, null, 2));

  // Exit non-zero if any critical check failed
  const failed = results.find(r => r.ok === false);
  process.exit(failed ? 2 : 0);
})();
