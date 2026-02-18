/**
 * Sentra v0.3 - Semantic Memory
 * "Neocortex": Knowledge Graph manager (Facts)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../data/cold/knowledge_graph.db');

class SemanticMemory {
    constructor() {
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('SemanticMemory: Could not connect to database', err);
                    reject(err);
                } else {
                    console.log('SemanticMemory: Connected to Knowledge Graph.');
                    this.initSchema();
                    resolve();
                }
            });
        });
    }

    initSchema() {
        const createNodes = `
            CREATE TABLE IF NOT EXISTS nodes (
                node_id TEXT PRIMARY KEY,
                label TEXT,
                type TEXT,
                activation REAL,
                created_at INTEGER
            )
        `;
        const createEdges = `
            CREATE TABLE IF NOT EXISTS edges (
                source_id TEXT,
                target_id TEXT,
                relation TEXT,
                weight REAL,
                updated_at INTEGER,
                PRIMARY KEY (source_id, target_id, relation),
                FOREIGN KEY(source_id) REFERENCES nodes(node_id),
                FOREIGN KEY(target_id) REFERENCES nodes(node_id)
            )
        `;

        this.db.serialize(() => {
            this.db.run(createNodes);
            this.db.run(createEdges);
        });
    }

    addNode(label, type = 'Concept') {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const timestamp = Date.now();
            const stmt = this.db.prepare("INSERT INTO nodes (node_id, label, type, activation, created_at) VALUES (?, ?, ?, ?, ?)");
            stmt.run(id, label, type, 1.0, timestamp, function (err) {
                if (err) reject(err);
                else resolve(id);
            });
            stmt.finalize();
        });
    }

    /**
     * Get existing node ID by label or create new one.
     */
    async getOrCreateNode(label, type = 'Concept') {
        const existing = await this.getNodeByLabel(label);
        if (existing) return existing.node_id;
        return await this.addNode(label, type);
    }

    /**
     * Get a node by its Label (exact match for now, later vector search)
     */
    getNodeByLabel(label) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM nodes WHERE label = ?", [label], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getNode(id) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM nodes WHERE node_id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    addEdge(sourceId, targetId, relation, weight = 1.0) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const stmt = this.db.prepare(`
                INSERT INTO edges (source_id, target_id, relation, weight, updated_at) 
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(source_id, target_id, relation) 
                DO UPDATE SET weight = weight + 0.1, updated_at = ?
            `);
            stmt.run(sourceId, targetId, relation, weight, timestamp, timestamp, function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
            stmt.finalize();
        });
    }

    getRelated(nodeId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT target_id, label, type, relation, weight 
                FROM edges 
                JOIN nodes ON edges.target_id = nodes.node_id 
                WHERE source_id = ? 
                ORDER BY weight DESC
            `;
            this.db.all(query, [nodeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    deleteEdge(sourceId, targetId, relation) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM edges WHERE source_id = ? AND target_id = ? AND relation = ?`;
            this.db.run(query, [sourceId, targetId, relation], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async deleteNodeByLabel(label) {
        const node = await this.getNodeByLabel(label);
        if (!node) return 0;

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Delete edges where this node is source or target
                this.db.run("DELETE FROM edges WHERE source_id = ? OR target_id = ?", [node.node_id, node.node_id]);
                // Delete node itself
                this.db.run("DELETE FROM nodes WHERE node_id = ?", [node.node_id], function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        });
    }

    close() {
        if (this.db) this.db.close();
    }
}

module.exports = SemanticMemory;
