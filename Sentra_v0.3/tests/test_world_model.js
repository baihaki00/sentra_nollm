const WorldModel = require('../core/world_model');
const assert = require('assert');

const wm = new WorldModel();

console.log("Test 1: Initialization");
// Check dimensions implicitly by running predict
const result = wm.predict([1, 2, 3]);
console.log("Prediction (Initial):", result.reward);
assert(result.reward >= 0 && result.reward <= 1, "Sigmoid output should be between 0 and 1");

console.log("Test 2: Training Loop (Overfitting one sample)");
// We want to train it to predict 1.0 for input [1, 2, 3]
const target = 0.9;
let error = 1.0;
for (let i = 0; i < 500; i++) {
    error = Math.abs(wm.train([1, 2, 3], target));
    if (i % 100 === 0) console.log(`Epoch ${i}: Error = ${error}`);
}

const finalResult = wm.predict([1, 2, 3]).reward;
console.log("Prediction (After Training):", finalResult);
console.log("Target:", target);

assert(Math.abs(finalResult - target) < 0.1, "Model should converge on the target value");

console.log("World Model Tests Passed!");
