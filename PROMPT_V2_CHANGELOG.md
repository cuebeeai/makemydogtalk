# Prompt System v2.0 - Changelog & Implementation Guide

**Date:** 2025-11-24
**Version:** 2.0
**Goal:** Improve video quality by implementing structured, consistent prompt engineering for Veo 3.1

---

## 🎯 What Changed

### **Problem Identified**
The previous prompt system was **over-instructing** Veo 3.1 with redundant directives like:
- "dog speaking, saying the complete dialogue: [text], speaking every single word clearly with mouth movements perfectly synchronized to audio"
- Variable duration calculation based on word count
- Potentially invalid parameters (`enableSubtitles`, `addSubtitles`)

This caused:
- ❌ Inconsistent video quality
- ❌ Scene morphing and identity drift
- ❌ Poor lip-sync quality
- ❌ Unpredictable results

### **Solution: Structured System Prompt**
Implemented a **fixed, versioned backend prompt template** that:
- ✅ Uses clear, consistent hard requirements every time
- ✅ Locks down appearance, background, camera, and movement
- ✅ Sanitizes user actions to prevent morphing
- ✅ Uses fixed 8-second duration for consistency
- ✅ Removes invalid/unrecognized parameters

---

## 📋 Key Changes

### 1. **Fixed System Prompt Template**
```
You are generating a short, 8-second, photorealistic talking-dog video for MakeMyDogTalk.com.
Start from the provided dog photo and treat it as the exact first frame.

Hard requirements (do NOT violate these):
- Keep the dog's appearance IDENTICAL to the photo
- Keep background, lighting, camera angle EXACTLY the same
- Do NOT change species, add extra limbs, or stylize
- Do NOT move the camera. No cuts, no zooming, no scene changes
- Only small, natural movements: mouth, head, ears, blinking, slight body shift
- Video should feel like the still image just came to life

Lip-sync requirements:
- Animate mouth to match syllables of dialogue
- Clear, natural mouth movements
- Time motion to fit within 8 seconds

Style requirements:
- Clean, sharp, realistic (like smartphone video)
- No extra text, logos, or filters
```

### 2. **Action Sanitization** ([server/veo.ts:70-114](server/veo.ts#L70-L114))
Aggressive actions are now automatically clamped to subtle micro-movements:

| User Input | Sanitized Output |
|------------|------------------|
| "jumping around like crazy" | "Small excited movements: gentle body wiggles and ear twitches, staying in roughly the same position." |
| "running across the yard" | "Subtle forward lean and slight paw movements as if ready to move, but staying in place." |
| "walking down stairs like runway" | "Very subtle bouncing as if walking in place, with tiny head movements. No camera movement or scene changes." |

### 3. **Voice Style Mapping** ([server/veo.ts:119-147](server/veo.ts#L119-L147))
Tone parameter now maps to specific voice characteristics:

| Tone | Voice Description |
|------|-------------------|
| `excited` | "energetic, fast-paced, enthusiastic voice" |
| `funny` | "comedic, playful voice with good timing" |
| `professional` | "clear, articulate, professional voice" |
| `friendly` | "warm, casual, approachable voice" |
| `calm` | "soothing, measured, relaxed voice" |
| `sad` | "soft, emotional, slower-paced voice" |

### 4. **Fixed Duration** ([server/veo.ts:64](server/veo.ts#L64))
```typescript
const FIXED_DURATION_SECONDS = 8; // Locked for consistency
```
No more variable duration calculation - all videos are 8 seconds for predictable results.

### 5. **Cleaned API Parameters** ([server/veo.ts:268-273](server/veo.ts#L268-L273))
Removed potentially invalid parameters:
```typescript
// REMOVED:
// enableSubtitles: false,
// addSubtitles: false,

// KEPT:
parameters: {
  aspectRatio: finalAspectRatio,
  durationSeconds: duration,
  generateAudio: true,
  sampleCount: 1,
}
```

