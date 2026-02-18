/**
 * Sentra v0.3 - Episodic Memory
 * "Hippocampus": Time-search log (Autobiography)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/cold/episodic_log.db');

class EpisodicMemory {
    constructor() {
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('EpisodicMemory: Could not connect to database', err);
                    reject(err);
                } else {
                    console.log('EpisodicMemory: Connected to Episodic Log.');
                    this.initSchema();
                    resolve();
                }
            });
        });
    }

    initSchema() {
        const createEpisodes = `
            CREATE TABLE IF NOT EXISTS episodes (
                episode_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                state_vector BLOB,
                action_taken TEXT,
                reward REAL,
                outcome_state BLOB,
                surprise REAL,
                consolidated INTEGER DEFAULT 0
            )
        `;

        this.db.run(createEpisodes);
    }

    log(stateVector, actionTaken, reward = 0, outcomeState = null, surprise = 0) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            // Convert state vectors to JSON strings or Buffers for storage if they are arrays
            // Assuming stateVector is array of indices from Perception
            const stateBlob = stateVector ? JSON.stringify(stateVector) : null;
            const outcomeBlob = outcomeState ? JSON.stringify(outcomeState) : null;

            const stmt = this.db.prepare(`
                INSERT INTO episodes (timestamp, state_vector, action_taken, reward, outcome_state, surprise)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            stmt.run(timestamp, stateBlob, actionTaken, reward, outcomeBlob, surprise, function (err) {
                stmt.finalize(); // Finalize after execution
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    getRecent(limit = 5) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM episodes ORDER BY timestamp DESC LIMIT ?", [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getRandom(limit = 3) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM episodes ORDER BY RANDOM() LIMIT ?", [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getHighSurprise(limit = 5) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM episodes WHERE surprise > 0.1 ORDER BY surprise DESC LIMIT ?", [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    updateSurprise(id, newSurprise) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare("UPDATE episodes SET surprise = ? WHERE episode_id = ?");
            stmt.run(newSurprise, id, function (err) {
                stmt.finalize(); // Finalize after execution
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = EpisodicMemory;
