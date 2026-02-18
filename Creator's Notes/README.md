# Sentra: Immutable Cognitive Architecture for a Sovereign Digital Organism
[---STRICT: FOLLOW THIS IN ALL SECTIONS, NO EXCEPTIONS. THIS IS CRITICAL.]
[---STRICT: FOLLOW THIS IN ALL SECTIONS, NO EXCEPTIONS. THIS IS CRITICAL.]
[---STRICT: FOLLOW THIS IN ALL SECTIONS, NO EXCEPTIONS. THIS IS CRITICAL.]
[
This document (and all contents within this directory) is prepared by Creator, Bai. It is intended for the agentic AI to read first, including all files inside Creator's Notes, to resume exactly where it left off. This folder (Creator's Notes) functions as hands-off documentation. Whoever read & accesses this must:

    • Accumulate contexts within this directory, especially README.md, Sentra.md, The Last One.md and Test Run Expectations.md
    • Not modify any files inside Creator's Notes.
    • Not create new files for this project except whatever that is written in `DIRECTORY STRUCTURE (LOCKED)` section.
    • Record progress and current states in Progress.md after completing multi-step tasks, to prevent drift from the project objective.  
    • Strictly follow all instructions in Sentra.md and README.md to maintain alignment with project goals.  
    • Treat anything written inside "[]" as top priority and follow it without exception.
    • Strictly whatever that is written in'Sentra.md' and 'README.md'.
    • All inputs to Sentra must be through CLI input_bus.js, and must pass all the test (refer Test Run Expectations), and maybe soon opens up to remote (Telegram bot, WebUI, app, or etc)
]

**Sentra v0.3 – Project Overview**

Sentra is a departure from traditional LLM-wrapper agents. NO MORE LLM. It is designed as a biological cognitive architecture—a digital organism that starts with an "empty brain" (Tabula Rasa) and learns entirely from interaction.

The core philosophy is Immutable Architecture. Just as a human brain does not grow new lobes to learn a new language, Sentra's codebase does not grow new files to learn new skills. The code provides the mechanism for processing; the intelligence lives entirely in the data.

--------------------------------------------------
FILE LOCKDOWN DIRECTIVE
--------------------------------------------------
DO NOT ADD NEW FILES.
The directory structure is locked.
All growth must occur within the database and memory files in the data/ directory.
If you find yourself writing a new .js file for a specific task, you are breaking the architecture.
Write a tool definition in skills_library.json instead.
If you are coding new logic, you are building the brain.
If you are teaching it a task, you should be interacting with the agent, not the code.

--------------------------------------------------
DIRECTORY STRUCTURE (LOCKED)
--------------------------------------------------
Sentra_v0.3/
├── core/ # THE DNA (Read-Only Logic)
│ ├── main_loop.js # The "Heartbeat": Observe → Orient → Decide → Act
│ ├── perception.js # "Thalamus": Normalizes ANY input into a Signal Vector
│ ├── attention.js # "Reticular Formation": Filters noise, focuses working memory
│ ├── world_model.js # "Frontal Cortex": Simulates future states (Imagination Engine)
│ └── homeostasis.js # "Hypothalamus": Managing internal rewards (Curiosity, Energy)
│
├── memory_systems/ # THE PLASTICITY (Read/Write Data Managers)
│ ├── short_term.js # "Working Memory": Active context window
│ ├── episodic.js # "Hippocampus": Time-series log (Autobiography)
│ ├── semantic.js # "Neocortex": Knowledge Graph manager (Facts)
│ └── procedural.js # "Basal Ganglia": Skill/Habit manager
│
├── interfaces/ # THE NERVES (I/O Adapters)
│ ├── input_bus.js # Generic receiver (CLI, Sensors)
│ └── output_bus.js # Generic transmitter (Text, Motor)
│
└── data/ # THE BRAIN MATTER (The only place that grows)
    ├── hot/ # Fast, volatile memory (RAM/Cache)
    │ ├── working_context.json # Current "thought" loop & attention focus
    │ ├── short_term_buffer.json # Last N interactions (Replay Buffer)
    │ └── active_goals.json # Current objectives and dopamine levels
    │
    ├── cold/ # Persistent "Brain Matter" (The Disk)
    │ ├── knowledge_graph.db # Semantic Memory (Facts & Concepts)
    │ ├── episodic_log.db # Episodic Memory (Autobiography)
    │ ├── skills_library.db # Procedural Memory (Tools & Actions)
    │ └── vectors.bin # Sensory Memory (Kanerva Coding Prototypes)
    │
    └── models/ # Learned Weights (Not LLMs, but small heuristic models)
        ├── world_model.weights # Prediction matrix for State(t) -> State(t+1)
        └── value_function.weights # RL weights for estimating reward