### 6. **Prompt Versioning & Logging** ([server/veo.ts:63, 221-224, 277-284](server/veo.ts))
```typescript
const PROMPT_VERSION = "2.0";

// Logs include:
console.log(`🎬 Generated prompt (v${PROMPT_VERSION}):`);
console.log('---START PROMPT---');
console.log(fullPrompt);
console.log('---END PROMPT---');

console.log(`📊 Generation Parameters (Prompt v${PROMPT_VERSION}):`);
// ... detailed parameter logging
```

---

## 🧪 Testing

Run the test script to see example outputs:
```bash
npx tsx scripts/test-new-prompt-v2.ts
```

This demonstrates:
- ✅ How actions are sanitized (e.g., "jumping" → controlled micro-movements)
- ✅ How voice styles are built from tone + custom voiceStyle
- ✅ How multi-dog dialogues are handled
- ✅ How the full system prompt is structured

---

## 📊 Expected Improvements

With Prompt v2.0, you should see:

1. **Better Identity Preservation**
   - Dog's appearance stays consistent (no morphing)
   - Background and lighting remain stable
   - No unwanted camera movement

2. **Improved Lip-Sync**
   - More accurate mouth-to-audio synchronization
   - Clearer speaking animation
   - Better timing within 8-second window

3. **Predictable Results**
   - Consistent quality across generations
   - Actions don't cause scene changes
   - Same parameters = similar results

4. **Easier Debugging**
   - Full prompt logged with version number
   - All parameters tracked
   - Can A/B test different prompt versions

---

## 🔄 Rolling Back (If Needed)

If you need to revert to the old system:

1. Change `PROMPT_VERSION` from `"2.0"` to `"1.0"`
2. Restore the old `buildEnhancedPrompt()` function from git history
3. Restore `calculateVideoDuration()` function
4. Re-add subtitle parameters if needed

Git command to view old version:
```bash
git show HEAD~1:server/veo.ts > server/veo.ts.old
```

---

## 📝 Next Steps / Future Improvements

Consider these enhancements:

1. **A/B Testing Framework**
   - Store prompt version with each video in database
   - Compare quality metrics across versions
   - Identify which prompt structures work best

2. **Dynamic Action Library**
   - Expand action sanitization mappings
   - Add breed-specific action interpretations
   - Allow admin to configure action mappings

3. **Audio-Guided Generation** (if available)
   - Generate TTS audio from script first
   - Pass audio + image to Veo
   - Set duration to match audio length
   - Should further improve lip-sync

4. **Prompt Templates per Intent**
   - Different system prompts for different use cases
   - E.g., "business" intent gets more serious constraints
   - "funny" intent allows slightly more expression

5. **User Feedback Loop**
   - Collect quality ratings on generated videos
   - Correlate ratings with prompt versions
   - Continuously refine prompt structure

---

## 🎓 Key Learnings

1. **Veo 3.1 is NOT trained, it's STEERED**
   - You're doing prompt engineering, not model training
   - Clear, consistent instructions yield better results
   - Over-instruction can confuse the model

2. **Consistency is Critical**
   - Lock down parameters (duration, aspect ratio)
   - Use same system prompt structure every time
   - Version your prompts for reproducibility

3. **Less Can Be More**
   - Veo already knows how to do lip-sync
   - Veo can see the dog in the image
   - Don't tell it what it already knows

4. **Constraints Prevent Morphing**
   - Explicit "do NOT change" rules work
   - Clamping user actions prevents scene changes
   - Fixed camera = better identity preservation

---

## 📞 Support

If you encounter issues with the new prompt system:

1. Check the logs - full prompt is printed with `---START PROMPT---` markers
2. Verify prompt version - should say `(v2.0)` in logs
3. Compare generated videos before/after the change
4. Review the test script output: `npx tsx scripts/test-new-prompt-v2.ts`

For questions or issues, refer to this changelog and the implementation in [server/veo.ts](server/veo.ts).
