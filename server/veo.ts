import * as fs from "fs";
import * as path from "path";
import { GoogleAuth } from "google-auth-library";
import { addWatermark, isFFmpegAvailable } from "./watermark";
import { uploadVideoToGCS } from "./cloudStorage";
import { sanitizeError } from "./validation";

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
  aspectRatio?: "16:9" | "9:16" | "1:1";
  resolution?: "720p" | "1080p";
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
 * Calculate optimal video duration based on dialogue length and tone
 * @param prompt - The dialogue text
 * @param tone - The speaking tone (affects pace)
 * @param hasAction - Whether there's an action to perform (adds buffer time)
 * @returns Duration in seconds (minimum 2, maximum 8)
 */
function calculateVideoDuration(prompt: string, tone?: string, hasAction?: boolean): number {
  // Count words in the prompt
  const wordCount = prompt.trim().split(/\s+/).length;

  // Determine words per minute based on tone
  const wpmByTone: Record<string, number> = {
    excited: 170,      // Fast, energetic pace
    funny: 160,        // Quick, comedic timing
    professional: 145, // Clear, moderate pace
    friendly: 140,     // Casual, comfortable pace
    calm: 130,         // Slower, measured pace
    sad: 120,          // Slow, emotional pace
  };

  // Default to average pace if tone not specified or not in map
  const wordsPerMinute = tone ? (wpmByTone[tone] || 140) : 140;

  // Calculate base duration for dialogue (in seconds)
  const dialogueDuration = (wordCount / wordsPerMinute) * 60;

  // Add buffer time:
  // - 0.5 seconds at start for natural beginning
  // - 0.5 seconds at end for natural ending
  // - Additional 1-2 seconds if there's an action to perform
  let bufferTime = 1.0; // Base buffer (start + end)

  if (hasAction) {
    // More buffer for action sequences
    bufferTime += 1.5;
  }

  const totalDuration = dialogueDuration + bufferTime;

  // Clamp between 2 and 8 seconds (Veo API constraints)
  const finalDuration = Math.max(2, Math.min(8, Math.ceil(totalDuration)));

  console.log(`📊 Video duration calculation:
    - Word count: ${wordCount}
    - Tone: ${tone || 'default'} (${wordsPerMinute} WPM)
    - Dialogue duration: ${dialogueDuration.toFixed(1)}s
    - Buffer time: ${bufferTime}s
    - Has action: ${hasAction ? 'yes' : 'no'}
    - Final duration: ${finalDuration}s`);

  return finalDuration;
}

function buildEnhancedPrompt(config: VideoGenerationConfig, duration: number): string {
  // Build minimal prompt - just voice, dialogue, and action WITHOUT quotes or "dog speaking" prefix
  // to avoid triggering subtitle generation. User form fields stay the same.
  const parts: string[] = [];

  // Add voice style if provided (optional) - goes first for natural flow
  if (config.voiceStyle && config.voiceStyle.trim()) {
    parts.push(config.voiceStyle.trim());
  }

  // Add the dialogue (required) - NO QUOTES to prevent subtitle generation
  parts.push(config.prompt);

  // Add action if provided (optional)
  if (config.action && config.action.trim()) {
    parts.push(config.action.trim());
  }

  // Join with commas - simple and natural
  const prompt = parts.join(', ');

  return prompt;
}

export async function generateVideo(config: VideoGenerationConfig): Promise<VideoGenerationResult> {
  try {
    const imageBytes = fs.readFileSync(config.imagePath);
    const imageBase64 = imageBytes.toString('base64');

    const mimeType = config.imagePath.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    // Calculate optimal video duration based on dialogue length, tone, and whether there's an action
    const hasAction = !!(config.action && config.action.trim());
    const duration = calculateVideoDuration(config.prompt, config.tone, hasAction);

    const enhancedPrompt = buildEnhancedPrompt(config, duration);

    console.log('🎬 Generated prompt:', enhancedPrompt);

    // Get OAuth 2.0 access token
    const accessToken = await getAccessToken();

    // Vertex AI endpoint for Veo 3.1 video generation
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;

    // Determine aspect ratio - use the provided one, ensuring 9:16 is used for portrait images
    let finalAspectRatio: "16:9" | "9:16" = "16:9";
    if (config.aspectRatio === "9:16" || config.aspectRatio === "1:1") {
      // For portrait or square images, use 9:16
      finalAspectRatio = "9:16";
    }

    console.log('📐 Using aspect ratio:', finalAspectRatio, '(detected from image:', config.aspectRatio, ')');

    // Build request body with minimal parameters to let Veo handle image preservation naturally
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
        // Try to disable subtitles/captions
        enableSubtitles: false,
        addSubtitles: false,
      },
    };

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
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      const rawError = errorData.error?.message || errorData.message || `API request failed: ${response.status} ${response.statusText}`;
      const sanitizedError = sanitizeError({ message: rawError });
      console.error("Vertex AI error:", sanitizedError);
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
      const errorText = await response.text();
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
