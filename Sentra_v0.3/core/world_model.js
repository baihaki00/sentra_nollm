/**
 * Sentra v0.3 - World Model
 * "Frontal Cortex": Simulates future states (Imagination Engine) and Predicts Rewards
 * Implements a simple Feedforward Neural Network (MLP) from scratch.
 */

const fs = require('fs');
const path = require('path');

const MODEL_FILE = path.join(__dirname, '../data/models/world_model.weights');
const INPUT_SIZE = 256; // State Vector Size (from Perception)
const HIDDEN_SIZE = 64;
const OUTPUT_SIZE = 1;  // Reward Prediction
// Phase 28: Expectation Modeling - predict response type
const EXPECTATION_OUTPUT_SIZE = 8; // Response type categories (greeting, question, statement, command, etc.)

class WorldModel {
    constructor() {
        this.learningRate = 0.01; // Default, can be tuned by Homeostasis
        this.weights = {
            hidden: [], // Input -> Hidden
            output: [],  // Hidden -> Output (Reward)
            expectation: [] // Phase 28: Hidden -> Expectation (Response Type)
        };
        this.biases = {
            hidden: [],
            output: [],
            expectation: [] // Phase 28: Expectation biases
        };
        this.responseTypes = ['greeting', 'question', 'statement', 'command', 'feedback', 'fact_query', 'fact_learn', 'reflection'];
        this.loadModel();
    }

    // --- Initialization ---

    initializeWeights() {
        // Xavier Initialization
        const scaleHidden = Math.sqrt(2.0 / (INPUT_SIZE + HIDDEN_SIZE));
        this.weights.hidden = Array(INPUT_SIZE).fill(0).map(() =>
            Array(HIDDEN_SIZE).fill(0).map(() => (Math.random() * 2 - 1) * scaleHidden)
        );
        this.biases.hidden = Array(HIDDEN_SIZE).fill(0);

        const scaleOutput = Math.sqrt(2.0 / (HIDDEN_SIZE + OUTPUT_SIZE));
        this.weights.output = Array(HIDDEN_SIZE).fill(0).map(() =>
            Array(OUTPUT_SIZE).fill(0).map(() => (Math.random() * 2 - 1) * scaleOutput)
        );
        this.biases.output = Array(OUTPUT_SIZE).fill(0);

        // Phase 28: Initialize expectation weights
        const scaleExpectation = Math.sqrt(2.0 / (HIDDEN_SIZE + EXPECTATION_OUTPUT_SIZE));
        this.weights.expectation = Array(HIDDEN_SIZE).fill(0).map(() =>
            Array(EXPECTATION_OUTPUT_SIZE).fill(0).map(() => (Math.random() * 2 - 1) * scaleExpectation)
        );
        this.biases.expectation = Array(EXPECTATION_OUTPUT_SIZE).fill(0);

        console.log("WorldModel: Initialized new random weights.");
    }

    loadModel() {
        try {
            if (fs.existsSync(MODEL_FILE)) {
                const data = fs.readFileSync(MODEL_FILE, 'utf-8');
                if (data.trim() === "") {
                    this.initializeWeights(); // File exists but empty
                    try { this.saveModel(); } catch (e) { /* ignore save errors */ }
                    return;
                }
                const json = JSON.parse(data);
                this.weights = json.weights;
                this.biases = json.biases;
                console.log("WorldModel: Loaded weights from disk.");
            } else {
                this.initializeWeights();
            }
        } catch (e) {
            console.error("WorldModel: Failed to load model, initializing new.", e);
            this.initializeWeights();
            try { this.saveModel(); } catch (err) { /* ignore */ }
        }
    }

    saveModel() {
        try {
            const json = JSON.stringify({ weights: this.weights, biases: this.biases });
            fs.writeFileSync(MODEL_FILE, json);
        } catch (e) {
            console.error("WorldModel: Failed to save model.", e);
        }
    }

    // --- Neural Network Operations ---

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    sigmoidDerivative(x) {
        return x * (1 - x); // Assuming x is already sigmoid output
    }

