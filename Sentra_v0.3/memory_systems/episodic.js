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
                raw_input TEXT,
                action_params TEXT,
                consolidated INTEGER DEFAULT 0
            )
        `;

        this.db.run(createEpisodes);
    }

    log(stateVector, actionTaken, reward = 0, outcomeState = null, surprise = 0, rawInput = "", actionParams = null) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            // Convert state vectors to JSON strings or Buffers for storage if they are arrays
            // Assuming stateVector is array of indices from Perception
            const stateBlob = stateVector ? JSON.stringify(stateVector) : null;
            const outcomeBlob = outcomeState ? JSON.stringify(outcomeState) : null;
            const paramsBlob = actionParams ? JSON.stringify(actionParams) : null;

            const stmt = this.db.prepare(`
                INSERT INTO episodes (timestamp, state_vector, action_taken, reward, outcome_state, surprise, raw_input, action_params)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(timestamp, stateBlob, actionTaken, reward, outcomeBlob, surprise, rawInput, paramsBlob, function (err) {
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

    updateReward(id, rewardValue) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare("UPDATE episodes SET reward = ? WHERE episode_id = ?");
            stmt.run(rewardValue, id, function (err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    updateSurprise(id, surpriseValue) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare("UPDATE episodes SET surprise = ? WHERE episode_id = ?");
            stmt.run(surpriseValue, id, function (err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    getEpisode(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM episodes WHERE episode_id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getNext(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM episodes WHERE episode_id > ? ORDER BY episode_id ASC LIMIT 1", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Roadmap Phase 2: Extract patterns from recent episodes
     */
    async extractPatterns(limit = 50) {
        return new Promise((resolve, reject) => {
            // Find repeated sequences: input -> action -> reward
            const query = `
                SELECT raw_input as antecedent, action_taken as action, reward 
                FROM episodes 
                WHERE reward >= 0.8 AND raw_input IS NOT NULL AND raw_input != ''
                ORDER BY timestamp DESC LIMIT ?
            `;
            this.db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else {
                    // Group and average
                    const patterns = {};
                    for (const row of rows) {
                        const key = `${row.antecedent} -> ${row.action}`;
                        if (!patterns[key]) {
                            patterns[key] = { antecedent: row.antecedent, action: row.action, count: 0, sumReward: 0 };
                        }
                        patterns[key].count++;
                        patterns[key].sumReward += row.reward;
                    }
                    resolve(Object.values(patterns).map(p => ({
                        condition: p.antecedent,
                        action: p.action,
                        avg_reward: p.sumReward / p.count,
                        frequency: p.count
                    })));
                }
            });
        });
    }

    markConsolidated(id) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare("UPDATE episodes SET consolidated = 1 WHERE episode_id = ?");
            stmt.run(id, function (err) {
                stmt.finalize();
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    close() {
        if (this.db) this.db.close();
    }
}

module.exports = EpisodicMemory;
