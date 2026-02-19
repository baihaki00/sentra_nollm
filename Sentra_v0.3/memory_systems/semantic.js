/**
 * Sentra v0.3 - Semantic Memory
 * "Neocortex": Knowledge Graph manager (Facts)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../data/cold/knowledge_graph_v3_formal.db');

class SemanticMemory {
    constructor() {
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, async (err) => {
                if (err) {
                    console.error('SemanticMemory: Could not connect to database', err);
                    reject(err);
                } else {
                    console.log('SemanticMemory: Connected to Knowledge Graph.');
                    try {
                        await this.initSchema();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        });
    }

    initSchema() {
        return new Promise((resolve, reject) => {
            const createNodes = `
                CREATE TABLE IF NOT EXISTS nodes (
                    node_id TEXT PRIMARY KEY,
                    label TEXT,
                    type TEXT,
                    activation REAL,
                    is_locked INTEGER DEFAULT 0,
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
            // Phase 28: Belief Nodes for tracking propositions with confidence
            const createBeliefs = `
                CREATE TABLE IF NOT EXISTS beliefs (
                    belief_id TEXT PRIMARY KEY,
                    proposition TEXT,
                    confidence REAL,
                    source TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    node_id TEXT,
                    FOREIGN KEY(node_id) REFERENCES nodes(node_id)
                )
            `;
            // Phase 28: Alias tracking for identity awareness
            const createAliases = `
                CREATE TABLE IF NOT EXISTS aliases (
                    alias_id TEXT PRIMARY KEY,
                    canonical_label TEXT,
                    alias_label TEXT,
                    reliability REAL,
                    created_at INTEGER,
                    updated_at INTEGER,
                    node_id TEXT,
                    FOREIGN KEY(node_id) REFERENCES nodes(node_id)
                )
            `;
            // Roadmap Phase 1: Formal Relationship Graph
            const createRelationships = `
                CREATE TABLE IF NOT EXISTS relationships (
                    rel_id TEXT PRIMARY KEY,
                    source_node_id TEXT,
                    target_node_id TEXT,
                    rel_type TEXT,
                    weight REAL,
                    learned_at INTEGER,
                    UNIQUE(source_node_id, target_node_id, rel_type),
                    FOREIGN KEY(source_node_id) REFERENCES nodes(node_id),
                    FOREIGN KEY(target_node_id) REFERENCES nodes(node_id)
                )
            `;

            this.db.serialize(async () => {
                try {
                    this.db.run(createNodes);
                    this.db.run(createEdges);
                    this.db.run(createBeliefs);
                    this.db.run(createAliases);
                    this.db.run(createRelationships);
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS rules (
                            rule_id TEXT PRIMARY KEY,
                            antecedent TEXT,
                            consequent TEXT,
                            confidence REAL,
                            learned_at INTEGER
                        )
                    `);
                    await this.initSovereignAnchor();
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * Phase 29: Immalleable Truths (Sovereign Anchor)
     * These concepts cannot be deleted or re-learned with contradicting info.
     */
    async initSovereignAnchor() {
        const anchors = [
            { label: 'sentra', type: 'Identity', belief: 'I am Sentra, a sovereign digital organism.' },
            { label: 'bai', type: 'Creator', belief: 'Bai is my maker and the architect of my mind.' },
            { label: 'creator', type: 'Role', belief: 'The Creator is the primary source of my operative rules.' }
        ];

        for (const anchor of anchors) {
            const node = await this.getNodeByLabel(anchor.label);
            let nodeId;
            if (!node) {
                nodeId = crypto.randomUUID();
                const ts = Date.now();
                await new Promise((resolve, reject) => {
                    this.db.run("INSERT INTO nodes (node_id, label, type, activation, is_locked, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        [nodeId, anchor.label, anchor.type, 1.0, 1, ts], (err) => err ? reject(err) : resolve());
                });
                console.log(`\x1b[35m[SemanticMemory]\x1b[0m New Node Emerged (Anchor): [${anchor.label}] (${anchor.type})`);
                await this.addBelief(anchor.belief, 1.0, 'anchor', nodeId);

                // Phase 28/29: Auto-seed aliases for pronouns
                if (anchor.label === 'sentra') {
                    await this.addAlias('sentra', 'you', nodeId);
                    await this.addAlias('sentra', 'yourself', nodeId);
                } else if (anchor.label === 'bai' || anchor.label === 'creator') {
                    await this.addAlias(anchor.label, 'me', nodeId);
                    await this.addAlias(anchor.label, 'i', nodeId);
                }
            } else {
                nodeId = node.node_id;
                // Lock existing node if not already locked
                await new Promise((resolve, reject) => {
                    this.db.run("UPDATE nodes SET is_locked = 1 WHERE node_id = ?", [nodeId], (err) => err ? reject(err) : resolve());
                });
            }

            // Phase 28/29: Auto-seed aliases for pronouns (Always ensure they exist)
            if (anchor.label === 'sentra') {
                await this.addAlias('sentra', 'you', nodeId);
            } else if (anchor.label === 'bai' || anchor.label === 'creator') {
                await this.addAlias(anchor.label, 'me', nodeId);
                await this.addAlias(anchor.label, 'i', nodeId);
            }
        }
        console.log('\x1b[35m[SemanticMemory]\x1b[0m Sovereign Anchor Active (3 concepts locked).');
    }

    addNode(label, type = 'Concept') {
        const normalizedLabel = label.toLowerCase().trim();
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const timestamp = Date.now();
            const stmt = this.db.prepare("INSERT INTO nodes (node_id, label, type, activation, created_at) VALUES (?, ?, ?, ?, ?)");
            stmt.run(id, normalizedLabel, type, 1.0, timestamp, function (err) {
                if (err) reject(err);
                else {
                    console.log(`\x1b[35m[SemanticMemory]\x1b[0m New Node Emerged: [${label}] (${type})`);
                    resolve(id);
                }
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
        const normalizedLabel = label.toLowerCase().trim();
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM nodes WHERE label = ?", [normalizedLabel], (err, row) => {
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

    /**
     * Legacy wrapper for addRelationship to maintain compatibility.
     * All edges are now formal relationships.
     */
    async addEdge(sourceId, targetId, relation, weight = 1.0) {
        return await this.addRelationship(sourceId, targetId, relation, weight);
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

    /**
     * Roadmap Phase 1: Add a formal relationship
     */
    addRelationship(sourceId, targetId, relType, weight = 0.5) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const timestamp = Date.now();
            const stmt = this.db.prepare(`
                INSERT INTO relationships (rel_id, source_node_id, target_node_id, rel_type, weight, learned_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_node_id, target_node_id, rel_type) 
                DO UPDATE SET weight = weight + 0.1, learned_at = ?
            `);
            stmt.run(id, sourceId, targetId, relType, weight, timestamp, timestamp, function (err) {
                if (err) reject(err);
                else resolve(id);
            });
            stmt.finalize();
        });
    }

    /**
     * Roadmap Phase 1: Get relationships for a node
     */
    getRelationships(nodeId, relType = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT target_node_id, label, rel_type, weight 
                FROM relationships 
                JOIN nodes ON relationships.target_node_id = nodes.node_id 
                WHERE source_node_id = ?
            `;
            const params = [nodeId];
            if (relType) {
                query += " AND rel_type = ?";
                params.push(relType);
            }
            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Roadmap Phase 1: Transitive Reasoning (Inference)
     * "If A is_a B and B is_a C, then A is_a C"
     */
    async inferTransitive(startNodeId, maxHops = 3, relType = 'is_a') {
        let currentLevel = [startNodeId];
        const inferred = new Set();
        const explored = new Set([startNodeId]);

        for (let hop = 0; hop < maxHops; hop++) {
            const nextLevel = [];
            for (const nodeId of currentLevel) {
                const relations = await this.getRelationships(nodeId, relType);
                for (const rel of relations) {
                    if (!explored.has(rel.target_node_id)) {
                        explored.add(rel.target_node_id);
                        inferred.add(rel.target_node_id);
                        nextLevel.push(rel.target_node_id);
                    }
                }
            }
            if (nextLevel.length === 0) break;
            currentLevel = nextLevel;
        }

        // Return full node objects for inferred IDs
        const results = [];
        for (const id of inferred) {
            const node = await this.getNode(id);
            if (node) results.push(node);
        }
        return results;
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

        if (node.is_locked) {
            console.warn(`\x1b[31m[SemanticMemory]\x1b[0m ATTEMPT BLOCK: Cannot delete locked node "${label}".`);
            return 0;
        }

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

    // Phase 28: Belief Node Management
    /**
     * Add a belief node with confidence and source tracking
     */
    addBelief(proposition, confidence = 0.5, source = 'interaction', nodeId = null) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const timestamp = Date.now();
            const stmt = this.db.prepare(`
                INSERT INTO beliefs (belief_id, proposition, confidence, source, created_at, updated_at, node_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run(id, proposition, confidence, source, timestamp, timestamp, nodeId, function (err) {
                if (err) reject(err);
                else resolve(id);
            });
            stmt.finalize();
        });
    }

    /**
     * Update belief confidence based on new evidence
     */
    updateBeliefConfidence(beliefId, newConfidence, source = 'interaction') {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            // Bayesian update: weighted average of old and new confidence
            const stmt = this.db.prepare(`
                UPDATE beliefs 
                SET confidence = (confidence * 0.7 + ? * 0.3), 
                    source = ?,
                    updated_at = ?
                WHERE belief_id = ?
            `);
            stmt.run(newConfidence, source, timestamp, beliefId, function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
            stmt.finalize();
        });
    }

    /**
     * Get beliefs for a node
     */
    getBeliefs(nodeId) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM beliefs WHERE node_id = ? ORDER BY confidence DESC", [nodeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Get a belief by its exact proposition text
     */
    getBeliefByProposition(proposition) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM beliefs WHERE proposition = ? LIMIT 1", [proposition], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Roadmap Phase 2: Add an inference rule
     */
    addRule(antecedent, consequent, confidence = 0.5) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const timestamp = Date.now();
            const stmt = this.db.prepare(`
                INSERT INTO rules (rule_id, antecedent, consequent, confidence, learned_at)
                VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run(id, antecedent, consequent, confidence, timestamp, function (err) {
                if (err) reject(err);
                else resolve(id);
            });
            stmt.finalize();
        });
    }

    /**
     * Roadmap Phase 2: Query rules
     */
    queryRules(antecedent) {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM rules WHERE antecedent LIKE ? ORDER BY confidence DESC", [`%${antecedent}%`], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Phase 28: Alias Management for Identity Awareness
    /**
     * Add an alias for a canonical label
     */
    addAlias(canonicalLabel, aliasLabel, nodeId = null) {
        const normalizedCanonical = canonicalLabel.toLowerCase().trim();
        const normalizedAlias = aliasLabel.toLowerCase().trim();
        return new Promise(async (resolve, reject) => {
            // Get or create node for canonical label
            if (!nodeId) {
                nodeId = await this.getOrCreateNode(normalizedCanonical, 'Entity');
            }

            const id = crypto.randomUUID();
            const timestamp = Date.now();
            const stmt = this.db.prepare(`
                INSERT INTO aliases (alias_id, canonical_label, alias_label, reliability, created_at, updated_at, node_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(alias_id) DO UPDATE SET 
                    reliability = reliability + 0.1,
                    updated_at = ?
            `);
            stmt.run(id, canonicalLabel, aliasLabel, 0.5, timestamp, timestamp, nodeId, timestamp, function (err) {
                if (err) reject(err);
                else resolve(id);
            });
            stmt.finalize();
        });
    }

    /**
     * Resolve alias to canonical label
     */
    resolveAlias(aliasLabel) {
        const normalizedAlias = aliasLabel.toLowerCase().trim();
        return new Promise((resolve, reject) => {
            this.db.get(
                "SELECT canonical_label, node_id, reliability FROM aliases WHERE alias_label = ? ORDER BY reliability DESC LIMIT 1",
                [normalizedAlias],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Phase 28: Decay edge weights over time (Hebbian decay)
     */
    decayEdgeWeights(decayRate = 0.01) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            // Decay weights that haven't been updated in 7 days (604800000 ms)
            const weekAgo = timestamp - 604800000;
            const stmt = this.db.prepare(`
                UPDATE edges 
                SET weight = weight * (1 - ?)
                WHERE updated_at < ? AND weight > 0.1
            `);
            stmt.run(decayRate, weekAgo, function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
            stmt.finalize();
        });
    }

    close() {
        if (this.db) this.db.close();
    }
}

module.exports = SemanticMemory;
