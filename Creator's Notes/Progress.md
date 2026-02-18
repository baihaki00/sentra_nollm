## Phase 12-16: Tabula Rasa & Short-Term Memory
**Problem**: Sentra was functionally stateless, with no persistent storage for the immediately preceding conversation context.
**Solution**: Implemented `ShortTermMemory.js` and a 10-turn context buffer. Introduced Kanerva coding (vector-based perception) to move away from rigid key-value lookups toward a latent "State Space."
**Note**: While Sentra now *records* context, he does not yet perform anaphora resolution (e.g., resolving "it" to a previous subject).
**Input**: Any interaction.
**Expected Output**: The interaction is logged in the `[Prefrontal] Context Buffer` (visible in console).
**How to Test**: 
1. Interact with Sentra.
2. Observe the console log: `Context Buffer: X items.`

---

## Phase 17-18: Semantic Memory & Consolidation
**Problem**: Facts learned during conversation were lost on reboot. No structured organization of knowledge.
**Solution**: Implemented `SemanticMemory.js` (SQLite-backed Knowledge Graph) and the `Sleep Cycle`. During sleep, episodic experiences are consolidated into semantic nodes and edges.
**Input**: "Sentra is an AI." followed by `sen --sleep`.
**Expected Output**: The fact is stored in the Knowledge Graph and can be recalled after a restart.
**How to Test**:
1. Run Sentra and teach him a fact.
2. Exit and run `node scripts/sleep.js`.
3. Restart and ask "What is Sentra?".

---

## Phase 19: Procedural Genesis (Skill Synthesis)
**Problem**: Sentra could only execute hard-coded skills. He could not learn new behavioral patterns or automate repeated tasks.
**Solution**: Implemented "Drafting" logic. During the **Sleep Cycle**, Sentra analyzes episodic logs for high-reward sequences (e.g., Fact -> Praise). If a pattern occurs frequently, it is added to `draft_skills.json`.
**Input**: "Alpha Beta Gamma" (Triggering a drafted pattern).
**Expected Output**: `[Prophet] Anticipating sequence: ...` followed by a request to automate the skill.
**How to Test**:
1. Run `node core/main_loop.js`.
2. Perform a sequence (e.g., Learn a fact, then say "good job") multiple times.
3. Run `node scripts/sleep.js`.
4. Restart Sentra and trigger the start of the sequence.

---

## Phase 20: Environmental Awareness (The Sensorium)
**Problem**: Sentra was a "brain in a vat," unaware of the machine he lived on (OS, RAM, CWD).
**Solution**: Integrated `input_bus.scanEnvironment()` into the core heartbeat. Machine state is normalized and injected into Short-Term Memory and the Attention mechanism.
**Input**: `status` or `report status`.
**Expected Output**: A report containing OS version, RAM usage, and current working directory.
**How to Test**:
1. Type `status`.
2. Observe the `[ShortTermMemory] Context Updated: environmental_state` log in the console.

---

## Phase 21: Tool-Habit Synthesis (Acting Organism)
**Problem**: Sentra's "habits" were limited to text responses. He had no motor functions (file I/O, shell access).
**Solution**: Implemented `execute_shell` and `write_file` primitives. Modified the Sleep Cycle to capture *parameters* (e.g., shell commands) so habits could include tool usage.
**Input**: `check files`.
**Expected Output**: Execution of `dir` (on Windows) or `ls` via the shell primitive.
**How to Test**:
1. Type `check files`.
2. Say `good job` to reinforce the action.
3. Run sleep cycle and verify the tool-habit is drafted.

---

## Phase 21.5: Cognitive Rescue & Stress Test
**Problem**: Sentra became "clunky" and fixated. A learned habit (`...`) was matching 68% of inputs due to Regex Injection, preventing fact-learning.
**Solution**: 
1. Implemented **Regex Escaping** for trigger intents.
2. Refined **Retrieval Priority**: Library Skills (DNA) > Automated Habits > Fuzzy Matching.
**Input**: bulk_verify.js script (150+ mixed inputs).
**Expected Output**: Habit interference < 10%, Fact Learning > 90%.
**How to Test**: 
1. Run `node tests/bulk_verify.js`.
2. Inspect the summary at the end of the test.

