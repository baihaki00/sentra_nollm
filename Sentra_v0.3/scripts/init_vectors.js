/**
 * init_vectors.js
 * Initializes data/cold/vectors.bin with random prototype vectors.
 * 
 * Format:
 * - Header (12 bytes):
 *   - Magic Number (4 bytes): 'S', 'V', 'E', 'C' (0x53564543)
 *   - Num Prototypes (4 bytes): 1024 (Big Endian)
 *   - Vector Dimension (4 bytes): 256 (Big Endian)
 * - Body:
 *   - 1024 * (256 / 8) bytes = 32768 bytes of random data
 */

const fs = require('fs');
const path = require('path');

const NUM_PROTOTYPES = 1024;
const VECTOR_DIM = 256; // bits
const VECTOR_BYTES = VECTOR_DIM / 8;
const HEADER_SIZE = 12;
const FILE_PATH = path.join(__dirname, '../data/cold/vectors.bin');

function initVectors() {
    const bufferSize = HEADER_SIZE + (NUM_PROTOTYPES * VECTOR_BYTES);
    const buffer = Buffer.alloc(bufferSize);

    // Write Header
    buffer.write('SVEC', 0); // Magic
    buffer.writeUInt32BE(NUM_PROTOTYPES, 4);
    buffer.writeUInt32BE(VECTOR_DIM, 8);

    // Write Random Data
    for (let i = HEADER_SIZE; i < bufferSize; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
    }

    fs.writeFileSync(FILE_PATH, buffer);
    console.log(`Initialized vectors.bin at ${FILE_PATH}`);
    console.log(`Prototypes: ${NUM_PROTOTYPES}, Dimension: ${VECTOR_DIM} bits`);
    console.log(`Total Size: ${bufferSize} bytes`);
}

initVectors();
