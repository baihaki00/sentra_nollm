# Sentra: No-LLM Biological Cognitive Architecture

Sentra is a research project designed to build a sovereign digital organism that learns organically through interaction, without relying on Large Language Models (LLMs), external APIs, or pre-trained transformers.

## Project Overview

Sentra v0.4 represents the transition from a reflexive agent to a "thinking" organism. It implements a biological cognitive architecture featuring:

- **Short-Term Memory (STM)**: A working memory buffer for context retention, topic tracking, and anaphora resolution.
- **Procedural Memory**: A skill-based system that matches user intent to discrete actions using Hamming distance and prototypes.
- **Semantic Memory**: A Knowledge Graph (`knowledge_graph.db`) that stores declarative facts as Subject-Relation-Object triples.
- **Metacognition**: Self-aware confidence thresholds that trigger curiosity and conversational learning when encounter unknown concepts.
- **Homeostasis**: Internal drives (Energy, Curiosity) that persist across sessions.

## Core Philosophy: Immutable Architecture

Sentra follows the "DNA vs. Brain Matter" split:
- **DNA (Code)**: The logic layer (`core/`, `memory_systems/`) is read-only and immutable.
- **Brain Matter (Data)**: All intelligence, skills, and knowledge live in the `data/` directory.

Sentra starts as a *Tabula Rasa* (Empty Brain) and learns entirely through its interactions with the Creator.

---
*Created by Baihaki*
