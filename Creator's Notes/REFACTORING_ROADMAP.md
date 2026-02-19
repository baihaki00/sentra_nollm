# Sentra Refactoring Roadmap: "Understand, Learn, Grow"
## Architecture-Compliant Approach Within Locked Scaffold

**Status:** Violations Reversed ✅  
**Principle:** No new files. Only enhance existing memory systems and data structures.

---

## Current Problem Identified

Initial approach violated the immutable architecture by creating 4 new modules:
- ❌ `skill_effects.js` - Should be inside `procedural.js`
- ❌ `benchmark.js` - Should be metrics computed from `episodic.js`
- ❌ `fact_parser.js` - Should be pattern matching logic in `semantic.js`
- ❌ `contradiction_handler.js` - Should be relationship validation in `semantic.js`

**Root cause of drift:** Building new system lobes instead of enriching data structures.

---

## Correct Architecture: Data-Only Growth

The locked scaffold provides:
- `core/` - Logic engines (READ-ONLY after design)
- `memory_systems/` - Data managers (EXTEND with new methods, not new files)
- `data/` - Brain matter (GROW with new JSON/DB structures)

### Phase Plan: "Understand, Learn, Grow" Within Lock

---

## Phase 1: Relationship Graph (Within `semantic.js`)

### Goal
Enable facts to connect and influence each other. Move from isolated beliefs to a knowledge graph.

### Implementation (No New Files)

**Extend `semantic.js`:**

1. **Add to schema:** New table for relationships
```sql
CREATE TABLE IF NOT EXISTS relationships (
    rel_id TEXT PRIMARY KEY,
    source_node_id TEXT,
    target_node_id TEXT,
    rel_type TEXT,  -- "causes", "property_of", "similar_to", "opposite_of"
    weight REAL,    -- strength/confidence of relationship
    learned_at INTEGER
)
```

2. **Add methods to `SemanticMemory` class:**
```javascript
addRelationship(sourceId, targetId, relType, weight = 0.5)
  // Store a learned relationship between concepts

getRelationships(nodeId, relType = null)
  // Query: "What causes X?" or "What is related to Y?"

inferTransitive(startNodeId, maxHops = 3)
  // "If A→B and B→C, derive A→C"
```

3. **Data flows:**
   - When consolidating "A causes B" → `addRelationship(nodeA, nodeB, "causes")`
   - During reflection, detect patterns and create relationships
   - Query relationships during skill matching for contextual retrieval

---

## Phase 2: Pattern Learning (Within `episodic.js` + `semantic.js`)

### Goal
Extract learned rules/patterns from episodes. Enable Sentra to generalize.

### Implementation

**Extend `episodic.js`:**

1. **Pattern extraction method:**
```javascript
async extractPatterns(episodeCount = 50)
  // Look at recent episodes
  // Find repeated sequences: "input → action → reward"
  // Store patterns: { input_pattern, action_pattern, avg_reward }
```

2. **Persist patterns to `data/cold/patterns.json`:**
```json
{
  "patterns": [
    {
      "condition": "greeting regex",
      "action": "skill_greet",
      "avg_reward": 0.85,
      "frequency": 12,
      "learned_at": 1708386000
    }
  ]
}
```

**Extend `semantic.js`:**

1. **Store inferred rules:**
```javascript
addRule(antecedent, consequent, confidence)
  // "If X, then Y" with confidence

queryRules(antecedent)
  // Retrieve applicable rules
```

---

## Phase 3: Inference Engine (Within `world_model.js` + `homeostasis.js`)

### Goal
Use relationships and patterns to predict outcomes and answer questions.

### Implementation

**Enhance `world_model.js` predict() method:**

Instead of creating `inference_engine.js`, add inference-by-simulation:

```javascript
predictWithInference(stateIndices, depth = 2)
  // Current: predict next state via NN
  // Enhanced:
  //   1. Get base NN prediction
  //   2. Query semantic for relationships from current concepts
  //   3. Simulate transitive effects
  //   4. Combine predictions
```

**Enhance `homeostasis.js` reflect() method:**

Instead of creating pattern analysis separately:

```javascript
async reflect(worldModel, semantic)
  // Current: consolidate beliefs from high-surprise episodes
  // Enhanced:
  //   1. During consolidation, detect repeated patterns
  //   2. Call semantic.addRule() if pattern confidence high
  //   3. Update relationship graph when new facts learned
```

---

## Phase 4: Intelligent Retrieval (Within `perception.js` + `semantic.js`)

### Goal
Match user input not just by keywords, but by semantic similarity and relationships.

### Implementation

**Enhance `perception.js` normalizeInput():**

Current: Converts raw text → state vector via Kanerva prototypes

Enhanced: After Kanerva encoding:
```javascript
// Query semantic for related concepts
const activeConcepts = await semantic.getRelated(kanervaResult)
// Incorporate relationship weights into activation signal
// Result: richer state vector that includes conceptual context
```

Then skill matching in `procedural.js` uses this enriched vector naturally.

---

## Phase 5: Consolidation Strategies (Within `homeostasis.js`)

### Goal
Adapt how facts are consolidated based on what's learned from contradictions and patterns.

### Implementation

**Enhance `homeostasis.js` reflect():**

```javascript
// Instead of: simple pattern matching and belief update
// Now:

// 1. Check if new fact relates to existing beliefs
const relatedBeliefs = await semantic.getBeliefsByContext(proposition)

// 2. If they contradict:
if (hasContradiction(proposition, relatedBeliefs)) {
    // Query learned rules: "When we saw contradiction before, what was right?"
    const historicalPattern = await episodic.findSimilarContradiction(...)
    // Apply resolution strategy adaptively
}

// 3. If they support each other:
else if (supportsExisting) {
    // Increase confidence of both
    // Strengthen relationship
}

// 4. Learn from resolution
recordContradictionResolution(...)
```

