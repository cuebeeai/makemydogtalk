import * as fs from "fs";
import * as path from "path";
import { GoogleAuth } from "google-auth-library";
import { addWatermark, isFFmpegAvailable } from "./watermark.js";
import { uploadVideoToGCS } from "./cloudStorage.js";
import { sanitizeError } from "./validation.js";

// Check for required environment variables
let serviceAccountCredentials: any;

// Support both file path (local dev) and JSON string (Vercel)
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccountCredentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    console.log("✅ Using SERVICE_ACCOUNT_JSON from environment");
  } catch (error) {
    console.error("❌ Failed to parse SERVICE_ACCOUNT_JSON");
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // For local development with file path
  console.log("✅ Using GOOGLE_APPLICATION_CREDENTIALS file path");
} else {
  console.error("❌ No Google credentials found. Please set SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS");
}

if (!process.env.VERTEX_AI_PROJECT_ID) {
  console.error("❌ Vertex AI Project ID not found. Please set the VERTEX_AI_PROJECT_ID environment variable");
}

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";

// Initialize Google Auth - support both methods
const auth = new GoogleAuth({
  credentials: serviceAccountCredentials,
  keyFilename: serviceAccountCredentials ? undefined : process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

// Function to get access token
async function getAccessToken(): Promise<string> {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw new Error("Failed to get access token");
  }
  return accessToken.token;
}

export interface VideoGenerationConfig {
  prompt: string;
  imagePath: string;
  intent?: string;
  tone?: string;
  voiceStyle?: string;
  action?: string;
  background?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1"; // Note: 1:1 will be converted to 9:16 (Veo limitation)
  resolution?: "720p" | "1080p";
}

// Prompt versioning for A/B testing and debugging
const PROMPT_VERSION = "2.1";
const MIN_DURATION_SECONDS = 4; // Minimum for a good video loop
const MAX_DURATION_SECONDS = 8; // Veo max (or budget cap)
const CHARS_PER_SECOND = 15; // Average speaking rate for English

/**
 * Calculate dynamic video duration based on prompt length
 * Prevents awkward pauses (too short text) or rushed speech (too long text)
 */
function calculateDuration(text: string): number {
  const calculated = Math.ceil(text.length / CHARS_PER_SECOND);
  const duration = Math.max(MIN_DURATION_SECONDS, Math.min(MAX_DURATION_SECONDS, calculated));
  console.log(`⏱️  Duration calculation: ${text.length} chars ÷ ${CHARS_PER_SECOND} chars/sec = ${calculated}s → clamped to ${duration}s`);
  return duration;
}

/**
 * Build voice style description from tone and voiceStyle fields
 */
function buildVoiceDescription(tone?: string, voiceStyle?: string): string {
  const parts: string[] = [];

  // Map tone to voice characteristics
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

  // Add custom voice style if provided
  if (voiceStyle && voiceStyle.trim().length > 0) {
    parts.push(voiceStyle.trim());
  }

  // Default if nothing provided
  if (parts.length === 0) {
    return 'natural, clear voice';
  }

  return parts.join(', ');
}

export interface VideoGenerationResult {
  operation: any;
}

export interface VideoStatusResult {
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  operation?: any;
}

/**
 * Build structured prompt for Veo 3.1 using dynamic duration
 * This ensures consistency, prevents morphing, and maintains lip-sync quality
 */
function buildEnhancedPrompt(config: VideoGenerationConfig, duration: number): string {
  // Check if this is a multi-dog dialogue
  const isMultiDog = /Dog\s+\d+:/i.test(config.prompt);

  // Build voice description
  const voiceDescription = buildVoiceDescription(config.tone, config.voiceStyle);

  // Use raw action from user (no sanitization)
  const userAction = config.action && config.action.trim().length > 0
    ? config.action.trim()
    : '';

  // Determine orientation description
  const orientationDesc = config.aspectRatio === '9:16'
    ? 'Vertical 9:16 orientation (for TikTok/Reels/Shorts).'
    : config.aspectRatio === '1:1'
    ? 'Square 1:1 orientation.'
    : 'Horizontal 16:9 orientation.';

  // Build the structured system prompt
  const systemPrompt = `You are generating a short, ${duration}-second, photorealistic talking-dog video for an app called MakeMyDogTalk.com.
Start from the provided dog photo and treat it as the exact first frame of the video.

Hard requirements (do NOT violate these):
- Keep the dog's appearance IDENTICAL to the photo: same breed, face, fur color, clothing, accessories, body shape, and size.
- Keep the background, lighting, camera angle, and composition EXACTLY the same as the photo.
- Do NOT change the dog's species, add extra limbs, or stylize the dog in any way.
- Do NOT move the camera. No cuts, no zooming, no scene changes.
- Only add small, natural movements: mouth moving to talk, subtle head motion, ear twitches, blinking, maybe slight body shift.
- The video should feel like the still image just came to life.

Frame filling requirements (CRITICAL):
- The ENTIRE video frame MUST be filled with image content - absolutely NO black bars, letterboxing, or pillarboxing anywhere.
- If the source photo aspect ratio differs from the target ${config.aspectRatio || '16:9'} format, intelligently extend or crop the scene to fill the frame completely.
- Keep the dog centered and fully visible, but ensure every pixel of the output is actual image content, not black padding.

Lip-sync requirements:
- Animate the dog's mouth to match the syllables of the dialogue text provided.
- The dog should appear to be speaking clearly, with natural mouth movements.
- Time the mouth motion so the speech line fits within ${duration} seconds.

Audio requirements:
- Generate crystal clear, high-quality audio with excellent clarity and no muffling.
- The voice should be crisp, well-articulated, and professionally recorded quality.
- Ensure proper audio levels - not too quiet, not distorted.
- Audio should sound natural and present, as if recorded in a professional studio.

Style requirements:
- Keep the overall look clean, sharp, and realistic, like a high-quality smartphone video.
- No extra text, logos, or filters over the video.

Now generate a single, continuous shot video that follows these rules.`;

  // Build the per-request details section
  let requestDetails = `

Voice style: ${voiceDescription}`;

  // Only add action line if user provided one
  if (userAction) {
    requestDetails += `

Requested action: ${userAction}`;
  }

  requestDetails += `

${isMultiDog ? 'Dialogue (multiple dogs speaking in sequence):' : 'Dialogue (what the dog says):'}
"${config.prompt}"

Duration: ${duration} seconds.
${orientationDesc}`;

  // Combine system prompt + request details
  const fullPrompt = systemPrompt + requestDetails;

  // Log for debugging (with version info)
  console.log(`🎬 Generated prompt (v${PROMPT_VERSION}):`);
  console.log('---START PROMPT---');
  console.log(fullPrompt);
  console.log('---END PROMPT---');

  return fullPrompt;
}

export async function generateVideo(config: VideoGenerationConfig): Promise<VideoGenerationResult> {
  try {
    const imageBytes = fs.readFileSync(config.imagePath);
    const imageBase64 = imageBytes.toString('base64');

    const mimeType = config.imagePath.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    // Calculate dynamic duration based on prompt length
    const duration = calculateDuration(config.prompt);

    const enhancedPrompt = buildEnhancedPrompt(config, duration);

    // Get OAuth 2.0 access token
    const accessToken = await getAccessToken();

    // Vertex AI endpoint for Veo 3.1 video generation
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;

    // Target aspect ratio (user-selected or default)
    // Note: Veo 3.1 only supports 16:9 and 9:16, NOT 1:1
    // If user selects 1:1, we'll use 9:16 (vertical) as it's closest
    let finalAspectRatio: "16:9" | "9:16" = config.aspectRatio === "1:1"
      ? "9:16"  // Map 1:1 to 9:16 since Veo doesn't support square
      : (config.aspectRatio as "16:9" | "9:16") || "16:9";

    if (config.aspectRatio === "1:1") {
      console.log('⚠️  1:1 aspect ratio not supported by Veo 3.1, using 9:16 instead');
    }
    console.log('📐 Target aspect ratio:', finalAspectRatio, '(source image may be extended/cropped to fit)');

    // Build request body with clean parameters for Veo 3.1
    // Using only validated parameters to prevent issues
    const requestBody = {
      instances: [{
        prompt: enhancedPrompt,
        image: {
          bytesBase64Encoded: imageBase64,
          mimeType: mimeType,
        },
      }],
      parameters: {
        aspectRatio: finalAspectRatio,
        durationSeconds: duration,
        generateAudio: true,
        sampleCount: 1,
      },
    };

    // Log full generation parameters for debugging and A/B testing
    console.log(`📊 Generation Parameters (Prompt v${PROMPT_VERSION}):`);
    console.log(`   - Duration: ${duration}s (fixed)`);
    console.log(`   - Aspect Ratio: ${finalAspectRatio}`);
    console.log(`   - Generate Audio: true`);
    console.log(`   - Sample Count: 1`);
    console.log(`   - Voice Style: ${buildVoiceDescription(config.tone, config.voiceStyle)}`);
    console.log(`   - Action (user input): ${config.action || 'none'}`);
    console.log(`   - Dialogue Length: ${config.prompt.length} chars`);

    console.log("Initiating video generation request...");

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Vertex AI API Error Response:");
      console.error("Status:", response.status, response.statusText);
      console.error("Raw response:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error("Parsed error data:", JSON.stringify(errorData, null, 2));
      } catch {
        errorData = { message: errorText };
      }
      const rawError = errorData.error?.message || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
      console.error("Extracted error message:", rawError);

      const sanitizedError = sanitizeError({ message: rawError });
      console.error("Sanitized error:", sanitizedError);
      throw new Error(sanitizedError);
    }

    const operation = await response.json();
    console.log("Vertex AI operation started successfully");

    return {
      operation,
    };
  } catch (error: any) {
    console.error("RAW Error generating video:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    const sanitizedMsg = sanitizeError(error);
    console.error("SANITIZED Error generating video:", sanitizedMsg);
    throw new Error(sanitizedMsg);
  }
}

export async function checkVideoStatus(operationName: string): Promise<VideoStatusResult> {
  try {
    // Get OAuth 2.0 access token
    const accessToken = await getAccessToken();

    // The operation name from Veo 3.1 comes in the format: "models/veo-3.1-generate-preview/operations/OPERATION_ID"
    // We need to convert it to the full path: "projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID/operations/OPERATION_ID" for the fetchPredictOperation call.
    let fullOperationName: string;
    
    if (operationName.startsWith('projects/')) {
      // Already a full path
      fullOperationName = operationName;
    } else if (operationName.startsWith('models/')) {
      // Partial path, need to prepend the project/location prefix
      fullOperationName = `projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/${operationName}`;
    } else {
      // Just the operation ID
      fullOperationName = `projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/veo-3.1-generate-preview/operations/${operationName}`;
    }

    // For Veo 3.1, we need to use the fetchPredictOperation endpoint
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:fetchPredictOperation`;

    console.log("Polling video generation status...");

    const requestBody = {
      operationName: fullOperationName
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await response.text();
      const errorData = await response.json().catch(() => ({}));
      const rawError = errorData.error?.message || `Status check failed: ${response.status}`;
      const sanitizedError = sanitizeError({ message: rawError });
      console.error("Operation status check failed:", sanitizedError);
      throw new Error(sanitizedError);
    }

    const updatedOperation = await response.json();

    if (!updatedOperation.done) {
      console.log("Video still processing...");
      return {
        status: "processing",
      };
    }

    if (updatedOperation.error) {
      const errorMsg = typeof updatedOperation.error === 'string'
        ? updatedOperation.error
        : (updatedOperation.error.message ? String(updatedOperation.error.message) : "Video generation failed");
      const sanitizedError = sanitizeError({ message: errorMsg });
      console.error("Video generation failed:", sanitizedError);
      return {
        status: "failed",
        error: sanitizedError,
      };
    }

    // Veo 3.1 returns video in response.videos array with bytesBase64Encoded
    const videos = updatedOperation.response?.videos;

    if (videos && videos.length > 0) {
      const videoData = videos[0];

      if (!videoData.bytesBase64Encoded) {
        console.error("No video data in response");
        return {
          status: "failed",
          error: "No video data in response",
        };
      }

      // Use /tmp for Vercel serverless, regular uploads for other environments
      const uploadsDir = process.env.NODE_ENV === 'production'
        ? path.join('/tmp', 'videos')
        : path.join(process.cwd(), "uploads", "videos");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const videoFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
      const videoPath = path.join(uploadsDir, videoFileName);

      console.log("Processing generated video...");

      // Decode base64 video data and save
      const videoBuffer = Buffer.from(videoData.bytesBase64Encoded, 'base64');
      fs.writeFileSync(videoPath, videoBuffer);

      console.log("Video file created successfully");

      // Add watermark to the video
      let finalVideoPath = videoPath;
      let finalVideoUrl: string;

      try {
        // Check if FFmpeg is available
        const ffmpegAvailable = await isFFmpegAvailable();

        if (ffmpegAvailable) {
          console.log("Adding watermark to video...");
          const watermarkedPath = await addWatermark({
            inputPath: videoPath,
            text: "MakeMyDogTalk.com",
            fontSize: 28,
            opacity: 0.25,
            position: "bottom-center",
          });

          // Delete the original unwatermarked video
          fs.unlinkSync(videoPath);

          // Use the watermarked video
          finalVideoPath = watermarkedPath;
          console.log("Watermark added successfully");
        } else {
          console.warn("FFmpeg not available - video will not have watermark. Install FFmpeg with: brew install ffmpeg");
        }
      } catch (watermarkError: any) {
        console.error("Failed to add watermark:", watermarkError.message);
        console.log("Continuing without watermark...");
        // Continue without watermark if it fails
      }

      // Upload to Google Cloud Storage for persistent storage
      try {
        const gcsFileName = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
        console.log("Uploading video to cloud storage...");

        finalVideoUrl = await uploadVideoToGCS(finalVideoPath, gcsFileName);

        // Clean up local temp file
        fs.unlinkSync(finalVideoPath);
        console.log("Video uploaded successfully");
      } catch (uploadError: any) {
        const sanitizedError = sanitizeError(uploadError);
        console.error("Failed to upload video:", sanitizedError);

        // CRITICAL: On Vercel/serverless, local paths will NOT work
        // We must throw an error instead of silently failing with unusable URLs
        throw new Error(`Video generated but failed to upload to cloud storage. Please check configuration.`);
      }

      return {
        status: "completed",
        videoUrl: finalVideoUrl,
      };
    }

    console.error("No video data in API response");
    return {
      status: "failed",
      error: "No video generated",
    };
  } catch (error: any) {
    const sanitizedMsg = sanitizeError(error);
    console.error("Error checking video status:", sanitizedMsg);
    return {
      status: "failed",
      error: sanitizedMsg,
    };
  }
}
