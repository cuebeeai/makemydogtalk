// Test the new duration calculation

const prompt = "I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that.";

const wordCount = prompt.trim().split(/\s+/).length;
const wordsPerMinute = 140;
const dialogueDuration = (wordCount / wordsPerMinute) * 60;

// NEW LOGIC: No buffer time, round dialogue duration directly
let finalDuration: number;
if (dialogueDuration <= 4) {
  finalDuration = 4;
} else if (dialogueDuration <= 6) {
  finalDuration = 6;
} else if (dialogueDuration <= 8) {
  finalDuration = 8;
} else {
  finalDuration = 8;
}

console.log("=".repeat(60));
console.log("NEW DURATION CALCULATION");
console.log("=".repeat(60));
console.log(`Prompt: "${prompt}"`);
console.log(`\nWord count: ${wordCount} words`);
console.log(`Words per minute: ${wordsPerMinute} WPM`);
console.log(`Dialogue duration: ${dialogueDuration.toFixed(2)} seconds`);
console.log(`Final duration: ${finalDuration} seconds`);

console.log(`\n${"=".repeat(60)}`);
console.log("RESULT:");
console.log("=".repeat(60));

if (dialogueDuration <= finalDuration) {
  console.log(`✅ SUCCESS: ${dialogueDuration.toFixed(2)}s of dialogue fits in ${finalDuration}s video`);
  console.log(`Extra time: ${(finalDuration - dialogueDuration).toFixed(2)}s (for natural pacing)`);
} else {
  console.log(`❌ PROBLEM: ${dialogueDuration.toFixed(2)}s of dialogue won't fit in ${finalDuration}s video`);
  console.log(`Shortfall: ${(dialogueDuration - finalDuration).toFixed(2)}s`);
}
