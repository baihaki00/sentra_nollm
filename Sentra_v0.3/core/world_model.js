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

class WorldModel {
    constructor() {
        this.learningRate = 0.01; // Default, can be tuned by Homeostasis
        this.weights = {
            hidden: [], // Input -> Hidden
            output: []  // Hidden -> Output
        };
        this.biases = {
            hidden: [],
            output: []
        };
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

        console.log("WorldModel: Initialized new random weights.");
    }

    loadModel() {
        try {
            if (fs.existsSync(MODEL_FILE)) {
                const data = fs.readFileSync(MODEL_FILE, 'utf-8');
                if (data.trim() === "") {
                    this.initializeWeights(); // File exists but empty
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

        return { reward: outputOutputs[0], hidden: hiddenOutputs, input: input };
    }

    // Backward Pass (Training)
    train(stateIndices, actualReward) {
        const { reward: predictedReward, hidden: hiddenOutputs, input } = this.predict(stateIndices);

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

        // Auto-save occasionally? For now, we rely on manual save calls or exit hooks.
        // But to ensure persistence, let's save every time for this prototype (slow but safe).
        this.saveModel();

        return error;
    }
}

module.exports = WorldModel;
