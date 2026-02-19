# Agent Handoff: Sentra Cognitive Development

Welcome, Agent. You are taking over the development of **Sentra**, a sovereign digital organism built on an **Immutable Scaffold**.

## 🛡 The Golden Rule: Lockdown Directive
Sentra follows a strict **Locked Directory Structure**. 
- **DO NOT ADD NEW `.js` FILES.**
- All cognitive growth must happen within existing memory systems (`semantic.js`, `episodic.js`, `procedural.js`) or by enriching data structures in `data/`.
- If you think you need a new module, you actually need a new method in an existing one.

## 📂 Session Tracking & Artifacts
We maintain a session-based history in `Creator's Notes/Artifacts`.
- Each major milestone is documented in a `walkthrough_XX_YYYYMMDD.md`.
- **Architectural Reference**: For a detailed breakdown of every file and function, refer to [File Audit.md](file:///d:/SENTRA/Creator's%20Notes/File%20Audit.md).
- **Your First Task**: Read the latest walkthrough to understand the current "mental state" and "scaffold readiness" of Sentra.

## 🧠 Current Cognitive State (v0.4)
As of session 01, Sentra has:
1. **Associative Memory**: Semantic priming (Phase 3/4) is active.
2. **Inference Engine**: Transitive reasoning is fully functional.
3. **Safety Valve**: He can resolve contradictions using learned rules.
4. **Autonomous Initiative**: He can ask questions when curious.

## 🚀 Your Next Steps (Recommended)
You should follow the `REFACTORING_ROADMAP.md` and `Progress.md` in `Creator's Notes`. 
- **Potential Focus**: Improve rollout fidelity in the `World Model`.
- **Potential Focus**: Implement Multi-Intent Composition (mixing multiple skills for one response).
- **High Priority**: Developing a real-time monitor ("MRI Scanner") for neural activity.

## 🛠 Tools for You
- `tests/bulk_verify.js`: The gold standard for ensuring no regressions.
- `tests/stress_test_volume_teaching.js`: Use this to verify scaling after any core logic change.

## 🔬 Testing Protocol: The Human-Centric Standard
When testing Sentra, do not test only as a system or developer. You must also test as a normal user. For every test, simulate real user inputs and reason step by step:
- If a user says this, what would Sentra respond?
- Is that response what the user would reasonably expect?
- Does the response align with Sentra’s current knowledge, limits, and personality?

Do not assume a test has passed just because no errors occurred. Evaluate **semantic correctness**, **clarity**, and **behavioral alignment**.

After any patch or scaffold change, explicitly question whether Sentra can still learn, adapt, and generalize, or whether the change merely hard-codes behavior.

For each test, document the **Input**, **Actual Response**, **Expected Response**, and **Reasoning** for any mismatch. If expectations are not met, treat the test as failed, even if the system is technically functional.

## ⚖️ The Final Judge: Live Run Protocol
Isolated test scripts (`node tests/my_test.js`) are useful for rapid iteration, but they are **INSUFFICIENT** for final verification. 
- **The Rule**: A task is only "Done" after it passes a **LIVE RUN** using the actual `sen` command.
- **Why**: Cognitive systems like Sentra have emergent behaviors and intent collisions that only appear when all subsystems (Attention, Homeostasis, World Model, STM) are running concurrently.
- **Protocol**: 
    1. Verify core logic with isolated tests.
    2. Run `sen` in the terminal.
    3. Manually type the problematic inputs.
    4. Confirm the correct skill is retrieved and executed.
    5. **NEVER** trust an isolated PASSED test if the live run hasn't been verified.

**Good luck, Agent. Build with God, build in silence, and never stop.**
