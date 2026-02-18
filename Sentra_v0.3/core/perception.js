/**
 * Sentra v0.3 - Perception
 * "Thalamus": Normalizes ANY input into a Signal Vector
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const VECTOR_FILE = path.join(__dirname, '../data/cold/vectors.bin');
const NUM_PROTOTYPES = 1024;
const VECTOR_DIM = 256; // bits
const HEADER_SIZE = 12;

class Perception {
    constructor() {
        this.prototypes = []; // Array of Buffers
        this.isReady = false;
        this.loadVectors();
    }

    loadVectors() {
        try {
            if (!fs.existsSync(VECTOR_FILE)) {
                console.error("Perception: vectors.bin not found!");
                return;
            }
            const buffer = fs.readFileSync(VECTOR_FILE);

            // Validate Header
            const magic = buffer.toString('utf8', 0, 4);
            if (magic !== 'SVEC') throw new Error("Invalid magic number in vectors.bin");

            const numPrototypes = buffer.readUInt32BE(4);
            const vectorDim = buffer.readUInt32BE(8);

            if (numPrototypes !== NUM_PROTOTYPES || vectorDim !== VECTOR_DIM) {
                throw new Error(`Vector dimension mismatch. File: ${numPrototypes}x${vectorDim}, Config: ${NUM_PROTOTYPES}x${VECTOR_DIM}`);
            }

            // Load Body
            let offset = HEADER_SIZE;
            const bytesPerVector = VECTOR_DIM / 8;
            for (let i = 0; i < NUM_PROTOTYPES; i++) {
                const vec = buffer.slice(offset, offset + bytesPerVector);
                this.prototypes.push(vec);
                offset += bytesPerVector;
            }

            this.isReady = true;
            console.log("Perception: Loaded " + this.prototypes.length + " prototypes.");
        } catch (e) {
            console.error("Perception: Failed to load vectors.", e);
        }
    }

    /**
     * Normalizes input text into a set of activated prototype indices.
     * Uses SimHash-style projection (Kanerva Coding for text) to ensure
     * similar inputs have similar latent vectors.
     * @param {string} input - Raw text input
     * @returns {number[]} - Array of indices of activated prototypes
     */
    normalize(input) {
        if (!this.isReady) return [];

        // Multi-modal check: Is input a Buffer (Image)?
        if (Buffer.isBuffer(input)) {
            const queryVector = this.imageToVector(input);
            const activations = this.getActivePrototypes(queryVector);
            return activations;
        }

        // Text input
        const queryVector = this.textToVector(String(input)); // Ensure string
        const activations = this.getActivePrototypes(queryVector);

        return activations;
    }

    /**
     * Stubb: Perceptual Hashing for Images
     * Hashes an image buffer into the same 256-bit latent space.
     */
    imageToVector(buffer) {
        const dim = VECTOR_DIM;
        // In a real system: Downsample -> Grayscale -> Mean Hash
        // Here: We just hash the raw bytes in chunks to simulate it.

        const accumulator = new Int32Array(dim).fill(0);

        // Chunk the buffer
        for (let i = 0; i < buffer.length; i += 16) {
            const chunk = buffer.subarray(i, i + 16);
            const chunkHash = this.hashToVector(chunk.toString('hex'));

            for (let bit = 0; bit < dim; bit++) {
                const byteIndex = Math.floor(bit / 8);
                const bitIndex = bit % 8;
                const bitVal = (chunkHash[byteIndex] >> (7 - bitIndex)) & 1;
                accumulator[bit] += (bitVal === 1 ? 1 : -1);
            }
        }

        // Threshold
        const resultBuffer = Buffer.alloc(dim / 8);
        for (let bit = 0; bit < dim; bit++) {
            if (accumulator[bit] > 0) {
                const byteIndex = Math.floor(bit / 8);
                const bitIndex = bit % 8;
                resultBuffer[byteIndex] |= (1 << (7 - bitIndex));
            }
        }

        return resultBuffer;
    }

    /**
     * Converts text to a 256-bit vector using SimHash/bipolar superposition.
     * 1. Tokenize into trigrams.
     * 2. Hash each trigram to a 256-bit signature.
     * 3. Superimpose (add) vectors.
     * 4. Threshold to binary.
     */
    textToVector(text) {
        const dim = VECTOR_DIM;
        const accumulator = new Int32Array(dim).fill(0);

        // simple trigram generation
        const cleanText = " " + text.replace(/\s+/g, ' ') + " ";

        if (cleanText.length < 3) return this.hashToVector(text); // Fallback for very short text

        for (let i = 0; i < cleanText.length - 2; i++) {
            const trigram = cleanText.substring(i, i + 3);
            const trigramHash = this.hashToVector(trigram); // 32 byte buffer

            // Add bipolar values (-1 for 0, +1 for 1) in the hash to accumulator
            for (let bit = 0; bit < dim; bit++) {
                const byteIndex = Math.floor(bit / 8);
                const bitIndex = bit % 8;
                const bitVal = (trigramHash[byteIndex] >> (7 - bitIndex)) & 1;

                accumulator[bit] += (bitVal === 1 ? 1 : -1);
            }
        }

        // Threshold back to binary Buffer
        const resultBuffer = Buffer.alloc(dim / 8);
        for (let bit = 0; bit < dim; bit++) {
            if (accumulator[bit] > 0) { // Majority rule
                const byteIndex = Math.floor(bit / 8);
                const bitIndex = bit % 8;
                resultBuffer[byteIndex] |= (1 << (7 - bitIndex));
            }
        }

        return resultBuffer;
    }


    /**
     * Hashes input string to a 256-bit vector.
     * Use SHA-256 and take first 32 bytes.
     */
    hashToVector(input) {
        const hash = crypto.createHash('sha256');
        hash.update(input);
        return hash.digest(); // Returns Buffer of 32 bytes (256 bits)
    }

    /**
     * Calculates Hamming distance between two buffers.
     */
    hammingDistance(buf1, buf2) {
        let distance = 0;
        for (let i = 0; i < buf1.length; i++) {
            let xor = buf1[i] ^ buf2[i]; // XOR bits
            // Count set bits in xor result
            while (xor > 0) {
                distance += xor & 1;
                xor >>= 1;
            }
        }
        return distance;
    }

    /**
     * Finds prototypes closest to the query vector.
     * Returns the indices of the top K closest prototypes.
     */
    getActivePrototypes(queryVector, k = 5) {
        const distances = [];

        for (let i = 0; i < this.prototypes.length; i++) {
            const dist = this.hammingDistance(queryVector, this.prototypes[i]);
            distances.push({ index: i, distance: dist });
        }

        // Sort by distance (ascending)
        distances.sort((a, b) => a.distance - b.distance);

        // Return top K indices
        return distances.slice(0, k).map(d => d.index);
    }
}

module.exports = Perception;
