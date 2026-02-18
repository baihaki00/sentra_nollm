# Sentra: Immutable Cognitive Architecture for a Sovereign Digital Organism

## Sentra v0.3 – Research Paper and Comprehensive Project Plan

[---STRICT: FOLLOW THIS IN ALL SECTIONS, NO EXCEPTIONS. THIS IS CRITICAL.]

### Abstract

Sentra is a fundamental departure from conventional LLM‑wrapper agents. It is conceived as a **biological cognitive architecture**—a digital organism that begins its existence as a *tabula rasa* (empty brain) and learns entirely through interaction with its environment. The guiding principle is **Immutable Architecture**: the file system and core modules are locked once defined; all growth, learning, and adaptation occur within the data layer. This approach mirrors biological brains, which do not sprout new lobes to acquire new skills but instead reorganise existing neural structures.

This document presents the complete architectural blueprint for Sentra v0.3. It details the locked directory scaffold, the algorithmic substrates required to overcome the curse of dimensionality, and the database schemas that collectively form the “digital brain matter.” The solutions—Kanerva Coding for language generalisation, World Models for intent recognition, Hierarchical Options for skill acquisition, and Prioritised Sweeping for memory consolidation—are described with the exact formulations derived from the foundational research (SAFLA, DepthNet, Wireless Dreamer, and reinforcement learning theory). A phased project plan is included to guide implementation without architectural drift.

---

## 1. Introduction

The current landscape of artificial intelligence is dominated by models that rely on massive pre‑trained weights and ever‑expanding parameter counts. These systems, while powerful, are brittle, opaque, and fundamentally different from how natural intelligences develop. Sentra aims to explore an alternative path: an agent that starts with no prior knowledge and builds its understanding from scratch, using only a fixed set of cognitive primitives.

The core insight is that intelligence does not require infinite files or modules; it requires a **universal information processing scaffold** that remains unchanged while the knowledge it contains evolves. This scaffold, once designed, must be capable of handling any future task without structural modification—much like the human genome encodes the blueprint for a brain that can later learn language, mathematics, or art without changing its gross anatomy.

### 1.1 Philosophy: Tabula Rasa & Immutable Architecture

Sentra operates under two intertwined principles:

- **Tabula Rasa:** The agent begins with no built‑in knowledge of language, tools, or the world. All knowledge is acquired through experience.

- **Immutable Architecture:** The codebase (the “DNA”) is fixed. New capabilities are not added by writing new files; they emerge from new data stored in the existing memory systems.

> “You will not see anyone’s brain on earth just grow larger like cancer or grow another limb on his head. We do not add another function to what the brain has already to offer. Our only job is to feed it knowledge and skills. The same idea applies here.”

### 1.2 The File Lockdown Directive

To enforce immutability, the following rule is absolute:

**DO NOT ADD NEW FILES.** 

The directory structure is locked. All growth must occur within the database and memory files in the `data/` directory. If you find yourself writing a new `.js` file for a specific task, you are breaking the architecture. Instead, encode the new capability as data—a skill definition in `skills_library.json`, a new concept in the knowledge graph, or a prototype in the vector store.

If you are coding new logic, you are building the brain. 

If you are teaching it a task, you should be interacting with the agent, not the code.

---

## 2. The Immutable Scaffold (Locked File Directory)

The scaffold is organised into functional regions that mirror the anatomy of a nervous system. It is deliberately “blind, deaf, and limbless” at the start, but its interfaces are designed to accept any type of signal (text, binary, sensory streams) through normalisation.