├── tests/
│ ├── (whatever tests you see fit)

--------------------------------------------------
SCALABILITY AND THE CURSE OF DIMENSIONALITY
--------------------------------------------------
The directory structure alone does not solve the curse of dimensionality.
The algorithm inside vectors.bin and perception.js does.

The Problem:
If you store language as raw strings in a graph or table,
you will hit a combinatorial explosion.
Most states (sentences) encountered will never have been seen exactly before.

The Solution:
Sparse Distributed Memory (Kanerva Coding).
Instead of a table row for every sentence, you must implement Kanerva Coding or similar coarse-coding techniques.
• How it works: You create a set of "prototype" features (e.g., specific concepts like "urgent", "question", "greeting").
• Implementation: When Sentra hears a new sentence, it doesn't look for an exact match. It calculates the "Hamming distance" (similarity) to these prototypes.
• Why it scales: The complexity depends on the number of features, not the infinite number of possible sentences. This allows Sentra to "understand" a sentence it has never seen by relating it to prototypes it already knows, effectively generalizing language without a massive LLM.

--------------------------------------------------
WORLD MODEL (IMAGINATION ENGINE)
--------------------------------------------------
world_model.js must not operate on raw text or raw data.
It must operate in latent space.
perception.js compresses raw input into a latent state vector (S_t).
world_model.js predicts the next latent state (S_t+1).
Before acting, Sentra simulates outcomes.
Intent is inferred by predicted state transitions,
not keyword classification.

--------------------------------------------------
EPISODIC MEMORY AND THE DATA WALL
--------------------------------------------------
episodes.log is append-only by default.
If millions of experiences are stored without consolidation,
retrieval speed will collapse.

The Solution:
Prioritized Sweeping and Active Forgetting.
During idle ("sleep"):
- Prioritize memories with high surprise (prediction error)
- Compress episodic patterns into semantic relationships
- Delete or archive raw episodes
A living brain does not remember everything.
It optimizes.

--------------------------------------------------
DATABASE RESPONSIBILITIES
--------------------------------------------------
knowledge_graph.db: Concepts, entities, actions.
graph_edges.db: Relationships and their learned weights.
episodic_log.db: Autobiographical record of interaction.
skills_library.db: Procedural memory. Skills are data, not code.
vectors.bin: Sparse Distributed Memory (Kanerva Coding prototypes). This is mandatory for scalability.

--------------------------------------------------
NON-NEGOTIABLE CONSTRAINTS
--------------------------------------------------
1. No new directories.
2. No skill-specific .js files.
3. Language must not rely on raw string matching.
4. Intent must be inferred via prediction.
5. Memory growth must include consolidation and forgetting.
6. NO LLM, NO OLLAMA, NO APIs, that would violate the objective of this project entirely.
If these rules are violated, Sentra will drift into a brittle, unscalable system.

--------------------------------------------------
PROJECT PLAN OVERVIEW
--------------------------------------------------
Phase 1: Scaffold Initialization (Core Loop).
Phase 2: Memory Systems (Data Layer).
Phase 3: Scaling Integration (Kanerva, World Model).
Phase 4: Reflection and Optimization.
Phase 5: Testing and Awakening.
See full thesis for details.

--------------------------------------------------
FINAL NOTE
--------------------------------------------------
The future problem you sensed is the Stability–Plasticity Dilemma.
The solution is approximation, prediction, consolidation, and forgetting.
This README enforces the objective to prevent drift.