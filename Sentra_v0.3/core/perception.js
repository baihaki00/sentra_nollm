/**
 * Sentra v0.3 - Perception
 * "Thalamus": Normalizes ANY input into a Signal Vector
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const VECTOR_FILE = path.join(__dirname, '../data/cold/vectors.bin');
const PROTOTYPE_FILE = path.join(__dirname, '../data/cold/functional_prototypes.json');
const NUM_PROTOTYPES = 1024;
const VECTOR_DIM = 256; // bits
const HEADER_SIZE = 12;

class Perception {
    constructor() {
        this.prototypes = []; // Array of Buffers
        this.functionalPrototypes = null; // Map of category -> Array of Buffers
        this.isReady = false;
        this.loadVectors();
        this.loadFunctionalPrototypes();
    }

    loadFunctionalPrototypes() {
        try {
            if (fs.existsSync(PROTOTYPE_FILE)) {
                const raw = JSON.parse(fs.readFileSync(PROTOTYPE_FILE, 'utf8'));
                this.functionalPrototypes = {};
                for (const label in raw) {
                    this.functionalPrototypes[label] = raw[label].map(hex => Buffer.from(hex, 'hex'));
                }
                console.log(`Perception: Loaded functional prototypes for ${Object.keys(this.functionalPrototypes).length} categories.`);
            }
        } catch (e) {
            console.error("Perception: Failed to load functional prototypes.", e);
        }
    }

    loadVectors() {
        try {
            if (!fs.existsSync(VECTOR_FILE)) {
                console.error("Perception: vectors.bin not found!");
                return;
            }
            const buffer = fs.readFileSync(VECTOR_FILE);
            this.prototypes = []; // Reset to avoid duplication on re-load

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
     * Layer 1: Utterance Type Handling (Functional Language Coverage)
     * Classifies surface forms and symbolic input into cognitive categories.
     * @param {string} input - Raw text input
     * @returns {string} - The detected Layer 1 category
     */
    /**
     * Layer 1: Utterance Type Handling (Functional Language Coverage)
     * Maps input to functional categories using distance-based prototype matching.
     * This follows the Tabula Rasa principle: intelligence is in the data.
     * @param {string} input - Raw text input
     * @returns {string} - Functional category (e.g., 'declarative', 'interrogative')
     */
    classify(input) {
        if (!input || typeof input !== 'string') return 'unknown';
        if (!this.functionalPrototypes) return 'declarative'; // Default if not loaded

        const queryVector = this.textToVector(input);
        let bestCategory = 'declarative';
        let minDistance = Infinity;

        for (const [category, exemplars] of Object.entries(this.functionalPrototypes)) {
            for (const exemplar of exemplars) {
                const dist = this.hammingDistance(queryVector, exemplar);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestCategory = category;
                }
            }
        }

        // Thresholding: If everything is too far, it's just a declarative statement
        const ERROR_THRESHOLD = 100; // 256 bits total, < 40% error
        if (minDistance > ERROR_THRESHOLD) {
            return 'declarative';
        }

        return bestCategory;
    }

    /**
     * Layer 2: Structural Complexity (Syntactic Stability)
     * Handles grammatical depth and hierarchical sentence structures.
     * @param {string} input - Raw text input
     * @returns {string} - 'simple', 'compound', or 'complex'/ 'nested'
     */
    detectComplexity(input) {
        if (!input || typeof input !== 'string') return 'simple';
        const text = input.trim();
        const clauses = text.split(/[,;.]+/).filter(c => c.trim().length > 0);

        const conjunctions = /\b(and|or|but|so|yet|for|nor)\b/gi;
        const subordination = /\b(if|unless|since|because|while|although|though|even if)\b/gi;

        const hasSubordination = subordination.test(text);
        const hasConjunctions = conjunctions.test(text);

        if (clauses.length > 2 || (hasSubordination && (text.includes(' and ') || text.includes(' or ')))) {
            return 'nested';
        }
        if (hasSubordination) {
            return 'complex';
        }
        if (hasConjunctions || clauses.length > 1) {
            return 'compound';
        }

        return 'simple';
    }

    /**
     * Normalizes input text into a set of activated prototype indices.
     * Roadmap Phase 4: Now async to allow for semantic graph lookups.
     * @param {string} input - Raw text input
     * @param {object} semantic - Optional SemanticMemory instance for enrichment
     * @param {string[]} priming - Roadmap Phase 4: Optional list of concepts to prime
     * @returns {Promise<number[]>} - Array of indices of activated prototypes
     */
    async normalize(input, semantic = null, priming = []) {
        if (!this.isReady) return [];

        let queryVector;

        // Multi-modal check: Buffer (Image)
        if (Buffer.isBuffer(input)) {
            queryVector = this.imageToVector(input);
        }
        // Multi-modal check: Object (Machine State)
        else if (typeof input === 'object' && input !== null) {
            queryVector = this.stateToVector(input);
        }
        // Text input
        else {
            const baseVector = this.textToVector(String(input));
            // Roadmap Phase 4: Auto-enrich with semantic context and priming if provided
            queryVector = semantic ? await this.enrichWithSemanticContext(input, baseVector, semantic, priming) : baseVector;
        }

        const activations = this.getActivePrototypes(queryVector);
        return activations;
    }

    /**
     * Roadmap Phase 4: Incorporate semantic relationships into the latent vector
     */
    async enrichWithSemanticContext(input, baseVector, semantic, priming = []) {
        if (!semantic) return baseVector;

        // Roadmap Phase 4: Use bipolar superposition to blend semantic context
        const dim = VECTOR_DIM;
        const accumulator = new Int32Array(dim).fill(0);

        // 1. Initialize accumulator from baseVector
        for (let bit = 0; bit < dim; bit++) {
            const byteIndex = Math.floor(bit / 8);
            const bitIndex = bit % 8;
            const bitVal = (baseVector[byteIndex] >> (7 - bitIndex)) & 1;
            accumulator[bit] += (bitVal === 1 ? 5 : -5); // Strong weight for input
        }

        const words = String(input).split(/\s+/).map(w => w.replace(/[.,!?;:]+/g, ''));

        // 2. Blend current input concepts
        for (const word of words) {
            if (word.length < 3) continue;
            const node = await semantic.getNodeByLabel(word);
            if (node) {
                await this.applyPrimingFromNode(node, semantic, accumulator);
            }
        }

        // 3. Blend persistent priming from previous turns (Roadmap Phase 4 Context)
        if (Array.isArray(priming)) {
            for (const concept of priming) {
                const node = await semantic.getNodeByLabel(concept);
                if (node) {
                    await this.applyPrimingFromNode(node, semantic, accumulator, 0.5); // Lower weight for historical context
                }
            }
        }

        // Threshold back to binary Buffer
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
     * Helper to apply priming from a node and its neighbors
     */
    async applyPrimingFromNode(node, semantic, accumulator, weight = 1.0) {
        const rels = await semantic.getRelationships(node.node_id);
        for (const rel of rels) {
            const relatedText = rel.label;
            const cleanText = " " + relatedText.replace(/\s+/g, ' ') + " ";
            for (let i = 0; i < cleanText.length - 2; i++) {
                const trigram = cleanText.substring(i, i + 3);
                const trigramHash = this.hashToVector(trigram);
                for (let bit = 0; bit < VECTOR_DIM; bit++) {
                    const byteIndex = Math.floor(bit / 8);
                    const bitIndex = bit % 8;
                    const bitVal = (trigramHash[byteIndex] >> (7 - bitIndex)) & 1;
                    accumulator[bit] += (bitVal === 1 ? weight : -weight);
                }
            }
            console.log(`\x1b[34m[Perception]\x1b[0m Semantic Priming: ${node.label} -> ${rel.label} (w=${weight})`);
        }
    }

    /**
     * Converts machine state to a 256-bit vector.
     * Uses a stable representation of platform, arch, and current working directory.
     */
    stateToVector(state) {
        const dim = VECTOR_DIM;
        const accumulator = new Int32Array(dim).fill(0);

        // Features to encode: platform, CWD, and coarse memory state
        const features = [
            `platform:${state.platform}`,
            `arch:${state.arch}`,
            `cwd:${state.cwd}`,
            `mem_low:${state.free_memory < state.total_memory * 0.1}`
        ];

        for (const feature of features) {
            const featureHash = this.hashToVector(feature);
            for (let bit = 0; bit < dim; bit++) {
                const byteIndex = Math.floor(bit / 8);
                const bitIndex = bit % 8;
                const bitVal = (featureHash[byteIndex] >> (7 - bitIndex)) & 1;
                accumulator[bit] += (bitVal === 1 ? 1 : -1);
            }
        }

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

    /**
     * Generate candidate latent vectors for multi-intent evaluation.
     * Simple strategy for v1: return the original text vector plus
     * individual prototype vectors from top activations so the
     * world model can simulate alternate focusing choices.
     * @param {string} input
     * @param {number} numCandidates
     * @returns {Buffer[]} array of candidate Buffers
     */
    generateCandidateVectors(input, numCandidates = 5) {
        if (!this.isReady) return [];
        const text = String(input);
        const baseVector = this.textToVector(text);

        // Helper: small text variations to produce semantic variants
        const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'of', 'and', 'or', 'to', 'for', 'with']);
        const removeStopwords = (s) => s.split(/\s+/).filter(w => !stopwords.has(w.toLowerCase())).join(' ');
        const firstN = (s, n) => s.split(/\s+/).slice(0, n).join(' ');
        const lastN = (s, n) => s.split(/\s+/).slice(-n).join(' ');

        const variantsText = [];
        variantsText.push(text);
        const withoutStops = removeStopwords(text);
        if (withoutStops && withoutStops !== text) variantsText.push(withoutStops);
        const f2 = firstN(text, 2); if (f2 && f2 !== text) variantsText.push(f2);
        const l2 = lastN(text, 2); if (l2 && l2 !== text) variantsText.push(l2);
        // trim punctuation variant
        const trimmed = text.replace(/[.,!?;:]+/g, ''); if (trimmed !== text) variantsText.push(trimmed);

        const candidates = [];

        // Base candidate: original
        candidates.push(baseVector);

        // Add vectors from textual variants first (preserve ordering)
        for (const vt of variantsText) {
            try {
                const v = this.textToVector(vt);
                // avoid duplicates (simple buffer compare)
                if (!candidates.find(c => c.equals(v))) candidates.push(v);
            } catch (e) {
                // ignore
            }
            if (candidates.length >= numCandidates) return candidates.slice(0, numCandidates);
        }

        // Prototype-focused blends: OR blend with top prototypes to bias focus
        const top = this.getActivePrototypes(baseVector, 8);
        for (let i = 0; i < top.length && candidates.length < numCandidates; i++) {
            const proto = this.prototypes[top[i]];
            if (!proto) continue;
            // OR-blend: set bits that either proto or base have
            const blended = Buffer.alloc(baseVector.length);
            for (let b = 0; b < baseVector.length; b++) blended[b] = baseVector[b] | proto[b];
            if (!candidates.find(c => c.equals(blended))) candidates.push(blended);
        }

        // Combined-prototype variants (OR of two prototypes)
        for (let i = 0; i < top.length && candidates.length < numCandidates; i++) {
            for (let j = i + 1; j < top.length && candidates.length < numCandidates; j++) {
                const p1 = this.prototypes[top[i]]; const p2 = this.prototypes[top[j]];
                if (!p1 || !p2) continue;
                const combo = Buffer.alloc(baseVector.length);
                for (let b = 0; b < baseVector.length; b++) combo[b] = p1[b] | p2[b];
                if (!candidates.find(c => c.equals(combo))) candidates.push(combo);
            }
        }

        // Small perturbations of base (flip a few random bits)
        const randFlip = (buf, flips = 5) => {
            const out = Buffer.from(buf);
            for (let k = 0; k < flips; k++) {
                const byteIdx = Math.floor(Math.random() * out.length);
                const bit = 1 << Math.floor(Math.random() * 8);
                out[byteIdx] ^= bit;
            }
            return out;
        };
        let tries = 0;
        while (candidates.length < numCandidates && tries < 8) {
            const p = randFlip(baseVector, 4 + Math.floor(Math.random() * 5));
            if (!candidates.find(c => c.equals(p))) candidates.push(p);
            tries++;
        }

        return candidates.slice(0, numCandidates);
    }
}

module.exports = Perception;
