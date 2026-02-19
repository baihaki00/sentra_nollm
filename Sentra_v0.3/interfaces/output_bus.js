/**
 * Sentra v0.3 - Output Bus
 * Generic transmitter (Text, Motor)
 */

class OutputBus {
    constructor() {
        this.primitives = {
            "log_output": this.logOutput.bind(this),
            "wait": this.wait.bind(this)
        };
    }

    transmit(signal) {
        // intended for raw signal transmission, not used yet
        console.log("[OutputBus] Transmitting:", signal);
    }

    async execute(primitiveName, params) {
        if (this.primitives[primitiveName]) {
            await this.primitives[primitiveName](params);
            return true;
        } else {
            console.error(`[OutputBus] Unknown primitive: ${primitiveName}`);
            return false;
        }
    }

    // --- Primitives ---

    async logOutput(params) {
        // Phase 28: Capture output in the global trace for SBI/Diagnostics
        if (typeof global.trace === 'function') {
            global.trace('OUTPUT', params.message, '\x1b[32m');
        } else {
            console.log(`\x1b[32m[Sentra]: ${params.message}\x1b[0m`);
        }
    }

    async wait(params) {
        return new Promise(resolve => setTimeout(resolve, params.ms || 1000));
    }
}

module.exports = OutputBus;
