# Sentra v0.3 - Feature Documentation

## Quick Start

### Run the Main Loop
```bash
node Sentra_v0.3/core/main_loop.js
```
Starts the interactive Sentra agent. Type commands to interact with the system.

### Run All Tests
```bash
node Sentra_v0.3/tests/run_all_tests.js
```
Executes the complete test suite. All should pass ✓.

---

## Core Features

### 1. Belief Consolidation ✅

**What it does:** Automatically converts learned facts from episodic memory into persistent semantic beliefs during the reflection (dreaming) loop.

**How to test:**
```bash
node Sentra_v0.3/tests/test_belief_consolidation.js
```

**Example flow:**
1. User teaches a fact: "Apple is a fruit"
2. Episode logged with reward=0.7, surprise=0.3
3. When homeostasis energy > 80%, `reflect()` activates
4. Episode replayed, facts parsed from raw_input
5. Beliefs added to semantic DB with confidence score
6. Episodes marked consolidated (surprise updated)

**Key files:**
- `core/homeostasis.js` - `reflect()` method with consolidation logic
- `memory_systems/episodic.js` - `updateSurprise()` method
- `memory_systems/semantic.js` - Belief storage and retrieval

**Outputs visible in console:**
```
[Dreaming] Added belief: "apple is fruit" (conf=0.81)
[Dreaming] Updated surprise for Ep 170: 0.3000 -> 0.1994
```

---

### 2. Multi-Intent Detection ✅

**What it does:** When given an ambiguous input, generates multiple candidate interpretations and ranks them using world-model rollouts. Selects the candidate with highest predicted reward.

**How to test:**
```bash
node Sentra_v0.3/tests/test_multi_intent.js
```

**Example:**
- Input: "apple" (could mean fruit or company)
- System generates 5 candidates with different prototype activations
- Each candidate simulated through world model
- Best candidate selected based on predicted reward
- Action executed with top-ranked interpretation

**Key files:**
- `core/perception.js` - `generateCandidateVectors()` creates candidates
- `memory_systems/procedural.js` - `evaluateCandidates()` ranks them
- `core/world_model.js` - `simulateRollout()` makes predictions

**Candidate generation techniques:**
- Textual variants (synonyms, stemming)
- Prototype blending (combinations)
- Perturbations (noise for exploration)

---

### 3. Dynamic Thresholds ✅

**What it does:** Adapts decision thresholds (`habit` and `library`) based on environment surprise. High surprise increases thresholds (exploration). Low surprise decreases thresholds (consolidation).

**How to verify:**
```bash
node Sentra_v0.3/tests/e2e_check.js
```
Look for threshold values in console output.

**How it works:**
1. Each episode generates a surprise value (error between prediction and reality)
2. Reflection loop computes average surprise from recent episodes
3. Learning rate calculated: `0.01 + avgSurprise * 0.03`
4. Thresholds adjusted:
   - High surprise → increase library threshold (explore more skills)
   - Low surprise → decrease library threshold (lean on working skills)
5. Thresholds persisted to `data/hot/working_context.json`
6. All changes logged with meta-learning output

**Example console output:**
```
[Homeostasis] Meta-Learning: Avg Surprise 0.2692 -> Learning Rate 0.0279
[Homeostasis] Adjusted thresholds: habit=30, library=84 (success=100%)
```

**Range:** Thresholds clamped between 10 and 100.

---

### 4. Inhibited Drafts Persistence ✅

**What it does:** When a user rejects a drafted action, it's added to an inhibited set that persists across restarts. System never suggests rejected drafts again.

**How to test:**
```bash
node Sentra_v0.3/tests/test_inhibited_drafts.js
```

**How it works:**
1. User rejects a draft (e.g., "No, don't do that")
2. Draft ID added to `INHIBITED_DRAFTS` set
3. Set persisted to `data/hot/inhibited_drafts.json`
4. On restart, inhibited set reloaded automatically
5. Procedural memory checks inhibited set before suggesting drafts

**File location:**
```
Sentra_v0.3/data/hot/inhibited_drafts.json
```

**Example content:**
```json
[
  "draft_shell_rm_all",
  "draft_delete_important_file",
  "draft_bad_skill_v1"
]
```

---

## Data Files & Persistence

### Cold Storage (Learned Knowledge)
```
data/cold/
├── knowledge_graph.db          # Semantic beliefs, nodes, edges
├── episodic_log.db             # Episode history with surprise
├── patterns.json               # Learned patterns
├── vectors.bin                 # Prototype vectors (256-bit)
├── learned_skills.json         # User-taught skills
└── draft_skills.json           # Synthesized draft candidates
```

### Hot Storage (Session State)
```
data/hot/
├── working_context.json        # Dynamic thresholds, STM state
├── short_term_buffer.json      # Recent context
├── active_goals.json           # Current objectives
└── inhibited_drafts.json       # Persistent rejection memory
```

### Model Files
```
data/models/
├── world_model.weights         # MLP weights for reward prediction
└── value_function.weights      # (Reserved for future)
```

---

## Running Different Components

