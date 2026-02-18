const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/cold/episodic_log.db');
const db = new sqlite3.Database(DB_PATH);

db.all("SELECT episode_id, action_taken, reward, consolidated FROM episodes ORDER BY timestamp DESC LIMIT 10", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        rows.forEach(row => {
            console.log(`[ID: ${row.episode_id}] Action: ${row.action_taken} | Reward: ${row.reward.toFixed(2)} | Cons: ${row.consolidated}`);
        });
    }
    db.close();
});
