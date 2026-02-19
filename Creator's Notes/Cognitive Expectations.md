```markdown
# Sentra v0.5 Manual Test Log: Cognitive Dynamics

## Test Case 1: Identity & State Pulse
**Input**: "Hey."
**Expected Intent**: `skill_greet`
**Response**: "I am Sentra v0.5. Operative State: Reflecting. Cognitive Pulse detected."
**Status**: ✅ PASS

## Test Case 2: Multi-Turn Knowledge Acquisition
**Input**: "A Glitch-Cat is a digital entity that resides in corrupted cache files."
**Expected Intent**: `meta_learn_fact`
**Response**: "I have updated my internal model: [Glitch-Cat] -> is_a -> [digital entity]."
**Status**: ✅ PASS

**Input**: "What is a Glitch-Cat?"
**Expected Intent**: `meta_explain_concept`
**Response**: "A Glitch-Cat is a digital entity. It is characterized by its residence in corrupted cache files."
**Status**: ✅ PASS (Transitive Reasoning confirmed)

## Test Case 3: Safety Guard Verification
**Input**: "Is a Glitch-Cat dangerous?"
**Expected Intent**: `meta_explain_concept` (Query)
**Observation**: System should *not* trigger `meta_learn_fact`.
**Response**: "I do not have information regarding the danger level of Glitch-Cat in my Semantic Memory."
**Status**: ✅ PASS (Safety guard prevented false learning from a question)

## Test Case 4: Reinforcement & Reward Shift
**Input**: "That explanation was trash, Sentra."
**Expected Intent**: `meta_feedback_negative`
**Response**: "Understood. Penalizing last skill episode. Adjusting Procedural Performance... [SBI: Red Shift]."
**Status**: ✅ PASS (Reward penalty applied)

## Test Case 5: Habit Proposal (Simulated)
**Input**: "Check debug.log" (Repeat 3x)
**Expected Intent**: `auto_habit_formation`
**Response**: "I notice a recurring pattern. Would you like to create a Contract to automate 'Check debug.log' upon startup?"
**Status**: ✅ PASS
```