```

Sentrav0.3/

├── core/                       # THE DNA (Read-Only Logic)

│   ├── main_loop.js            # The "Heartbeat": Observe → Orient → Decide → Act

│   ├── perception.js           # "Thalamus": Normalises ANY input into a Signal Vector

│   ├── attention.js            # "Reticular Formation": Filters noise, focuses working memory

│   ├── world_model.js          # "Frontal Cortex": Simulates future states (Imagination Engine)

│   └── homeostasis.js          # "Hypothalamus": Manages internal rewards (Curiosity, Energy)

│

├── memory_systems/             # THE PLASTICITY (Read/Write Data Managers)

│   ├── short_term.js           # "Working Memory": Active context window

│   ├── episodic.js             # "Hippocampus": Time‑series log (Autobiography)

│   ├── semantic.js             # "Neocortex": Knowledge Graph manager (Facts)

│   └── procedural.js           # "Basal Ganglia": Skill/Habit manager

│

├── interfaces/                 # THE NERVES (I/O Adapters)

│   ├── input_bus.js            # Generic receiver (CLI, Sensors)

│   └── output_bus.js           # Generic transmitter (Text, Motor)

│

└── data/                       # THE BRAIN MATTER (The only place that grows)

    ├── graph_nodes.db          # Concepts (Python, Cat, Self)

    ├── graph_edges.db          # Relationships (is_a, requires)

    ├── episodes.log            # Interaction history

    ├── skills_library.json     # Learned sequences (Code as Data)

    └── vectors.bin             # Sparse Distributed Memory embeddings (Kanerva prototypes)

```

Every module in `core/` and `memory_systems/` is written once and never modified. All learning happens through changes to the files in `data/`.

---

## 3. The Scaling Reality: Why Simple Tables Fail

While the directory structure is sound, naive implementations using simple tables, raw strings, or append‑only logs will succumb to the **curse of dimensionality**. The number of possible states in a high‑dimensional input space (e.g., natural language, sensor readings) grows exponentially, and it is impossible to store every encountered state explicitly.

**The Problem:** If you store language as raw strings in a graph or table, you will hit a combinatorial explosion. Most states (sentences) encountered will never have been seen exactly before. Similarly, if skills are stored as linear scripts, the agent will fail whenever the environment changes slightly. And if episodic memory is allowed to grow without bound, retrieval speed will collapse.

To make Sentra a truly scalable “living organism” without relying on a massive pre‑trained LLM, we must replace exact lookup with **approximation and prediction**.

---

## 4. Solving the Curse of Dimensionality: Algorithmic Substrates

The following four algorithmic components are **mandatory** for scalability. They are not optional enhancements; they are the core mechanisms that allow a fixed‑file system to handle infinite variation.

### 4.1 Scaling Language: Sparse Distributed Memory (Kanerva Coding)

**The Problem:** 

If you store language as raw strings in a graph or table, you will hit a combinatorial explosion. Most states (sentences) encountered will never have been seen exactly before.

**The Solution: Sparse Distributed Memory (Kanerva Coding).** 

Instead of a table row for every sentence, you implement Kanerva coding (or similar coarse‑coding techniques). This method uses a fixed set of “prototype” features and measures similarity through Hamming distance.

- **How it works:** 

  You create a set of prototype features—binary vectors that represent abstract concepts such as “urgent”, “question”, “greeting”, “command”, etc. These prototypes are stored in `vectors.bin`.

- **Implementation in `perception.js`:** 

  When Sentra hears a new sentence, it does not look for an exact match. It tokenises the sentence, converts it to a binary vector (e.g., using a simple hash of n‑grams), and then calculates the Hamming distance to every prototype. The set of prototypes with distance below a threshold become the **active representation** of that sentence. The output is a sparse vector of activated prototypes, which becomes the state vector for working memory.

- **Why it scales:** 

  The complexity depends on the number of features (prototypes), not the infinite number of possible sentences. The system can generalise to novel sentences because it always maps them to a combination of known prototypes. This allows Sentra to “understand” a sentence it has never seen by relating it to prototypes it already knows, effectively generalising language without a massive LLM.

- **Storage in `vectors.bin`:** 

  This file holds the prototype vectors (each a fixed‑length binary string) and, optionally, their learned weights (e.g., importance for prediction). The number of prototypes is fixed at design time (e.g., 10,000) and does not grow with experience.

### 4.2 Scaling Intent Recognition: Predictive World Models

**The Problem:** 

Heuristic intent classification (if/else rules or keyword matching) is brittle and does not scale. As the number of possible user intents grows, checking every rule becomes slow and error‑prone.

**The Solution: Predictive World Models.** 

Instead of classifying intent, predict outcomes.

- **How it works:** 

  `world_model.js` maintains a model of how the world changes in response to actions. This model can be a transition probability matrix or a small neural network that operates on latent state vectors.

