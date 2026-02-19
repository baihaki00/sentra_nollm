# 🕵️‍♂️ Sentra Project File Audit (v0.5)

This document provides a "detailed as FUCK" breakdown of every core file in the Sentra repository, its contribution to the `main_loop.js`, its internal functions, and the "Ideal State" expectations for its behavior.

---

## 🏗 Core Orchestration (`/core`)

### 1. `main_loop.js`
**The Architect / Choreographer.**
- **Purpose**: Managing the "Cognitive Cycle." It iterates through perception, prediction, selection, and action.
- **Main Workflow**:
  - `Bootstrap`: Inits all memory modules and models.
  - `Handshake`: Proactively introduces Sentra using Narrative Memory.
  - `Loop`:
    - `Input`: Fetches user text or environmental signals.
    - `Perceive`: Normalizes input to latent space indices.
    - `Predict`: World Model simulates "What happens if I respond?"
    - `Select`: Basal Ganglia (Procedural) chooses the best Skill based on reward and context.
    - `Act`: Executes the skill and logs result.
    - `Homeostasis`: Checks energy/curiosity and triggers "Reflection" if idle.
- **Contribution**: The spine of the agent. Without this, Sentra is just a collection of disconnected modules.

### 2. `perception.js`
**The Thalamus / Signal Normalizer.**
- **Role**: Converting raw data (text, state) into binary vectors and prototype activations.
- **Key Functions**:
  - `normalize(input, semantic, priming)`: The entry point. Enriches text with semantic neighborhood and returns top-K prototype indices.
  - `textToVector(text)`: SimHash implementation using trigrams and bipolar superposition.
  - `enrichWithSemanticContext(...)`: Spreading activation in the Knowledge Graph to "prime" the vector based on relationships.
  - `getActivePrototypes(query, k)`: Hamming distance search against `vectors.bin`.
- **Expected Behavior**: Consistent latent positioning. "Hello" and "Hi" should land in similar vector neighborhoods.

### 3. `world_model.js`
**The Prefrontal Cortex / Imagination Engine.**
- **Role**: Predicting success (Reward) and modeling expectations (Response Type).
- **Key Functions**:
  - `predict(state)`: MLP Forward Pass. Returns predicted reward [0-1].
  - `predictWithInference(state, semantic)`: Uses Knowledge Graph relationships to adjust prediction weights.
  - `simulateRollout(state, horizon)`: Imagines multiple steps ahead to find the optimal path.
  - `train(state, actualReward)`: Backpropagation to minimize surprise.
- **Expected Behavior**: "Surprise" (Error) should decrease over repeated interactions. 

### 4. `homeostasis.js`
**The Hypothalamus / Internal Regulator.**
- **Role**: Managing energy decay, curiosity surges, and self-reflection (Dreaming).
- **Key Functions**:
  - `check(worldModel, semantic)`: The hourly heartbeat. Decays energy and potentially triggers `reflect()`.
  - `reflect()`: Replays High-Surprise episodes from Episodic memory to consolidate beliefs and promote patterns.
  - `promoteToDraft()`: Converts successful Hebbian patterns into "Draft Skills."
- **Expected Behavior**: Sentra should spontaneously "think" or "learn" when left idle with high energy.

### 5. `attention.js`
**The Reticular Formation / Central Attractor.**
- **Role**: Noise reduction and intentionality. Following Phase 29, this module now hosts the **Central Attractor** (formerly "The Last One" or Ego).
- **Key Functions**:
  - `focus(signalVector)`: Implements "Winner-Take-All" to select the top 5 most salient activations.
  - `setAttractor(text)`: Shifts the "Central Magnet" toward a new topic vector, biasing all cognitive retrieval.
  - `getBias(vector)`: Calculates the Hamming distance to the attractor. Used by `procedural.js` to pull cognitive choices toward consistent intent.
  - `applyDrift()`: Simulates "drifting thoughts" via bit-flipping to prevent robotic rigidity.
- **Expected Behavior**: Consistent latent focus that evolves naturally with conversation without requiring a new "lobe" (file).

### 6. `world_model.js`
**The Prefrontal Cortex / Imagination Engine.**
- **Role**: Predicting success (Reward) and modeling expectations (Response Type).
- **Key Functions**:
  - `predict(state)`: MLP Forward Pass. Returns predicted reward [0-1].
  - `predictWithInference(state, semantic)`: Uses Knowledge Graph relationships to adjust prediction weights.
  - `simulateRollout(state, horizon)`: Imagines multiple steps ahead to find the optimal path.
  - `train(state, actualReward)`: Backpropagation to minimize surprise.
