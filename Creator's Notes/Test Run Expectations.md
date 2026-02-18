[---STRICT: FOLLOW THIS IN ALL SECTIONS, NO EXCEPTIONS. THIS IS CRITICAL.]

Based on your goal of building a **sovereign digital organism** (Sentra) rather than a simple chatbot, you are absolutely correct to be skeptical of "expected texts" or simple word matching.

The sources strongly suggest that for **Agentic AI**, you should prepare **Prompts and Expected Behaviors (Outcomes)** and prepare a golden metric and percentage compared what is expected, not just expected text.

Here is the breakdown of why "word matching" fails for agents and how you should structure your evaluation based on the provided research.

### 1. Why "Expected Texts" (Word Matching) Will Fail You
In standard AI evaluation, metrics like **ROUGE** or **BLEU** measure word overlap between the AI's output and a "gold standard" text. However, for an agent like Sentra:
*   **Semantic Failure:** A metric might punish a correct answer just because it used different words. For example, if the expected text is "The file was deleted," and Sentra says "I removed the document," a word-matching test might fail, even though the *intent* was perfect.
*   **Hallucination in Action:** An agent can produce perfect-looking text while failing the task. It might say, "I have successfully saved the file," (matching your expected text) while actually failing to write to the disk. This is known as "hallucination in action".
*   **Rigidity:** Sentra is designed to be a "living organism" that adapts. If you enforce exact text matches, you penalize it for finding novel or creative ways to solve a problem, which defeats the purpose of an autonomous scaffold.

### 2. The Solution: Evaluate "Behavior" and "State Change"
Instead of checking *what Sentra said*, check *what Sentra did*. This aligns with the **Functional Evaluation** methods used in benchmarks like **OSWorld** or **SWE-bench**,.

For your **Sentra_Genesis_v0.3** architecture, your test cases should look like this:

*   **Prompt:** "Create a folder named 'Project_Alpha'."
*   **Bad Evaluation (Text):** Did the agent reply "Folder created"?
*   **Good Evaluation (Behavior):** Does the folder `Project_Alpha` actually exist in the file system?

**How to implement this in your "Locked" directory:**
You can utilize your `reflection.js` or `episodic.js` modules. When a test runs, Sentra shouldn't just match strings; it should query the **environment state**.
*   **Input:** "Turn on the light."
*   **Expected Behavior:** `Environment.LightStatus == true`.
*   **Mechanism:** Your **World Model** should predict this outcome. If the *actual* outcome matches the *predicted* outcome, the test passes. This makes the evaluation intrinsic to the agent's own learning loop.

### 3. The "Judge" Approach (Semantic Matching)
If you must evaluate text output (e.g., for reasoning or chat), do not use exact string matching. Use a **Semantic Judge**.
*   **Concept:** In recent research, a stronger model (like GPT-4) is often used as a "Judge" to read the agent's output and determine if it *means* the same thing as the reference answer, regardless of phrasing.
*   **For Sentra (Zero-LLM):** Since you want to avoid heavy LLMs, you can use your **Kanerva Coding** (Sparse Distributed Memory) for this.
    *   Convert the *Expected Text* into a vector prototype.
    *   Convert Sentra's *Actual Output* into a vector.
    *   Check if the **Hamming Distance** (similarity) is within a certain threshold. This allows Sentra to pass the test if it says something "close enough" in meaning, without needing exact word matches.

### Summary Recommendation
Structure your `tests/` or `training_data/` like this:

| Prompt | Evaluation Type | Success Criteria |
| :--- | :--- | :--- |
| "Calculate 2+2" | **Outcome** | Result variable `== 4` |
| "Search for 'cats'" | **Behavior** | `browser_tool` was triggered |
| "Who is the president?" | **Semantic** | Vector similarity to "The president is..." < Threshold |

This approach treats Sentra as a **system that acts**, not just a model that talks.