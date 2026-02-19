const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'data/cold/knowledge_graph.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
        process.exit(1);
    }
    console.log('Connected to Knowledge Graph.');

    db.run("ALTER TABLE nodes ADD COLUMN is_locked INTEGER DEFAULT 0;", (err) => {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'is_locked' already exists.");
            } else {
                console.error("Migration failed:", err.message);
                process.exit(1);
            }
        } else {
            console.log("Column 'is_locked' added successfully.");
        }
        db.close();
    });
});
