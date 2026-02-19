/**
 * Validation Tests for Advanced Features
 * - Skill-specific effect models
 * - Advanced fact parsing
 * - Contradiction detection
 */

const FactParser = require('../memory_systems/fact_parser.js');
const ContradictionHandler = require('../memory_systems/contradiction_handler.js');
const SkillEffects = require('../memory_systems/skill_effects.js');

(async () => {
    try {
        console.log('\x1b[36m╔════════════════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[36m║      Advanced Features Validation Test Suite            ║\x1b[0m');
        console.log('\x1b[36m╚════════════════════════════════════════════════════════╝\x1b[0m\n');

        let passedTests = 0;
        let totalTests = 0;

        // ===== TEST 1: Fact Parser =====
        console.log('\x1b[33m[TEST 1] Fact Parser - Multiple Patterns\x1b[0m\n');
        
        const parser = new FactParser();
        
        const testFacts = [
            { input: 'apple is a fruit', expected_type: 'simple' },
            { input: 'apple is not orange', expected_type: 'negation' },
            { input: 'water is liquid because temperature', expected_type: 'nested_causality' },
            { input: 'fire causes heat', expected_type: 'causal' },
            { input: 'grass is greener than sky', expected_type: 'comparative' },
            { input: 'cat has whiskers', expected_type: 'property' }
        ];

        for (const test of testFacts) {
            totalTests++;
            const fact = parser.parse(test.input);
            
            if (fact && fact.type === test.expected_type) {
                console.log(`  ✓ "${test.input}"`);
                console.log(`    Type: ${fact.type}, Subject: "${fact.subject}", Confidence: ${(fact.confidence_base * 100).toFixed(0)}%`);
                passedTests++;
            } else {
                console.log(`  ✗ "${test.input}" (expected ${test.expected_type}, got ${fact ? fact.type : 'null'})`);
            }
        }

        console.log('\n');

        // ===== TEST 2: Contradiction Detection =====
        console.log('\x1b[33m[TEST 2] Contradiction Detection\x1b[0m\n');

        const handler = new ContradictionHandler();

        const contradictionTests = [
            {
                fact1: parser.parse('apple is red'),
                fact2: parser.parse('apple is not red'),
                should_contradict: true
            },
            {
                fact1: parser.parse('water is liquid'),
                fact2: parser.parse('water is wet'),
                should_contradict: false
            }
        ];

        for (const test of contradictionTests) {
            totalTests++;
            const isContradiction = await handler.detectContradiction(
                parser.generateProposition(test.fact2),
                [{ proposition: parser.generateProposition(test.fact1), confidence: 0.8 }]
            );

            const detected = isContradiction !== null;
            if (detected === test.should_contradict) {
                console.log(`  ✓ Correctly ${detected ? 'detected' : 'rejected'} contradiction`);
                console.log(`    F1: "${parser.generateProposition(test.fact1)}"`);
                console.log(`    F2: "${parser.generateProposition(test.fact2)}"`);
                passedTests++;
            } else {
                console.log(`  ✗ Expected ${test.should_contradict}, got ${detected}`);
            }
        }

        console.log('\n');

        // ===== TEST 3: Skill Effects Learning =====
        console.log('\x1b[33m[TEST 3] Skill Effect Models\x1b[0m\n');

        const skillEffects = new SkillEffects();
        totalTests++;

        // Record some skill executions
        skillEffects.recordExecution('skill_greet', [1, 2, 3], [1, 2, 3, 4, 5], 0.9);
        skillEffects.recordExecution('skill_greet', [2, 3, 4], [2, 3, 4, 5, 6], 0.85);
        skillEffects.recordExecution('skill_greet', [3, 4, 5], [3, 4, 5, 6, 7], 0.88);

        const greetEffect = skillEffects.getEffect('skill_greet');
        if (greetEffect && greetEffect.executions === 3) {
            console.log(`  ✓ Skill effects learned`);
            console.log(`    Skill: skill_greet`);
            console.log(`    Executions: ${greetEffect.executions}`);
            console.log(`    Avg Reward: ${greetEffect.avgReward.toFixed(3)}`);
            console.log(`    Typical adds: ${greetEffect.added_indices.length} indices`);
            passedTests++;
        } else {
            console.log(`  ✗ Failed to learn skill effects`);
        }

        // Test transition prediction
        const predictedState = skillEffects.predictTransition('skill_greet', [1, 2, 3]);
        console.log(`    Predicted next state size: ${predictedState.length} (from initial 3)`);

        console.log('\n');

        // ===== TEST 4: Multiple Fact Parsing =====
        console.log('\x1b[33m[TEST 4] Multi-Sentence Fact Extraction\x1b[0m\n');

        totalTests++;
        const multiInput = `Apple is a fruit. Water is liquid because molecules. Fire causes heat and light.`;
        const facts = parser.parseMultiple(multiInput);

        if (facts.length >= 2) {
            console.log(`  ✓ Extracted ${facts.length} facts from multi-sentence input`);
            for (let i = 0; i < facts.length; i++) {
                console.log(`    ${i + 1}. [${facts[i].type}] ${parser.generateProposition(facts[i])}`);
            }
            passedTests++;
        } else {
            console.log(`  ✗ Expected 2+ facts, got ${facts.length}`);
        }

        console.log('\n');

        // ===== TEST 5: Similarity Calculation =====
        console.log('\x1b[33m[TEST 5] Fact Similarity Detection\x1b[0m\n');

        totalTests++;
        const similarity1 = handler.calculateSimilarity(
            'apple is red',
            'apple is red'  // Same
        );
        const similarity2 = handler.calculateSimilarity(
            'apple is fruit',
            'apple is edible'  // Related but different
        );

        if (similarity1 > 0.9 && similarity2 > 0.4 && similarity2 < 0.9) {
            console.log(`  ✓ Similarity calculation working`);
            console.log(`    Identical facts: ${(similarity1 * 100).toFixed(0)}%`);
            console.log(`    Related facts: ${(similarity2 * 100).toFixed(0)}%`);
            passedTests++;
        } else {
            console.log(`  ✗ Similarity scores incorrect`);
        }

        console.log('\n');

        // ===== SUMMARY =====
        console.log('═'.repeat(60));
        console.log(`VALIDATION RESULTS: ${passedTests}/${totalTests} tests passed`);
        console.log('═'.repeat(60) + '\n');

        if (passedTests === totalTests) {
            console.log('\x1b[32m✅ ALL ADVANCED FEATURES VALIDATED\x1b[0m\n');
            process.exit(0);
        } else {
            console.log(`\x1b[31m❌ ${totalTests - passedTests} tests failed\x1b[0m\n`);
            process.exit(1);
        }

    } catch (e) {
        console.error('Test error:', e);
        process.exit(1);
    }
})();