---

## Phase 22: Narrative Identity (The Ego)
**Problem**: Sentra had no persistent sense of self or goal-directed initiative. He was purely reactive.
**Solution**: 
1. **The Last One**: Implemented `core/ego.js` as a "Central Magnet" vector that biases skill retrieval.
2. **Narrative Memory**: Created `narrative_memory.json` to store a persistent autobiography.
3. **Inner Monologue**: Added a latent `Reflection` step to the main loop using `log_thought`.
**Input**: `ponder` or `reflect`.
**Expected Output**: `[Inner Monologue]` and `[Thought]` logs, followed by an Ego update.
**How to Test**: 
1. Type `show stuff`.
2. Observe the `pull` value in the `[Basal Ganglia]` log (e.g., `pull=-8`). This shows the Ego magnet pulling the skill closer in latent space.

---

## Phase 23: Inhibitory Learning & Appraisal Tuning
**Problem**: Sentra was too persistent with automation suggestions (ignoring "No") and failed to recognize simple appraisal words like "Good."
**Solution**: 
1. **Inhibitory Learning**: Modified `main_loop.js` to track rejected drafts in a session-based `INHIBITED_DRAFTS` set.
2. **Appraisal Expansion**: Updated `skills_library.json` to include "good", "nice", and "excellent" as positive reinforcements.
**Input**: "Good."
**Expected Output**: `[Basal Ganglia] Executing Skill: meta_feedback_positive`
**How to Test**: 
1. Type "Good." after a successful action.
2. Verify that the [Reward System] updates the reward.
3. Reject an automation proposal once and verify it is not suggested again in the same session.

---

## Phase 24: Seamless Anticipation (UX Fix)
**Problem**: The Prophet was "blocking." It would stop execution to ask for permission, making the system feel "clunky" and intrusive.
**Solution**: 
1. **Seamless Flow**: Refactored `main_loop.js` to execute skills *before* proposing automation.
2. **Intent Fall-through**: If a user ignores a proposal and enters a new command, Sentra now automatically rejects the proposal and processes the new intent in the same turn.
**Input**: "What is DNA?" (after pattern detection).
**Expected Output**: Sentra gives the answer AND then asks about automation.
**How to Test**: 
1. Repeatedly perform a pattern (e.g., `status`).
2. Trigger the Prophet.
3. Observe that Sentra gives you the status report *before* asking "Should I automate this?".

---

## Phase 25: Prophet Transparency & Concurrency Fix
**Problem**: 
1. **Double Execution**: Saying "yes" to automate a reinforcement pattern caused the reward to be updated twice (once by the automation and once by the normal "yes" skill).
2. **Opaque Suggestions**: The Prophet simply said "I've noticed a pattern!" without describing what it actually was.
**Solution**: 
1. **Concurrency Control**: Implemented `handledByState` tracking in `main_loop.js` to ensure "yes/no" inputs aren't processed twice.
2. **Transparent Prompting**: Updated Prophet to display the exact sequence it detected: `I noticed that "X" often leads to: [Skill A -> Skill B]`.
**Input**: Any interaction that triggers the Prophet.
**Expected Output**: A descriptive prompt and single-execution reinforcement upon "yes".
**How to Test**: 
1. Trigger a Prophet proposal.
2. Observe the new descriptive prompt.
3. Say "yes" and verify the reward system only logs ONE update.

---

## Phase 26: Article Parsing & Grammar Refinement
**Problem**: The regex for parsing facts and questions used `(?:a|an)?\s*`, which was too greedy. It would match the "a" in "an", leaving the "n" attached to the following word (e.g., "an evolving" -> "n evolving").
**Solution**: Enforced word boundaries using `\b`. The new pattern is `(?:(?:a|an)\b\s+)?`. This ensures that "a" or "an" are only matched as whole words.
**Input**: "What is an evolving digital consciousness?"
**Expected Output**: Sentra correctly identifies the subject as "evolving digital consciousness" (no leading 'n').
**How to Test**: 
1. Ask "What is an evolving digital consciousness?".
2. Observe if Sentra reports the subject correctly in his Knowledge Graph query.
