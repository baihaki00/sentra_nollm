const { spawn } = require('child_process');

async function runClean() {
    console.log("Starting Clean Live Run...");
    const child = spawn('node', ['test_live_varied.js']);

    child.stdout.on('data', (data) => {
        process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
        process.stderr.write(data);
    });

    child.on('close', (code) => {
        console.log(`\nTest finished with code ${code}`);
    });
}

runClean();