No new files. Just enriched logic using existing data structures.

---

## Data Structures to Add (In `data/cold/`)

### New Files (Data Only, Not Code)

1. **graph_edges.json** - Already exists via semantic.js, but enhance with learned weights
2. **patterns.json** - Mined from episodes, updated during reflection
3. **inference_rules.json** - "If X then Y" statements learned from repeated observations
4. **relationship_metadata.json** - Statistics on relationship types and strengths

### Example Structure

```json
{
  "data/cold/inference_rules.json": {
    "rules": [
      {
        "antecedent": "X is animal",
        "consequent": "X needs food",
        "confidence": 0.92,
        "supporting_episodes": [e1, e2, e3],
        "exceptions": []
      }
    ]
  },
  
  "data/cold/relationship_types.json": {
    "types": [
      { "name": "causes", "bidirectional": false },
      { "name": "similar_to", "bidirectional": true },
      { "name": "property_of", "bidirectional": false }
    ]
  }
}
```

---

## Implementation Sequence

### Week 1: Foundation
- [ ] Extend semantic.js with relationships table + methods
- [ ] Add episodic.extractPatterns()
- [ ] Create `data/cold/patterns.json`
- [ ] Test: "Can Sentra store and retrieve relationships?"

### Week 2: Learning
- [ ] Enhance homeostasis.js reflect() for pattern recognition
- [ ] Add inference_rules persistence
- [ ] Implement addRule() in semantic.js
- [ ] Test: "Can Sentra extract patterns from episodes?"

### Week 3: Inference
- [ ] Enhance world_model.js predict() for relationship-aware inference
- [ ] Add transitivity checking
- [ ] Enhance perception.js to include related concepts
- [ ] Test: "Can Sentra infer relationships not directly taught?"

### Week 4: Integration
- [ ] Adapt homeostasis.js reflect() to validate contradictions via relationships
- [ ] Fine-tune confidence updates based on relationship strength
- [ ] Add adaptive consolidation strategies
- [ ] Test: "Does Sentra adapt better with accumulated knowledge?"

### Week 5: Scaling
- [ ] Profile retrieval performance with Kanerva coding
- [ ] Implement active forgetting in episodic.js (discard low-value episodes)
- [ ] Add relationship weight decay
- [ ] Test with 1M+ facts

---

## How This Solves "Understand, Learn, Grow"

### Understand
- **Before:** Facts stored in isolation
- **After:** Semantic graph with relationships allows contextual understanding
- **Mechanism:** Kanerva prototypes + relationship queries = semantic search

### Learn
- **Before:** Consolidate individual beliefs, no pattern extraction
- **After:** Extract rules and relationships during reflection
- **Mechanism:** episodic.extractPatterns() + episodic inference in consolidation

### Grow
- **Before:** No adaptation; same matching logic regardless of history
- **After:** Relationship weights, rule confidence, and consolidation strategies adapt over time
- **Mechanism:** Homeostasis adjusts thresholds + semantic relationship weights learned from experience

---

## Scaling: O(n) Problem Solution

### The Challenge
If retrieval of N facts requires checking all N facts (O(n)), feeding 1M facts causes collapse.

### The Solution: Kanerva Coding (Already Implemented)

**Current:** `perception.js` converts ANY input → sparse bit vector via Kanerva coding
- Fixed number of prototypes (e.g., 1,024)
- Retrieval is O(K) where K = prototype count, NOT O(N facts)
- New facts don't slow retrieval; they only refine prototype activations

**Enhancement:** Relationships stay in SQLite with efficient indexing
- Query by relationship type: O(log N) via indexed lookups
- Hamming distance search: O(P) via active prototypes

**Result:** 
- 1M facts stored → Still O(P) perception (P = ~1,000 prototypes)
- Relationships indexed → O(log N) semantic queries
- System scales gracefully

---

## Measurement: How to Know It's Working

### Test 1: Relationship Learning
```
Input: "Dogs are animals" + "Animals need food" (fed through interaction)
Expected: System can infer "Dogs need food" without being told
Metric: Can it answer "What does a dog need?"
```

### Test 2: Pattern Extraction
```
After 50 interactions of similar dialogues
Expected: System extracts pattern, reuses it without reminding
Metric: Does skill matching get faster /more accurate on repeat scenarios?
```

### Test 3: Adaptive Consolidation
```
Feed conflicting facts: "A is B" then "A is not B"
Expected: System resolves based on learned patterns, not defaults
Metric: Does confidence weighting follow historical success patterns?
```

### Test 4: Scaling
```
Feed 100K facts through interaction_bus over time
Expected: No slowdown in perception or consolidation
Metric: Does latency stay under 5ms avg per decision?
```

---

## Key Constraint Maintained

✅ **No new `.js` files created**  
✅ **All logic enhancements inside locked scaffold**  
✅ **All growth in `data/cold/` structures**  
✅ **Kanerva Coding prevents O(n) collapse**  
✅ **Architecture remains immutable**

---

## Next Steps

1. **Audit** existing semantic.js / episodic.js for relationship support
2. **Design** exact table schemas and methods needed
3. **Implement** Phase 1 (relationships) in semantic.js
4. **Test** with 10K facts, measure retrieval latency
5. **Iterate** through remaining phases

This roadmap enables Sentra to genuinely grow more intelligent with more data, without breaking the immutable architecture.

---

*Architecture validated against Creator's Notes (README.md, Sentra.md, The Last One.md)*
