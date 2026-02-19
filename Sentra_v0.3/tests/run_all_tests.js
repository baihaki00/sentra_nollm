#!/usr/bin/env node
/**
 * Quick Test Runner - Run all validation tests for Sentra v0.3
 * 
 * Usage: node tests/run_all_tests.js
 */

const { exec } = require('child_process');
const path = require('path');

const tests = [
    { name: 'E2E Health Check', file: 'tests/e2e_check.js', description: 'System component validation' },
    { name: 'Belief Consolidation', file: 'tests/test_belief_consolidation.js', description: 'Episodic→Semantic belief transfer' },
    { name: 'Multi-Intent Detection', file: 'tests/test_multi_intent.js', description: 'Ambiguous input ranking' },
    { name: 'Inhibited Drafts', file: 'tests/test_inhibited_drafts.js', description: 'Rejected draft persistence' },
    { name: 'Integrated Demo', file: 'scripts/demo_integrated.js', description: 'Full feature integration demo' }
];

async function runTest(index, test) {
    return new Promise((resolve) => {
        const cmd = `node ${test.file}`;
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`[${index + 1}/${tests.length}] ${test.name}`);
        console.log(`${test.description}`);
        console.log(`${'═'.repeat(60)}\n`);

        exec(cmd, { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
            if (err) {
                console.log(`\x1b[31m✗ FAILED\x1b[0m\n`);
                console.error(stderr);
            } else {
                console.log(stdout);
                if (stdout.includes('PASSED') || stdout.includes('passed') || !stdout.includes('FAILED')) {
                    console.log(`\x1b[32m✓ PASSED\x1b[0m\n`);
                }
            }
            resolve();
        });
    });
}

(async () => {
    console.log('\x1b[36m╔════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║         Sentra v0.3 - Comprehensive Test Suite         ║\x1b[0m');
    console.log('\x1b[36m╚════════════════════════════════════════════════════════╝\x1b[0m');

    for (let i = 0; i < tests.length; i++) {
        await runTest(i, tests[i]);
    }

    console.log('\x1b[36m═════════════════════════════════════════════════════════\x1b[0m');
    console.log('\x1b[32m✓ All tests completed\x1b[0m\n');
})();