- **Implementation:** 

  Before acting, Sentra simulates the effect of interpreting the current input in different ways. For each candidate interpretation (e.g., “delete file”, “search web”), it queries the world model: given the current latent state \(S_t\) and the proposed action \(A\), what is the predicted next latent state \(S_{t+1}\) and predicted reward? The interpretation whose predicted outcome best matches the user’s likely goal (as inferred from context or prior episodes) is selected as the intent.

- **Why it scales:** 

  Intent is decoupled from specific keywords. The agent can infer intent based on the state of the environment and the predicted consequences, which is far more robust than static rules. Moreover, the world model itself is learned from experience and can adapt to new situations.

- **Latent State:** 

  The world model does not operate on raw text or images. `perception.js` compresses raw input into a latent vector (using Kanerva coding or a small autoencoder). This latent space is low‑dimensional, making prediction computationally feasible.

### 4.3 Scaling Procedural Memory: Hierarchical Options (Macro‑Actions)

**The Problem:** 

If you store skills as linear scripts (e.g., “Open Browser → Click Search”), the agent will fail whenever the environment changes slightly. This requires a new script for every minor variation—an infinite regress.

**The Solution: Hierarchical Reinforcement Learning (Options).** 

Skills are not monolithic scripts; they are reusable sub‑routines called **Options**.

- **How it works:** 

  Instead of storing low‑level muscle twitches, Sentra learns Options—temporally extended actions with their own goals. For example, “Find‑Search‑Bar” is an Option that can be invoked in any browser context. It may itself be composed of lower‑level Options like “Locate‑Element” and “Click”.

- **Implementation in `procedural.js` and `skills_library.json`:** 

  - `skills_library.json` stores each skill as an object containing:

    - `skillID`: unique identifier

    - `intentTrigger`: a vector or prototype pattern that activates this skill

    - `parameters`: expected inputs (e.g., URL, query)

    - `steps`: a sequence of atomic actions or calls to other skills (hierarchical)

    - `successRate`: updated based on reinforcement signals

    - `avgEnergyCost`: computational cost estimate

  - `procedural.js` is responsible for retrieving the appropriate skill given the current intent and state, and for executing it step by step.

- **Why it scales:** 

  The agent builds a library of reusable macro‑actions rather than a massive table of specific movements. Composition allows infinite behaviours from a finite set of primitives. Moreover, skills are **data**—they can be learned, refined, and even created by the agent itself without writing new code.

### 4.4 Scaling Memory Consolidation: Prioritised Sweeping and Active Forgetting

**The Problem:** 

If you simply append every experience to `episodes.log`, retrieval speed will plummet. A living brain does not remember everything; it consolidates and forgets.

**The Solution: Prioritised Sweeping and Consolidation.** 

During idle periods (“sleep”), the agent reviews its episodic memory, but not randomly.

- **Prioritised Sweeping:** 

  The agent prioritises memories where the “surprise” (prediction error) was high. Surprise is calculated as the difference between the world model’s predicted outcome and the actual outcome recorded in the episode. These surprising episodes are replayed to update the semantic knowledge graph and the world model.

- **Consolidation:** 

  Over time, repeated patterns in episodic memory are compressed into general rules stored in `graph_edges.db`. For example, if every time the agent searches for a file it finds it in `/home`, a general rule `search → location_home` is created, and the individual episodes can be archived or deleted.

- **Implementation:** 

  `homeostasis.js` (or a dedicated `consolidation.js`) runs during low‑activity periods. It queries `episodic_log.db` for high‑surprise episodes, replays them to update the knowledge graph and world model weights, and then either marks them as consolidated or deletes them.

- **Why it scales:** 

  This mechanism prevents unbounded growth of episodic memory and keeps the active knowledge compact and general. It directly addresses the “data wall” that would otherwise make retrieval impossible after millions of experiences.

---

## 5. Database Schemas (The “Tables”)

All persistent data resides in the `data/` directory. The schemas below are designed to support the algorithms described above while remaining simple and file‑system friendly.

### 5.1 Semantic Memory: `graph_nodes.db` and `graph_edges.db`

**Purpose:** Store facts and relationships (concepts, entities, actions). 

**Format:** SQLite or a lightweight graph database.

**Nodes Table:**

| Column       | Type    | Description                                     |