- **Expected Behavior**: "Surprise" (Error) should decrease over repeated interactions. 

### 7. `homeostasis.js`
**The Hypothalamus / Internal Regulator.**
- **Role**: Managing energy decay, curiosity surges, and self-reflection (Dreaming).
- **Key Functions**:
  - `check(worldModel, semantic)`: The hourly heartbeat. Decays energy and potentially triggers `reflect()`.
  - `reflect()`: Replays High-Surprise episodes from Episodic memory to consolidate beliefs and promote patterns.
  - `promoteToDraft()`: Converts successful Hebbian patterns into "Draft Skills."
- **Expected Behavior**: Sentra should spontaneously "think" or "learn" when left idle with high energy.

---

## 🧠 Memory Systems (`/memory_systems`)

### 1. `procedural.js`
**The Basal Ganglia / Skill Manager.**
- **Role**: Storing and retrieving "How-to" knowledge (Skills & Habits).
- **Key Functions**:
  - `retrieve(input, perception, context)`: Fuzzy matching of intent to skill triggers with Repetition Inhibition and Ego Bias.
  - `evaluateCandidates(...)`: Multi-intent simulation.
  - `executePrimitive(step, context)`: The execution engine for individual actions (meta_explain, report_identity, etc.).
  - `learnSkill(trigger, response)`: Hebbian learning of new mapping.
- **Expected Behavior**: Rejection of repetitive responses and graceful fallback to curiosity (meta_unknown).

### 2. `semantic.js`
**The Neocortex / Knowledge Graph.**
- **Role**: Storing facts, relationships, and rules (Symbolic Memory).
- **Key Functions**:
  - `getOrCreateNode(label, type)`: Node management.
  - `addRelationship(source, target, type)`: Link creation (is_a, is_in, part_of).
  - `inferTransitive(node, depth)`: Symbolic reasoning (A is B, B is C => A is C).
  - `addBelief(proposition, confidence)`: Doxastic logic storage.
- **Expected Behavior**: Accurate transitive inferences during `meta_explain_concept`.

### 3. `episodic.js`
**The Hippocampus / Autobiographical Log.**
- **Role**: SQLite-backed record of everything that happened.
- **Key Functions**:
  - `log(state, action, reward, surprise)`: Writes a new episode.
  - `extractPatterns(limit)`: Finds high-frequency, high-reward chains for Homeostasis to promote.
  - `getHighSurprise(limit)`: Identifies "learning opportunities" for reflection.
- **Expected Behavior**: A detailed, queryable history used for retrospective learning.

### 4. `short_term.js`
**Working Memory / The "Now".**
- **Role**: Managing immediate context (Topic, Buffer, Emotional State).
- **Key Functions**:
  - `addInteraction(role, text)`: Maintains the sliding window buffer.
  - `updateContext(key, value)`: Stores active variables for skill execution.
- **Expected Behavior**: Maintaining coherence over a 10-turn conversation window.

### 5. `narrative.js`
**Self-Concept / Narrative Arc.**
- **Role**: Persistent identity, versioning, and achievement tracking.
- **Key Functions**:
  - `getBaseContext()`: Constructs a dynamic self-description (Who am I right now?).
  - `adjustFocus(stateIndices)`: Injects a "Self-Anchor" (Prototype 0) into the attention stream based on stability.
- **Expected Behavior**: Dynamic, non-recursive identity reporting.

---

## 🔌 Interfaces (`/interfaces`)

1. **`input_bus.js`**: Environment sensing (OS info, memory, load).
2. **`output_bus.js`**: Primitive execution. Handles `log_output` (ANSI green text) and `wait`.

---

## 📁 Data Structure

### Core Cold Storage (`/data/cold`)
- `skills_library.json`: The "Hardcoded" cognitive foundation.
- `learned_skills.json`: User-taught behaviors.
- `vectors.bin`: 1024 prototype vectors (The DNA of Perception).
- `world_model.weights`: Trained MLP parameters.
- `knowledge_graph.db`: SQLite Semantic Memory.
- `episodic_log.db`: SQLite interaction history.

### Hot Buffer (`/data/hot`)
- `working_context.json`: Current variable state.
- `short_term_buffer.json`: Recent interactions.
- `inhibited_drafts.json`: Skills currently being "ignored" due to failure.