### Perception Only
```bash
node -e "
const Perception = require('./Sentra_v0.3/core/perception.js');
const p = new Perception();
const vec = p.vectorize('hello');
console.log('Vector length:', vec.length);
"
```

### Procedural Memory (Skills)
```bash
node -e "
const Procedural = require('./Sentra_v0.3/memory_systems/procedural.js');
const Semantic = require('./Sentra_v0.3/memory_systems/semantic.js');
const s = new Semantic();
const p = new Procedural(s);
s.init().then(() => p.loadSkills()).then(() => console.log('Procedural loaded'));
"
```

### Semantic Memory Query
```bash
node -e "
const Semantic = require('./Sentra_v0.3/memory_systems/semantic.js');
const s = new Semantic();
s.init().then(async () => {
  const belief = await s.getBeliefByProposition('apple is fruit');
  console.log('Belief:', belief);
  s.db.close();
});
"
```

### Episodic Memory Inspection
```bash
node Sentra_v0.3/scripts/verify_logs.js
```
Displays recent episodes and their surprise values.

---

## Understanding the Test Suite

| Test | Purpose | Command | Expected Result |
|------|---------|---------|-----------------|
| **E2E Check** | System component health | `e2e_check.js` | All 6 checks pass ✓ |
| **Belief Consolidation** | Episodic→Semantic transfer | `test_belief_consolidation.js` | 4+ beliefs found ✓ |
| **Multi-Intent** | Ambiguous input handling | `test_multi_intent.js` | Candidates ranked ✓ |
| **Inhibited Drafts** | Rejection persistence | `test_inhibited_drafts.js` | Draft inhibited after reload ✓ |
| **Large Evaluation** | Scale test (200 inputs) | `large_evaluation.js 200 7` | Results saved to JSON ✓ |
| **Integrated Demo** | All features together | `demo_integrated.js` | Demo complete ✓ |

---

## Debugging & Logs

### Key Console Colors
```
[Cyan] - System initialization
[Yellow] - Phase/action markers
[Magenta] - Dreaming (reflection)
[Red] - Errors / Warnings
[Green] - Success / Completion
```

### Enable Debug Logs
Edit main_loop.js and set:
```javascript
const DEBUG = true;
```

### Check Database Health
```bash
# Semantic DB
sqlite3 Sentra_v0.3/data/cold/knowledge_graph.db ".tables"

# Episodic DB
sqlite3 Sentra_v0.3/data/cold/episodic_log.db "SELECT COUNT(*) FROM episodes;"
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    OODA Loop                             │
└────┬──────────────────────────────────────────────┬──────┘
     │                                              │
     ▼                                              ▼
┌──────────────┐ ┌───────────────┐ ┌─────────────────────┐
│ Perception   │→│ Multi-Intent  │→│ Procedural Memory   │
│ (Vectorize)  │ │ (Candidate    │ │ (Skill Evaluation) │
│              │ │  Generation)  │ │                     │
└──────────────┘ └───────────────┘ └──────┬──────────────┘
                                           │
                                           ▼
                                  ┌────────────────────┐
                                  │ World Model        │
                                  │ (Rollout Ranking)  │
                                  └────────┬───────────┘
                                           │
                                           ▼
                                  ┌────────────────────┐
                                  │ Execute Action     │
                                  │ Log Episode        │
                                  └────────┬───────────┘
                                           │
                                If Energy > 80%
                                           │
                                           ▼
                         ┌─────────────────────────────┐
                         │ Reflection (Dreaming)       │
                         │ Parse Facts, Update Beliefs │
                         │ Update Surprise Values      │
                         │ Adapt Thresholds            │
                         └─────────────────────────────┘
```

---

## Next Steps for Developers

### To Enhance Multi-Intent Detection
1. Add skill-specific effect models (e.g., "search_web" changes knowledge state)
2. Implement Bayesian ranking (prior × likelihood × evidence)
3. Add confidence thresholds (reject ambiguous candidates)

### To Improve Belief Consolidation
1. Support nested facts ("X is Y because Z")
2. Add contradiction detection (store conflicting beliefs)
3. Implement belief merging (same meaning, different wording)

### To Extend Dynamic Thresholds
1. Track per-skill surprise (not just global)
2. Implement skill-specific threshold adaptation
3. Add forgetting curves (decrease threshold weights over time)

---

## Safety & Constraints

### Zero-LLM Requirement
✅ No external APIs used
✅ No pretrained models
✅ All learning is local and organic

### Execution Safety
- Shell primitives guarded by whitelist
- Timeouts enforced (5s default)
- File operations restricted to `data/` and project directories
- Logging all exec attempts for audit

---

## Quick Reference

```bash
# Start interactive
node Sentra_v0.3/core/main_loop.js

# Run all tests
node Sentra_v0.3/tests/run_all_tests.js

# Run specific test
node Sentra_v0.3/tests/test_belief_consolidation.js

# Demo system
node Sentra_v0.3/scripts/demo_integrated.js

# Check vector store
node Sentra_v0.3/scripts/verify_logs.js

# Sleep cycle
node Sentra_v0.3/scripts/sleep.js
```

---

*For detailed implementation, see AGENT_SESSION_SUMMARY.md*
*For Creator's vision, see Creator's Notes/README.md*