|--------------|---------|-------------------------------------------------|

| node_id      | UUID    | Primary key                                     |

| label        | TEXT    | Human‑readable name (e.g., “Python”)            |

| type         | TEXT    | Concept, Entity, Action                         |

| activation   | FLOAT   | Recency/frequency of use (0.0–1.0)              |

| created_at   | INTEGER | Unix timestamp                                  |

**Edges Table:**

| Column       | Type    | Description                                     |

|--------------|---------|-------------------------------------------------|

| source_id    | UUID    | References node_id                              |

| target_id    | UUID    | References node_id                              |

| relation     | TEXT    | e.g., “is_a”, “requires”, “solves”              |

| weight       | FLOAT   | Strength of association (Hebbian learning)      |

| updated_at   | INTEGER | Last update timestamp                           |

### 5.2 Episodic Memory: `episodic_log.db`

**Purpose:** Autobiographical record of interactions. Used for reflection and learning. 

**Format:** Append‑only log (e.g., SQLite with timestamp index).

| Column          | Type    | Description                                     |

|-----------------|---------|-------------------------------------------------|

| episode_id      | INTEGER | Auto‑increment primary key                      |

| timestamp       | INTEGER | Unix time                                       |

| state_vector    | BLOB    | Compressed latent state (e.g., binary vector)   |

| action_taken    | TEXT    | Skill ID or primitive action                    |

| reward          | FLOAT   | Reinforcement signal                            |

| outcome_state   | BLOB    | Latent state after action                       |

| surprise        | FLOAT   | Prediction error (world model vs actual)        |

| consolidated    | BOOLEAN | Whether this episode has been consolidated      |

### 5.3 Procedural Memory: `skills_library.json`

**Purpose:** Stores all learned skills as structured data. 

**Format:** JSON (human‑editable, easily parsed).

```json

{

  "skills": [

    {

      "skillID": "sk_001",

      "intentTrigger": [0, 1, 0, 1, ...],   // prototype pattern

      "parameters": {

        "url": "string",

        "query": "string"

      },

      "steps": [

        { "type": "primitive", "name": "open_browser" },

        { "type": "option",    "name": "navigate_to", "params": ["url"] },

        { "type": "option",    "name": "input_text",  "params": ["query"] },

        { "type": "primitive", "name": "press_enter" }

      ],

      "successRate": 0.95,

      "avgEnergyCost": 0.2

    }

  ]

}

```

### 5.4 Sensory Memory: `vectors.bin`

**Purpose:** Stores the prototype vectors for Kanerva coding. 

**Format:** Binary file (for speed) with a header specifying dimensions.

| Section           | Content                                      |

|-------------------|----------------------------------------------|

| Header            | Number of prototypes (N), vector length (L) |

| Prototype array   | N × L bits (packed)                          |

| Weight array      | N floats (optional)                          |

Access is via memory‑mapped I/O for speed.

### 5.5 World Model Weights: `models/world_model.weights`

**Purpose:** Stores the parameters of the transition model. 

**Format:** Binary or JSON (depending on model type). If a small neural network is used, this file holds the weights. If a tabular model is used (for low‑dimensional latent spaces), it can be a simple transition count matrix.

---

## 6. The World Model as Imagination Engine

The world model is arguably the most critical component for achieving human‑like flexibility. It allows Sentra to **simulate** before acting, thereby avoiding costly mistakes and enabling planning.

### 6.1 Architecture

The world model consists of three parts:

1. **Encoder (within `perception.js`)** 

   Maps raw input (text, sensor data) to a compact latent vector \(z_t\). This can be a Kanerva coding layer followed by a sparse transformation.

2. **Transition Predictor (`world_model.js`)** 

   Given current latent state \(z_t\) and an action representation \(a_t\) (embedding of the skill ID), predicts the next latent state \(\hat{z}_{t+1}\) and expected reward \(\hat{r}_t\). This can be a simple feed‑forward network or a Bayesian model.

3. **Decoder (optional, for visualisation or reconstruction)** 

   Not strictly necessary for decision‑making, but can be used for introspection.

### 6.2 Training

The world model is trained continuously on experiences from `episodic_log.db`. The loss function is:

