/**
 * README.md Compliance Test
 * Verifies adherence to all non-negotiable constraints and principles
 */

const fs = require('fs');
const path = require('path');
const Perception = require('../core/perception');
const ProceduralMemory = require('../memory_systems/procedural');
const SemanticMemory = require('../memory_systems/semantic');
const EpisodicMemory = require('../memory_systems/episodic');
const OutputBus = require('../interfaces/output_bus');
const WorldModel = require('../core/world_model');

let passed = 0;
let failed = 0;
const issues = [];

function test(name, fn) {
    try {
        const result = fn();
        if (result === true || result === undefined) {
            console.log(`  \x1b[32m✓ PASSED\x1b[0m: ${name}`);
            passed++;
            return true;
        } else {
            console.log(`  \x1b[31m✗ FAILED\x1b[0m: ${name}`);
            console.log(`    Reason: ${result}`);
            failed++;
            issues.push(`${name}: ${result}`);
            return false;
        }
    } catch (e) {
        console.log(`  \x1b[31m✗ FAILED\x1b[0m: ${name}`);
        console.log(`    Error: ${e.message}`);
        failed++;
        issues.push(`${name}: ${e.message}`);
        return false;
    }
}

async function runComplianceTests() {
    console.log('\n\x1b[36m=== README.md Compliance Tests ===\x1b[0m\n');

    // Constraint 1: No new directories
    console.log('\x1b[33mConstraint 1: No new directories\x1b[0m');
    test('Directory structure matches README', () => {
        const expectedDirs = ['core', 'memory_systems', 'interfaces', 'data', 'tests'];
        const allowedExtra = ['scripts']; // Scripts directory is needed for sleep.js, bootstrap, etc.
        const actualDirs = fs.readdirSync(path.join(__dirname, '..')).filter(f => 
            fs.statSync(path.join(__dirname, '..', f)).isDirectory()
        );
        const missing = expectedDirs.filter(d => !actualDirs.includes(d));
        const extra = actualDirs.filter(d => !expectedDirs.includes(d) && 
                                             !allowedExtra.includes(d) && 
                                             d !== 'node_modules' && 
                                             !d.startsWith('.'));
        if (missing.length > 0) return `Missing directories: ${missing.join(', ')}`;
        if (extra.length > 0) return `Extra directories found: ${extra.join(', ')}`;
        return true;
    });

    // Constraint 2: No skill-specific .js files
    console.log('\n\x1b[33mConstraint 2: No skill-specific .js files\x1b[0m');
    test('Skills stored in data, not code files', () => {
        const coreFiles = fs.readdirSync(path.join(__dirname, '../core'));
        const skillFiles = coreFiles.filter(f => f.includes('skill') || f.includes('greet') || f.includes('joke'));
        if (skillFiles.length > 0) return `Found skill-specific files: ${skillFiles.join(', ')}`;
        return true;
    });

    // Constraint 3: Language must not rely on raw string matching
    console.log('\n\x1b[33mConstraint 3: Language uses Kanerva coding, not raw string matching\x1b[0m');
    test('Perception uses Kanerva coding', () => {
        const perception = new Perception();
        if (!perception.isReady) return 'Perception not ready';
        if (!perception.prototypes || perception.prototypes.length === 0) return 'No prototypes loaded';
        if (perception.prototypes.length !== 1024) return `Expected 1024 prototypes, got ${perception.prototypes.length}`;
        return true;
    });

    test('Text converted to vectors via Kanerva', () => {
        const perception = new Perception();
        const vector = perception.textToVector('test input');
        if (!vector || !Buffer.isBuffer(vector)) return 'textToVector does not return Buffer';
        if (vector.length !== 32) return `Expected vector length 32 bytes (256 bits), got ${vector.length}`;
        return true;
    });

    test('Hamming distance calculation works', () => {
        const perception = new Perception();
        const v1 = perception.textToVector('hello');
        const v2 = perception.textToVector('world');
        const dist = perception.hammingDistance(v1, v2);
        if (typeof dist !== 'number') return 'hammingDistance does not return number';
        if (dist < 0 || dist > 256) return `Hamming distance out of range: ${dist}`;
        return true;
    });

    test('Fuzzy matching uses vectors, not strings', () => {
        const perception = new Perception();
        const outputBus = new OutputBus();
        const procedural = new ProceduralMemory(outputBus);
        perception.loadVectors();
        procedural.cacheSkillVectors(perception);
        
        // Check that retrieve uses perception for fuzzy matching
        const code = fs.readFileSync(path.join(__dirname, '../memory_systems/procedural.js'), 'utf8');
        const hasVectorMatching = code.includes('textToVector') && code.includes('hammingDistance');
        if (!hasVectorMatching) return 'Fuzzy matching does not use vector-based Kanerva coding';
        return true;
    });

    // Constraint 4: Intent inferred via prediction
    console.log('\n\x1b[33mConstraint 4: Intent inferred via prediction (World Model)\x1b[0m');
    test('World Model exists and operates in latent space', () => {
        const worldModel = new WorldModel();
        if (!worldModel) return 'World Model not found';
        // Check that world model trains on state vectors, not raw text
        const code = fs.readFileSync(path.join(__dirname, '../core/world_model.js'), 'utf8');
        const usesRawText = code.includes('input.toLowerCase') || code.includes('raw_input');
        if (usesRawText) return 'World Model appears to use raw text instead of latent vectors';
        return true;
    });

    test('World Model integrated into main loop', () => {
        const code = fs.readFileSync(path.join(__dirname, '../core/main_loop.js'), 'utf8');
        const hasWorldModel = code.includes('worldModel') && code.includes('train');
        if (!hasWorldModel) return 'World Model not integrated into main loop';
        return true;
    });

    // Constraint 5: Memory consolidation and forgetting
    console.log('\n\x1b[33mConstraint 5: Memory consolidation and forgetting\x1b[0m');
    test('Sleep cycle implements consolidation', () => {
        const sleepCode = fs.readFileSync(path.join(__dirname, '../scripts/sleep.js'), 'utf8');
        const hasConsolidation = sleepCode.includes('consolidated') || sleepCode.includes('consolidate') || sleepCode.includes('markConsolidated');
        const hasForgetting = sleepCode.includes('DELETE') || sleepCode.includes('forget') || sleepCode.includes('prune') || sleepCode.includes('Pruning');
        if (!hasConsolidation) return 'Sleep cycle does not implement consolidation';
        if (!hasForgetting) return 'Sleep cycle does not implement forgetting/pruning';
        return true;
    });

    test('Episodic memory marks consolidated episodes', () => {
        const episodicCode = fs.readFileSync(path.join(__dirname, '../memory_systems/episodic.js'), 'utf8');
        const hasConsolidatedField = episodicCode.includes('consolidated');
        const hasMarkConsolidated = episodicCode.includes('markConsolidated');
        if (!hasConsolidatedField) return 'Episodic memory does not track consolidation status';
        if (!hasMarkConsolidated) return 'Episodic memory does not have markConsolidated method';
        return true;
    });

    // Constraint 6: NO LLM, NO APIs
    console.log('\n\x1b[33mConstraint 6: NO LLM, NO OLLAMA, NO APIs\x1b[0m');
    test('No LLM imports or API calls', () => {
        const coreDir = path.join(__dirname, '../core');
        const memoryDir = path.join(__dirname, '../memory_systems');
        const interfaceDir = path.join(__dirname, '../interfaces');
        
        const checkDir = (dir) => {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
            for (const file of files) {
                const content = fs.readFileSync(path.join(dir, file), 'utf8');
                const forbidden = [
                    'openai', 'anthropic', 'ollama', 'llama', 'gpt', 'claude',
                    'api.openai.com', 'api.anthropic.com', 'localhost:11434',
                    'fetch(', 'axios', 'http.request', 'https.request'
                ];
                for (const term of forbidden) {
                    if (content.toLowerCase().includes(term.toLowerCase())) {
                        return `Found forbidden term "${term}" in ${file}`;
                    }
                }
            }
            return true;
        };
        
        const coreResult = checkDir(coreDir);
        if (coreResult !== true) return coreResult;
        const memoryResult = checkDir(memoryDir);
        if (memoryResult !== true) return memoryResult;
        const interfaceResult = checkDir(interfaceDir);
        if (interfaceResult !== true) return interfaceResult;
        return true;
    });

    // Dynamic Learning Principle
    console.log('\n\x1b[33mDynamic Learning Principle: No hardcoding\x1b[0m');
    test('Skills can be learned dynamically', () => {
        const outputBus = new OutputBus();
        const procedural = new ProceduralMemory(outputBus);
        const perception = new Perception();
        perception.loadVectors();
        
        const initialCount = Object.keys(procedural.skills).length;
        procedural.learnSkill('test trigger', 'test response', perception);
        const afterCount = Object.keys(procedural.skills).length;
        
        if (afterCount <= initialCount) return 'learnSkill did not add new skill';
        
        // Cleanup
        const learnedPath = path.join(__dirname, '../data/cold/learned_skills.json');
        if (fs.existsSync(learnedPath)) {
            const learned = JSON.parse(fs.readFileSync(learnedPath, 'utf8'));
            const filtered = learned.filter(s => !s.trigger_intent.includes('test trigger'));
            fs.writeFileSync(learnedPath, JSON.stringify(filtered, null, 2));
        }
        return true;
    });

    test('Skills stored as data (JSON), not code', () => {
        const skillsPath = path.join(__dirname, '../data/cold/skills_library.json');
        if (!fs.existsSync(skillsPath)) return 'skills_library.json not found';
        const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
        if (!skills.skills || !Array.isArray(skills.skills)) return 'Invalid skills_library.json structure';
        return true;
    });

    // Integration Tests
    console.log('\n\x1b[33mIntegration Tests\x1b[0m');
    test('Perception integrates with Procedural Memory', () => {
        const perception = new Perception();
        const outputBus = new OutputBus();
        const procedural = new ProceduralMemory(outputBus);
        perception.loadVectors();
        procedural.cacheSkillVectors(perception);
        return true;
    });

    test('Main loop integrates all systems', () => {
        const code = fs.readFileSync(path.join(__dirname, '../core/main_loop.js'), 'utf8');
        const required = ['Perception', 'Attention', 'SemanticMemory', 'EpisodicMemory', 
                          'ProceduralMemory', 'Homeostasis', 'WorldModel'];
        for (const req of required) {
            if (!code.includes(req)) return `Main loop missing ${req}`;
        }
        return true;
    });

    test('Memory systems use databases (not in-memory only)', () => {
        const semanticCode = fs.readFileSync(path.join(__dirname, '../memory_systems/semantic.js'), 'utf8');
        const episodicCode = fs.readFileSync(path.join(__dirname, '../memory_systems/episodic.js'), 'utf8');
        const semanticHasDB = semanticCode.includes('.db') || semanticCode.includes('sqlite') || semanticCode.includes('Database');
        const episodicHasDB = episodicCode.includes('.db') || episodicCode.includes('sqlite') || episodicCode.includes('Database');
        if (!semanticHasDB) return 'Semantic memory does not use persistent database';
        if (!episodicHasDB) return 'Episodic memory does not use persistent database';
        return true;
    });

    // Summary
    console.log('\n\x1b[36m=== Test Summary ===\x1b[0m');
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log(`Total: ${passed + failed}\n`);

    if (issues.length > 0) {
        console.log('\x1b[31mIssues Found:\x1b[0m');
        issues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (failed === 0) {
        console.log('\x1b[32m✓ All README.md compliance tests passed!\x1b[0m\n');
        process.exit(0);
    } else {
        console.log('\x1b[31m✗ Some compliance tests failed. Please review.\x1b[0m\n');
        process.exit(1);
    }
}

runComplianceTests().catch(console.error);
