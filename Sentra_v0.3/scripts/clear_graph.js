const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/cold/knowledge_graph.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run("DELETE FROM edges");
    db.run("DELETE FROM nodes");
    console.log("Knowledge Graph cleared successfully.");
});

db.close();