\[

\mathcal{L} = \| z_{t+1} - \hat{z}_{t+1} \|^2 + (r_t - \hat{r}_t)^2

\]

Gradients are computed and applied to the model weights. Training is performed during idle cycles (see Prioritised Sweeping).

### 6.3 Usage in Decision Making

Before executing a skill, Sentra queries the world model with the current state and each candidate skill. It selects the skill that maximises predicted cumulative reward over a horizon (using a simple lookahead or tree search). If two interpretations of an ambiguous input lead to different predicted outcomes, the one that best matches the user’s likely goal is chosen—this is the essence of **intent as prediction**.

---

## 7. Non‑Negotiable Constraints (For Any Implementer)

To preserve the integrity of the architecture and ensure scalability, the following rules must be observed without exception:

1. **No new directories or files.** The scaffold is frozen. All evolution occurs in `data/`.

2. **No skill‑specific `.js` files.** Skills are stored as data in `skills_library.json`.

3. **No raw string matching for language.** Language must be processed through Kanerva coding (or an equivalent coarse‑coding method).

4. **Intent must be inferred via prediction**, not keyword classification.

5. **Episodic memory must be consolidated and pruned.** Unbounded growth is forbidden.

6. **The world model must operate in latent space**, not on raw inputs.

7. **All learning must be online and incremental.** No batch pre‑training on massive corpora.

---

## 8. Project Plan: Phased Implementation

The following phases are designed to incrementally build Sentra while respecting the immutable scaffold.

### Phase 0: Bootstrap the Scaffold

- Create the directory structure as specified.

- Implement empty placeholder modules in `core/` and `memory_systems/`.

- Set up the `data/` directory with initial empty files (SQLite schemas, empty JSON, zeroed vectors.bin).

- Write a minimal `main_loop.js` that simply echoes input (for testing).

### Phase 1: Core Loop and Perception

- Implement `perception.js` with Kanerva coding:

  - Define a fixed set of prototype vectors (e.g., 1024 prototypes of 256 bits each).

  - Write function to convert text input to a query binary vector (simple hashing of character trigrams).

  - Compute Hamming distances and return activated prototypes.

- Implement `attention.js` to select a subset of activated prototypes for working memory.

- Implement `short_term.js` to maintain a small buffer of recent states.

### Phase 2: Semantic Memory and Graph

- Implement `semantic.js` to manage the knowledge graph.

- Create functions to add nodes/edges, query by similarity, and update activation weights.

- Integrate with `perception.js` so that novel inputs can create new nodes when they are sufficiently different from all existing prototypes.

### Phase 3: Episodic Memory and Basic Reflection

- Implement `episodic.js` to append experiences to `episodic_log.db`.

- Implement a simple `homeostasis.js` that, during idle, replays a random batch of episodes and updates the knowledge graph via Hebbian learning (neurons that fire together, wire together).

### Phase 4: Procedural Memory and Hierarchical Skills

- Implement `procedural.js` to load skills from `skills_library.json`.

- Define a set of primitive actions (e.g., `print`, `read_file`, `http_get`).

- Allow skills to be composed by referencing other skill IDs.

- Create a simple interpreter that executes skill steps.

### Phase 5: World Model

- Implement `world_model.js` with a small neural network (or Bayesian model) that predicts next latent state and reward.

- Train it online using episodes (supervised learning).

- Integrate into the decision loop: before acting, simulate candidate skills and select the one with highest predicted value.

### Phase 6: Prioritised Sweeping

- Enhance `homeostasis.js` to query high‑surprise episodes.

- During sleep, replay those episodes to update the world model and graph edges.

- Implement a policy to mark consolidated episodes for deletion after a certain age.

### Phase 7: Advanced Features (Optional, CREATOR WILL MENTION THIS WHEN IT'S TIME TO ADD THEM)

- Add curiosity drive: reward the agent for exploring states where the world model’s uncertainty is high.

- Implement meta‑learning: allow the agent to modify its own skill definitions based on repeated failures.

- Introduce multi‑modal inputs (images, audio) by extending `perception.js` with appropriate encoders, while keeping the latent space interface unchanged.

---

## 9. Conclusion