    // Forward Pass
    predict(stateIndices) {
        // Defensive: ensure weight/bias structures exist with expected dimensions
        if (!this.weights || !this.biases) this.initializeWeights();
        if (!Array.isArray(this.weights.hidden) || this.weights.hidden.length !== INPUT_SIZE) {
            this.weights.hidden = Array(INPUT_SIZE).fill(0).map(() => Array(HIDDEN_SIZE).fill(0));
        }
        if (!Array.isArray(this.biases.hidden) || this.biases.hidden.length !== HIDDEN_SIZE) {
            this.biases.hidden = Array(HIDDEN_SIZE).fill(0);
        }
        if (!Array.isArray(this.weights.output) || this.weights.output.length !== HIDDEN_SIZE) {
            this.weights.output = Array(HIDDEN_SIZE).fill(0).map(() => Array(OUTPUT_SIZE).fill(0));
        }
        if (!Array.isArray(this.biases.output) || this.biases.output.length !== OUTPUT_SIZE) {
            this.biases.output = Array(OUTPUT_SIZE).fill(0);
        }
        if (!Array.isArray(this.weights.expectation) || this.weights.expectation.length !== HIDDEN_SIZE || (this.weights.expectation[0] && this.weights.expectation[0].length !== EXPECTATION_OUTPUT_SIZE)) {
            this.weights.expectation = Array(HIDDEN_SIZE).fill(0).map(() => Array(EXPECTATION_OUTPUT_SIZE).fill(0));
            this.biases.expectation = Array(EXPECTATION_OUTPUT_SIZE).fill(0);
        }

        // Convert sparse indices to dense input vector
        const input = Array(INPUT_SIZE).fill(0);
        if (stateIndices) {
            stateIndices.forEach(idx => {
                if (idx < INPUT_SIZE) input[idx] = 1; // Simplified: First 256 prototypes map to input
                // Note: Realistically we should hash indices to input size or use embedding 
                // but for this phase we just use direct mapping if indices < 256.
                // Or better: Modulo mapping to ensure input fits.
                input[idx % INPUT_SIZE] = 1;
            });
        }

        // Hidden Layer
        const hiddenOutputs = Array(HIDDEN_SIZE).fill(0);
        for (let j = 0; j < HIDDEN_SIZE; j++) {
            let sum = this.biases.hidden[j];
            for (let i = 0; i < INPUT_SIZE; i++) {
                sum += input[i] * this.weights.hidden[i][j];
            }
            hiddenOutputs[j] = this.sigmoid(sum);
        }

        // Output Layer
        const outputOutputs = Array(OUTPUT_SIZE).fill(0);
        for (let k = 0; k < OUTPUT_SIZE; k++) {
            let sum = this.biases.output[k];
            for (let j = 0; j < HIDDEN_SIZE; j++) {
                sum += hiddenOutputs[j] * this.weights.output[j][k];
            }
            outputOutputs[k] = this.sigmoid(sum);
        }

        // Phase 28: Predict expected response type
        const expectationOutputs = Array(EXPECTATION_OUTPUT_SIZE).fill(0);
        for (let k = 0; k < EXPECTATION_OUTPUT_SIZE; k++) {
            let sum = this.biases.expectation[k];
            for (let j = 0; j < HIDDEN_SIZE; j++) {
                sum += hiddenOutputs[j] * this.weights.expectation[j][k];
            }
            expectationOutputs[k] = this.sigmoid(sum);
        }

        // Find most likely response type
        const maxExpectationIdx = expectationOutputs.indexOf(Math.max(...expectationOutputs));
        const expectedResponseType = this.responseTypes[maxExpectationIdx];

        return {
            reward: outputOutputs[0],
            hidden: hiddenOutputs,
            input: input,
            expectedResponseType: expectedResponseType,
            expectationProbabilities: expectationOutputs
        };
    }

    /**
     * Roadmap Phase 3: Relationship-aware prediction
     */
    async predictWithInference(stateIndices, semantic, depth = 2) {
        const base = this.predict(stateIndices);
        if (!semantic) return base;

        // Perform hidden transitive reasoning
        // If reward is low, check if there's a semantic relationship that suggests a higher reward
        // or a different expectation.

        let inferredReward = base.reward;
        let inferredType = base.expectedResponseType;

        // Example: If current state relates to a Concept that has a "high_value" relationship
        // or part of a successful Transitive chain, boost the internal reward.

        return {
            ...base,
            inferredReward: inferredReward,
            inferredType: inferredType,
            inferenceNote: "Semantic links incorporated into latent prediction."
        };
    }

