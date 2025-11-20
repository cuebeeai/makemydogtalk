// Analyze the duration calculation for the problematic prompt

const prompt = "I don't need much… just your hand, your lap, and like… maybe fifty kisses. I'm simple like that.";

// Count words
const wordCount = prompt.trim().split(/\s+/).length;

// Default pace (friendly tone)
const wordsPerMinute = 140;

// Calculate dialogue duration
const dialogueDuration = (wordCount / wordsPerMinute) * 60;

// Buffer time (no action)
const bufferTime = 1.0;

const totalDuration = dialogueDuration + bufferTime;

// Round to valid duration
let finalDuration: number;
if (totalDuration <= 5) {
  finalDuration = 4;
} else if (totalDuration <= 7) {
  finalDuration = 6;
} else {
  finalDuration = 8;
}

console.log("=".repeat(60));
console.log("DURATION ANALYSIS");
console.log("=".repeat(60));
console.log(`Prompt: "${prompt}"`);
console.log(`\nWord count: ${wordCount} words`);
console.log(`Words per minute: ${wordsPerMinute} WPM`);
console.log(`Dialogue duration: ${dialogueDuration.toFixed(2)} seconds`);
console.log(`Buffer time: ${bufferTime} seconds`);
console.log(`Total calculated: ${totalDuration.toFixed(2)} seconds`);
console.log(`Final duration sent to API: ${finalDuration} seconds`);

console.log(`\n${"=".repeat(60)}`);
console.log("ANALYSIS:");
console.log("=".repeat(60));

// Calculate actual speaking time needed at different paces
const paces = [
  { name: "Fast (170 WPM)", wpm: 170 },
  { name: "Normal (140 WPM)", wpm: 140 },
  { name: "Slow (120 WPM)", wpm: 120 },
];

console.log("\nTime needed to speak full dialogue at different paces:");
paces.forEach(pace => {
  const time = (wordCount / pace.wpm) * 60;
  console.log(`${pace.name}: ${time.toFixed(2)} seconds`);
});

console.log(`\n⚠️  PROBLEM IDENTIFIED:`);
if (finalDuration < dialogueDuration) {
  console.log(`The video duration (${finalDuration}s) is SHORTER than the dialogue duration (${dialogueDuration.toFixed(2)}s)!`);
  console.log(`This means the audio will be cut off before finishing.`);
} else {
  const timeForSpeech = finalDuration - bufferTime;
  console.log(`Available time for speech: ${timeForSpeech}s (${finalDuration}s - ${bufferTime}s buffer)`);
  console.log(`Needed time for speech: ${dialogueDuration.toFixed(2)}s`);

  if (timeForSpeech < dialogueDuration) {
    console.log(`❌ NOT ENOUGH TIME - Speech will be cut off!`);
  } else {
    console.log(`✅ Enough time - Speech should complete`);
  }
}
