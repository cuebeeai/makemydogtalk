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

function buildEnhancedPrompt(config: VideoGenerationConfig): string {
  let enhancedPrompt = "";

  // Determine voice characteristics
  let voiceDescription = "";

  if (config.voiceStyle && config.voiceStyle.trim()) {
    // Custom voice style provided by user
    voiceDescription = `with ${config.voiceStyle.trim()}`;
  } else {
    // Fall back to preset tone
    const toneMap: Record<string, string> = {
      friendly: "in a cheerful and playful tone",
      calm: "in a calm and sincere tone",
      excited: "in an excited and energetic tone",
      sad: "in a sad and emotional tone",
      funny: "in a funny and sarcastic tone",
      professional: "in a professional and clear tone",
    };
    voiceDescription = config.tone ? toneMap[config.tone] || "in a friendly tone" : "in a friendly tone";
  }

  // Build the main prompt with emphasis on maintaining image style
  enhancedPrompt = `A talking dog video that exactly matches the visual style of the input image. The dog should appear to be speaking ${voiceDescription}, saying: "${config.prompt}"`;

  // Add action if provided
  if (config.action && config.action.trim()) {
    enhancedPrompt += `. The dog ${config.action.trim()}`;
  }

  // Add background/scene if provided
  if (config.background && config.background.trim()) {
    enhancedPrompt += `. The scene is set in ${config.background}`;
  }

  // Add intent-specific context
  const intentContext: Record<string, string> = {
    adoption: ". The video has a warm, hopeful feeling suitable for adoption or rescue.",
    apology: ". The video conveys sincerity and heartfelt emotion.",
    celebration: ". The video is joyful and celebratory.",
    funny: ". The video is humorous and entertaining.",
    business: ". The video is professional and clear for promotional purposes.",
    memorial: ". The video is respectful and touching, suitable for a tribute.",
  };

  if (config.intent && intentContext[config.intent]) {
    enhancedPrompt += intentContext[config.intent];
  }

  // Add general quality directives with emphasis on preserving the input image's visual characteristics
  enhancedPrompt += " Preserve the exact visual style, lighting, and quality of the input image. If the image is photorealistic, maintain photorealism. If it's a cartoon or illustration, maintain that style. Use natural lip-sync and realistic movements. The video should be 8 seconds long.";

  return enhancedPrompt;
}

export async function generateVideo(config: VideoGenerationConfig): Promise<VideoGenerationResult> {
  try {
    const imageBytes = fs.readFileSync(config.imagePath);
    const imageBase64 = imageBytes.toString('base64');

    const mimeType = config.imagePath.toLowerCase().endsWith('.png')
      ? 'image/png'
      : 'image/jpeg';

    const enhancedPrompt = buildEnhancedPrompt(config);

    // Get OAuth 2.0 access token
    const accessToken = await getAccessToken();

    // Vertex AI endpoint for Veo 3.1 video generation
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;

    // Validate aspect ratio - Vertex AI Veo 3.1 only supports 16:9 and 9:16
    let finalAspectRatio = config.aspectRatio;
    if (finalAspectRatio === '1:1') {
      console.warn('1:1 aspect ratio is not supported. Converting to 16:9.');
      finalAspectRatio = '16:9';
    }

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
        durationSeconds: 8,
        generateAudio: true,
        sampleCount: 1,
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
    const sanitizedMsg = sanitizeError(error);
    console.error("Error generating video:", sanitizedMsg);
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
