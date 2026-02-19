const fs = require('fs');
const path = require('path');
const Perception = require('../core/perception');
const ProceduralMemory = require('../memory_systems/procedural');
const WorldModel = require('../core/world_model');
const Homeostasis = require('../core/homeostasis');
const OutputBus = require('../interfaces/output_bus');
const Episodic = require('../memory_systems/episodic');

(async () => {
  const TARGET = parseInt(process.argv[2] || process.env.TARGET || '200', 10);
  const NUM_CANDIDATES = parseInt(process.argv[3] || '7', 10);
  const ROOT = path.join(__dirname, '..', '..');

  const perception = new Perception();
  perception.loadVectors();

  const outputBus = new OutputBus();
  const procedural = new ProceduralMemory(outputBus);
  procedural.cacheSkillVectors(perception);

  const episodic = new Episodic();
  const homeo = new Homeostasis(episodic);

  const worldModel = new WorldModel();
  // Allow world model to reference prototypes for skill-aware rollouts
  worldModel.prototypes = perception.prototypes;

  // Load seed inputs from root inputs.txt if available
  let seeds = [];
  const inputsPath = path.join(ROOT, 'inputs.txt');
  if (fs.existsSync(inputsPath)) {
    seeds = fs.readFileSync(inputsPath, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } else {
    seeds = ['hello','what is apple','tell me about bank','how to bake a pie','weather today','define recursion','who is elon musk','translate hello to spanish'];
  }

  // Expand seeds to reach TARGET by simple templating and permutations
  const inputs = [];
  const extras = ['please','now','for me','in detail','short','long version','briefly'];
  while (inputs.length < TARGET) {
    const s = seeds[Math.floor(Math.random()*seeds.length)];
    const mod = Math.random();
    let item = s;
    if (mod < 0.15) item = `${s} ${extras[Math.floor(Math.random()*extras.length)]}`;
    else if (mod < 0.25) item = `please ${s}`;
    else if (mod < 0.35) item = `${s}?`;
    inputs.push(item);
  }

  const results = [];
  console.log(`Running large evaluation with ${inputs.length} inputs...`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const start = Date.now();

    const candidates = perception.generateCandidateVectors(input, NUM_CANDIDATES);
    const evalRes = procedural.evaluateCandidates(candidates, perception, { homeostasis: homeo }, worldModel);

    let method = 'multi_intent';
    let selected = null;
    if (evalRes && evalRes.skill) {
      selected = { id: evalRes.skill.skillID, score: evalRes.score, candidateIndex: evalRes.candidateIndex, dist: evalRes.dist };
    } else {
      // fallback retrieval
      method = 'fallback';
      const fallback = procedural.retrieve(input, perception, { homeostasis: homeo });
      if (fallback) selected = { id: fallback.skillID || fallback.skillId || 'unknown', score: null };
    }

    const timeMs = Date.now() - start;
    results.push({ index: i, input, method, selected, timeMs });

    if ((i+1) % 25 === 0) console.log(`  Processed ${i+1}/${inputs.length}`);
  }

  // Save results
  const outPath = path.join(__dirname, 'large_evaluation_results.json');
  fs.writeFileSync(outPath, JSON.stringify({ generated: inputs.length, timestamp: new Date().toISOString(), results }, null, 2));

  // Compute metrics
  const counts = { multi_intent:0, fallback:0 };
  const skillFreq = {};
  let totalTime = 0;
  let scoreSum = 0; let scoreCount = 0;
  for (const r of results) {
    counts[r.method] = (counts[r.method] || 0) + 1;
    if (r.selected && r.selected.id) skillFreq[r.selected.id] = (skillFreq[r.selected.id] || 0) + 1;
    if (r.selected && typeof r.selected.score === 'number') { scoreSum += r.selected.score; scoreCount++; }
    totalTime += r.timeMs;
  }

  const topSkills = Object.entries(skillFreq).sort((a,b) => b[1]-a[1]).slice(0,10);

  const summary = {
    total: results.length,
    counts,
    avgTimeMs: (totalTime / results.length).toFixed(2),
    avgScore: scoreCount>0 ? (scoreSum/scoreCount).toFixed(4) : null,
    topSkills
  };

  console.log('\n=== Evaluation Summary ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Results saved to: ${outPath}`);

  process.exit(0);
})();
