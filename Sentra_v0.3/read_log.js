const fs = require('fs');
const path = require('path');

try {
    const logPath = path.join(__dirname, 'stress_test.log');
    // Read as buffer first to handle potential encoding issues
    const buf = fs.readFileSync(logPath);
    // try to convert to utf8
    console.log(buf.toString('utf8'));
} catch (e) {
    console.error(e);
}
