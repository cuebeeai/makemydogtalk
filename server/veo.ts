import * as fs from "fs";
import * as path from "path";
import { GoogleAuth } from "google-auth-library";
import { addWatermark, isFFmpegAvailable } from "./watermark";

// Check for required environment variables
let serviceAccountCredentials: any;

// Support both file path (local dev) and JSON string (Vercel)
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccountCredentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    console.log("✅ Using SERVICE_ACCOUNT_JSON from environment");
  } catch (error) {
    console.error("❌ Failed to parse SERVICE_ACCOUNT_JSON:", error);
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
    console.log("Enhanced prompt:", enhancedPrompt);

    // Get OAuth 2.0 access token
    const accessToken = await getAccessToken();

    // Vertex AI endpoint for Veo 3.1 video generation
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;

    // Validate aspect ratio - Vertex AI Veo 3.1 only supports 16:9 and 9:16
    let finalAspectRatio = config.aspectRatio;
    if (finalAspectRatio === '1:1') {
      console.warn('1:1 aspect ratio is not supported by Vertex AI. Converting to 16:9.');
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

    console.log("Calling Vertex AI endpoint:", endpoint);

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
      console.error("Vertex AI error response:", errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.error?.message || errorData.message || `API request failed: ${response.status} ${response.statusText}`);
    }

    const operation = await response.json();
    console.log("Vertex AI operation started:", operation);

    return {
      operation,
    };
  } catch (error: any) {
    console.error("Error generating video:", error);
    throw new Error(`Video generation failed: ${error.message || "Unknown error"}`);
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

    console.log("Polling operation:", fullOperationName);
    console.log("Using endpoint:", endpoint);

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
      console.error("Operation status check failed:", errorText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Status check failed: ${response.status}`);
    }

    const updatedOperation = await response.json();

    console.log("Operation status:", JSON.stringify(updatedOperation, null, 2));

    if (!updatedOperation.done) {
      console.log("Video still processing...");
      return {
        status: "processing",
      };
    }

    console.log("Operation completed. Checking for errors...");
    if (updatedOperation.error) {
      const errorMsg = typeof updatedOperation.error === 'string'
        ? updatedOperation.error
        : (updatedOperation.error.message ? String(updatedOperation.error.message) : "Video generation failed");
      console.log("Error found:", errorMsg);
      return {
        status: "failed",
        error: errorMsg,
      };
    }

    console.log("Checking for generated video. Full updatedOperation:", JSON.stringify(updatedOperation, null, 2));
    console.log("updatedOperation.response exists?", !!updatedOperation.response);
    console.log("updatedOperation.response:", updatedOperation.response);

    // Veo 3.1 returns video in response.videos array with bytesBase64Encoded
    const videos = updatedOperation.response?.videos;
    console.log("videos exists?", !!videos);
    console.log("videos:", videos);
    console.log("videos length:", videos?.length);

    if (videos && videos.length > 0) {
      const videoData = videos[0];

      if (!videoData.bytesBase64Encoded) {
        console.log("No base64 video data in response:", videoData);
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

      console.log("Saving base64 video data to file");

      // Decode base64 video data and save
      const videoBuffer = Buffer.from(videoData.bytesBase64Encoded, 'base64');
      fs.writeFileSync(videoPath, videoBuffer);

      console.log("Video saved to:", videoPath);

      // Add watermark to the video
      let finalVideoPath = videoPath;
      let finalVideoUrl = `/uploads/videos/${videoFileName}`;

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
          const watermarkedFileName = path.basename(watermarkedPath);
          finalVideoUrl = `/uploads/videos/${watermarkedFileName}`;

          console.log("Watermark added successfully");
        } else {
          console.warn("FFmpeg not available - video will not have watermark. Install FFmpeg with: brew install ffmpeg");
        }
      } catch (watermarkError: any) {
        console.error("Failed to add watermark:", watermarkError.message);
        console.log("Continuing without watermark...");
        // Continue without watermark if it fails
      }

      console.log("Final video URL:", finalVideoUrl);

      return {
        status: "completed",
        videoUrl: finalVideoUrl,
      };
    }

    console.log("No videos found in response");
    return {
      status: "failed",
      error: "No video generated",
    };
  } catch (error: any) {
    console.error("Error checking video status:", error);
    return {
      status: "failed",
      error: error.message || "Failed to check video status",
    };
  }
}
