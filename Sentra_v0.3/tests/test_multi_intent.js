const Perception = require('../core/perception');
const ProceduralMemory = require('../memory_systems/procedural');
const OutputBus = require('../interfaces/output_bus');

(async () => {
  const perception = new Perception();
  perception.loadVectors();

  const outputBus = new OutputBus();
  const procedural = new ProceduralMemory(outputBus);

  // Create two synthetic skills for ambiguous token 'apple'
  const skillCompany = {
    skillID: 'skill_apple_company',
    description: 'Company info',
    trigger_intent: ['apple inc', 'apple company'],
    steps: [{ type: 'primitive', action: 'log_output', params: { message: 'Apple (company)' } }]
  };
  const skillFruit = {
    skillID: 'skill_apple_fruit',
    description: 'Fruit info',
    trigger_intent: ['apple fruit', 'apple tree'],
    steps: [{ type: 'primitive', action: 'log_output', params: { message: 'Apple (fruit)' } }]
  };

  // Insert into procedural memory and cache vectors
  procedural.skills[skillCompany.skillID] = skillCompany;
  procedural.skills[skillFruit.skillID] = skillFruit;

  // Manually set cachedVectors for test (simulate cacheSkillVectors)
  skillCompany.cachedVectors = [
    { text: 'apple inc', vector: perception.textToVector('apple inc') }
  ];
  skillFruit.cachedVectors = [
    { text: 'apple fruit', vector: perception.textToVector('apple fruit') }
  ];

  // Mock worldModel with simulateRollout that scores by overlap with company vs fruit prototype
  const worldModel = {
    simulateRollout: (activeIndices, horizon=3) => {
      // Compute simple similarity to company vector by comparing Hamming distance
      const compVec = perception.textToVector('apple inc');
      const fruitVec = perception.textToVector('apple fruit');

      // Convert activeIndices to a synthetic vector by ORing prototypes
      const synthetic = Buffer.alloc(compVec.length);
      try {
        for (const idx of activeIndices) {
          const proto = perception.prototypes[idx];
          if (proto) for (let b = 0; b < synthetic.length; b++) synthetic[b] |= proto[b];
        }
      } catch (e) {}

      const distComp = perception.hammingDistance(synthetic, compVec);
      const distFruit = perception.hammingDistance(synthetic, fruitVec);

      // Higher reward when closer to company
      const score = Math.max(0, (distFruit - distComp) / 256);
      return score;
    }
  };

  const inputs = [
    'apple',
    'what is apple',
    'tell me about apple',
    'apple stock price',
    'apple pie recipe'
  ];

  console.log('\n--- Multi-Intent Test ---\n');
  for (const input of inputs) {
    const candidates = perception.generateCandidateVectors(input, 7);
    const result = procedural.evaluateCandidates(candidates, perception, {}, worldModel);
    console.log(`Input: "${input}" -> Selected: ${result ? result.skill.skillID : 'NONE'} (score=${result ? result.score.toFixed(3) : 'n/a'})`);
  }

})();
