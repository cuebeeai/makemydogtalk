/**
 * Test script for new Prompt v2.0 system
 * Demonstrates how the structured prompt template works
 * Run with: npx tsx scripts/test-new-prompt-v2.ts
 */

// Mock the prompt building functions to test without actual API calls
const PROMPT_VERSION = "2.0";
const FIXED_DURATION_SECONDS = 8;

function sanitizeAction(rawAction: string): string {
  if (!rawAction || rawAction.trim().length === 0) {
    return "Small natural movements: gentle head tilts, ear twitches, blinking, subtle body shifts.";
  }

  const action = rawAction.toLowerCase().trim();

  const actionMappings: Record<string, string> = {
    'jump': 'Small excited movements: gentle body wiggles and ear twitches, staying in roughly the same position.',
    'jumping': 'Small excited movements: gentle body wiggles and ear twitches, staying in roughly the same position.',
    'run': 'Subtle forward lean and slight paw movements as if ready to move, but staying in place.',
    'running': 'Subtle forward lean and slight paw movements as if ready to move, but staying in place.',
    'walk': 'Very subtle bouncing as if walking in place, with tiny head movements. No camera movement or scene changes.',
    'walking': 'Very subtle bouncing as if walking in place, with tiny head movements. No camera movement or scene changes.',
    'dance': 'Gentle rhythmic body sways and small head bobs, staying in the same spot.',
    'dancing': 'Gentle rhythmic body sways and small head bobs, staying in the same spot.',
    'model': 'Holds pose confidently with tiny head tilts and subtle body shifts like on a fashion runway. No camera movement.',
    'runway': 'Holds pose confidently with tiny head tilts and subtle body shifts like on a fashion runway. No camera movement.',
    'excited': 'Small excited movements: gentle body wiggles, perked ears, bright eyes, subtle tail motion.',
    'happy': 'Soft, joyful micro-movements: gentle tail wag motion, relaxed posture, slight head tilts.',
    'crazy': 'Energetic but controlled: quick small movements, rapid ear twitches, excited eye motion, no position change.',
  };

  for (const [key, replacement] of Object.entries(actionMappings)) {
    if (action === key || action.includes(key)) {
      return replacement;
    }
  }

  return `${rawAction}. Interpret this as subtle, small movements only—no camera movement, no scene changes, no position changes. The dog stays in the same spot with micro-movements only.`;
}

function buildVoiceDescription(tone?: string, voiceStyle?: string): string {
  const parts: string[] = [];

  const toneDescriptions: Record<string, string> = {
    excited: 'energetic, fast-paced, enthusiastic voice',
    funny: 'comedic, playful voice with good timing',
    professional: 'clear, articulate, professional voice',
    friendly: 'warm, casual, approachable voice',
    calm: 'soothing, measured, relaxed voice',
    sad: 'soft, emotional, slower-paced voice',
  };

  if (tone && toneDescriptions[tone]) {
    parts.push(toneDescriptions[tone]);
  }

  if (voiceStyle && voiceStyle.trim().length > 0) {
    parts.push(voiceStyle.trim());
  }

  if (parts.length === 0) {
    return 'natural, clear voice';
  }

  return parts.join(', ');
}

function buildPrompt(
  dialogue: string,
  tone?: string,
  voiceStyle?: string,
  action?: string,
  aspectRatio: "16:9" | "9:16" | "1:1" = "9:16"
): string {
  const isMultiDog = /Dog\s+\d+:/i.test(dialogue);
  const safeAction = sanitizeAction(action || '');
  const voiceDescription = buildVoiceDescription(tone, voiceStyle);

  const orientationDesc = aspectRatio === '9:16'
    ? 'Vertical 9:16 orientation (for TikTok/Reels/Shorts).'
    : aspectRatio === '1:1'
    ? 'Square 1:1 orientation.'
    : 'Horizontal 16:9 orientation.';

  const systemPrompt = `You are generating a short, ${FIXED_DURATION_SECONDS}-second, photorealistic talking-dog video for an app called MakeMyDogTalk.com.
Start from the provided dog photo and treat it as the exact first frame of the video.

Hard requirements (do NOT violate these):
- Keep the dog's appearance IDENTICAL to the photo: same breed, face, fur color, clothing, accessories, body shape, and size.
- Keep the background, lighting, camera angle, and composition EXACTLY the same as the photo.
- Do NOT change the dog's species, add extra limbs, or stylize the dog in any way.
- Do NOT move the camera. No cuts, no zooming, no scene changes.
- Only add small, natural movements: mouth moving to talk, subtle head motion, ear twitches, blinking, maybe slight body shift.
- The video should feel like the still image just came to life.

Lip-sync requirements:
- Animate the dog's mouth to match the syllables of the dialogue text provided.
- The dog should appear to be speaking clearly, with natural mouth movements.
- Time the mouth motion so the speech line fits within ${FIXED_DURATION_SECONDS} seconds.

Style requirements:
- Keep the overall look clean, sharp, and realistic, like a high-quality smartphone video.
- No extra text, logos, or filters over the video.

Now generate a single, continuous shot video that follows these rules.`;

  const requestDetails = `

Voice style: ${voiceDescription}

Requested action (interpret softly, no big scene changes): ${safeAction}

${isMultiDog ? 'Dialogue (multiple dogs speaking in sequence):' : 'Dialogue (what the dog says):'}
"${dialogue}"

Duration: ${FIXED_DURATION_SECONDS} seconds.
${orientationDesc}`;

  return systemPrompt + requestDetails;
}

// Test cases
console.log('═══════════════════════════════════════════════════════════════════');
console.log('🧪 TESTING NEW PROMPT v2.0 SYSTEM');
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('TEST 1: Simple dialogue with sassy tone + runway action');
console.log('─────────────────────────────────────────────────────────────────\n');
const test1 = buildPrompt(
  "I know, I look amazing. Please form a single-file line if you'd like to admire me.",
  "excited",
  "Sassy rich-auntie female voice, very full of herself",
  "walking down the stairs like a runway model",
  "9:16"
);
console.log(test1);
console.log('\n\n');

console.log('TEST 2: Aggressive action (jumping) - should be sanitized');
console.log('─────────────────────────────────────────────────────────────────\n');
const test2 = buildPrompt(
  "Woof woof! I love treats!",
  "excited",
  undefined,
  "jumping around like crazy",
  "9:16"
);
console.log(test2);
console.log('\n\n');

console.log('TEST 3: Multi-dog dialogue');
console.log('─────────────────────────────────────────────────────────────────\n');
const test3 = buildPrompt(
  "Dog 1: Hey buddy, what's up? Dog 2: Not much, just chilling!",
  "friendly",
  undefined,
  undefined,
  "16:9"
);
console.log(test3);
console.log('\n\n');

console.log('TEST 4: Professional tone with no action (defaults to natural movements)');
console.log('─────────────────────────────────────────────────────────────────\n');
const test4 = buildPrompt(
  "Welcome to our quarterly earnings call.",
  "professional",
  "Deep, authoritative voice",
  undefined,
  "16:9"
);
console.log(test4);
console.log('\n\n');

console.log('═══════════════════════════════════════════════════════════════════');
console.log('✅ All tests completed! Check output above.');
console.log('═══════════════════════════════════════════════════════════════════');