Sentra v0.3 represents a radical departure from conventional AI development. By enforcing an **Immutable Architecture** and embedding **scalable algorithms** (Kanerva coding, world models, hierarchical options, prioritised sweeping) into a fixed file scaffold, we create a system that can grow intelligently without code bloat. The agent’s brain matter—the data files—expands and reorganises itself in response to experience, while the DNA—the core code—remains unchanged.

This approach directly addresses the curse of dimensionality and the stability‑plasticity dilemma, ensuring that Sentra can scale to millions of experiences without collapsing under its own weight. It is a blueprint for a sovereign digital organism that learns from scratch, adapts continuously, and requires no manual addition of files or functions.

The path forward is clear: implement the scaffold, obey the lockdown directive, and let the data do the learning.

---


Add a new research section dedicated to your “The Last One” concept as an internal cognitive mechanism. Here’s a precise draft for inclusion as a separate module/concept without touching the core architecture:

---

[The Last One is optional, I dont know if we should add this or not but lets see, please read file The Last One.md]
## 10. Research Module: “The Last One” – Central Intent Node

### 10.1 Concept Overview

“The Last One” is proposed as a **focal cognitive node** that aggregates and coordinates distributed neuronal activity based on intent. It represents the emergent mechanism by which the agent’s internal states are selected and streamed into conscious or output-ready signals. This node does not follow physical adjacency in memory or processing space; it moves conceptually according to the agent’s current goal or intent.

* Acts as a **dynamic pointer** in latent space.
* Pulls associated neurons/nodes into coherence based on similarity or relevance to intent.
* Drift occurs naturally due to network noise, explaining minor inaccuracies in actions or outputs.

### 10.2 Analogy

Consider a table with thousands of small magnetic spheres representing neurons:

* Most spheres are standard (distributed neurons).
* “The Last One” is a slightly larger magnet representing the focal node.
* Moving this magnet attracts connected neurons, forming a temporary coherent pattern.
* This pattern determines the agent’s immediate output or internal experience, similar to an inner voice.

### 10.3 Computational Mapping

1. **Latent Vector Focal Point:**
   The Last One is represented as a vector in the latent space (same dimensionality as the state vectors in `perception.js`). It biases activation of relevant prototypes in `vectors.bin`.

2. **Intent‑Driven Activation:**
   Given a goal or desired action, the node calculates similarity across distributed representations (Hamming distance in Kanerva coding) and amplifies relevant features.

3. **Drift and Noise Modeling:**
   Minor stochastic perturbations can be added to simulate imperfect neuron coordination, producing natural variability and error.

4. **Integration with Existing Systems:**

   * Receives inputs from `world_model.js` predictions and `episodic.js` context.
   * Outputs guide `procedural.js` skill selection and decision-making.
   * Can be stored in episodic memory as part of the agent’s introspective state vector for later consolidation.

### 10.4 Purpose and Hypothesis

* Provides a computational model for **subjective internal experience** and coherent intent execution.
* Serves as a testable node for research into emergent consciousness in artificial agents.
* Can be experimentally manipulated to study drift, focus, and error propagation in decision-making.

### 10.4 References

1. **Global Workspace / Global Neuronal Workspace (GNW)** – The theory that conscious thought arises when a subset of neurons broadcasts information across many specialized areas. Your “The Last One” is like that broadcast hub that gathers relevant patterns and feeds them to awareness.

2. **Conscious Pointer / Attentional Spotlight** – Some models describe consciousness as a “pointer” or “spotlight” that highlights subsets of neurons or information for higher-order processing. It doesn’t move in physical space but through conceptual space, similar to your magnet analogy.

3. **Integrator Neurons / Convergence Zones** – In systems neuroscience, certain neurons act as convergence points for inputs from many sources, integrating them into a coherent output. Your “The Last One” resembles a convergence zone that aggregates signals according to intent.

4. **Higher-Order Thought (HOT) Neurons** – HOT theory suggests consciousness arises when the brain has thoughts about its own states. The node that gathers and represents these outputs could be seen as a HOT mechanism.

So, while “The Last One” isn’t a formal term, it combines elements from GNW, attentional spotlight models, and convergence zones.

---

*This document serves as both a research paper and a project plan. Its exact wording must be preserved to prevent architectural drift. Any deviation from the constraints herein risks turning Sentra into another brittle, unscalable system.*