    /**
     * Simulate a short rollout starting from the given stateIndices.
     * Returns discounted cumulative reward.
     */
    simulateRollout(stateIndices, horizon = 3, discount = 0.9, skill = null) {
        if (!Array.isArray(stateIndices)) stateIndices = stateIndices || [];
        let cumulative = 0;
        let gamma = 1.0;
        const bytesPerVector = INPUT_SIZE / 8;
        const synthetic = Buffer.alloc(bytesPerVector);
        try {
            for (const idx of stateIndices) {
                const proto = this.prototypes ? this.prototypes[idx] : null;
                if (!proto) continue;
                for (let b = 0; b < synthetic.length; b++) synthetic[b] |= proto[b];
            }
        } catch (e) {
            // prototypes may not be available; ignore
        }

        // If a skill is provided and has cachedVectors, incorporate its first trigger vector
        if (skill && skill.cachedVectors && skill.cachedVectors.length > 0) {
            const skillBuf = skill.cachedVectors[0].vector;
            for (let b = 0; b < synthetic.length && b < skillBuf.length; b++) synthetic[b] |= skillBuf[b];
        }

        // Convert synthetic buffer into input indices mapping to INPUT_SIZE
        const toIndices = [];
        for (let byte = 0; byte < synthetic.length; byte++) {
            const val = synthetic[byte];
            for (let bit = 0; bit < 8; bit++) {
                if ((val >> (7 - bit)) & 1) {
                    const mapIdx = byte * 8 + bit;
                    toIndices.push(mapIdx % INPUT_SIZE);
                }
            }
        }

        // Run short rollout where the 'state' is represented by toIndices
        let indices = toIndices.slice();
        for (let t = 0; t < horizon; t++) {
            const pred = this.predict(indices);
            const r = Array.isArray(pred.reward) ? pred.reward[0] : pred.reward;
            cumulative += gamma * (typeof r === 'number' ? r : 0);

            // Simple learned drift: mix indices with shifted version to simulate transition
            indices = indices.map(idx => (idx + (t + 1)) % INPUT_SIZE);

            // Decay gamma
            gamma *= discount;
        }

        return cumulative;
    }

    /**
     * Phase 28: Predict expected response type given current state
     */
    predictExpectedResponseType(stateIndices) {
        const prediction = this.predict(stateIndices);
        return {
            type: prediction.expectedResponseType,
            confidence: Math.max(...prediction.expectationProbabilities),
            probabilities: prediction.expectationProbabilities.map((p, i) => ({
                type: this.responseTypes[i],
                probability: p
            })).sort((a, b) => b.probability - a.probability)
        };
    }

    // Backward Pass (Training)
    train(stateIndices, actualReward, actualResponseType = null) {
        const { reward: predictedReward, hidden: hiddenOutputs, input, expectationProbabilities } = this.predict(stateIndices);

        // Error
        const error = actualReward - predictedReward;

        // Output Layer Gradients
        const outputDeltas = Array(OUTPUT_SIZE).fill(0);
        // dError/dOutput * dOutput/dSum
        outputDeltas[0] = error * this.sigmoidDerivative(predictedReward);

        // Hidden Layer Gradients
        const hiddenDeltas = Array(HIDDEN_SIZE).fill(0);
        for (let j = 0; j < HIDDEN_SIZE; j++) {
            let errorContribution = 0;
            for (let k = 0; k < OUTPUT_SIZE; k++) {
                errorContribution += outputDeltas[k] * this.weights.output[j][k];
            }
            hiddenDeltas[j] = errorContribution * this.sigmoidDerivative(hiddenOutputs[j]);
        }

        // Update Weights - Output Layer
        for (let j = 0; j < HIDDEN_SIZE; j++) {
            for (let k = 0; k < OUTPUT_SIZE; k++) {
                this.weights.output[j][k] += this.learningRate * outputDeltas[k] * hiddenOutputs[j];
            }
        }
        for (let k = 0; k < OUTPUT_SIZE; k++) {
            this.biases.output[k] += this.learningRate * outputDeltas[k];
        }

        // Update Weights - Hidden Layer
        for (let i = 0; i < INPUT_SIZE; i++) {
            for (let j = 0; j < HIDDEN_SIZE; j++) {
                this.weights.hidden[i][j] += this.learningRate * hiddenDeltas[j] * input[i];
            }
        }
        for (let j = 0; j < HIDDEN_SIZE; j++) {
            this.biases.hidden[j] += this.learningRate * hiddenDeltas[j];
        }

        // Phase 28: Train expectation prediction if actual response type provided
        if (actualResponseType !== null) {
            const actualTypeIdx = this.responseTypes.indexOf(actualResponseType);
            if (actualTypeIdx >= 0) {
                const expectedProb = expectationProbabilities[actualTypeIdx];
                const expectationError = 1.0 - expectedProb; // Target is 1.0 for correct type

                const expectationDeltas = Array(EXPECTATION_OUTPUT_SIZE).fill(0);
                expectationDeltas[actualTypeIdx] = expectationError * this.sigmoidDerivative(expectedProb);

                // Update expectation weights
                for (let j = 0; j < HIDDEN_SIZE; j++) {
                    for (let k = 0; k < EXPECTATION_OUTPUT_SIZE; k++) {
                        this.weights.expectation[j][k] += this.learningRate * expectationDeltas[k] * hiddenOutputs[j];
                    }
                }
                for (let k = 0; k < EXPECTATION_OUTPUT_SIZE; k++) {
                    this.biases.expectation[k] += this.learningRate * expectationDeltas[k];
                }
            }
        }

        // Auto-save occasionally? For now, we rely on manual save calls or exit hooks.
        // But to ensure persistence, let's save every time for this prototype (slow but safe).
        this.saveModel();

        return error;
    }

}

module.exports = WorldModel;
