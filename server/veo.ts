import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { addWatermark, isFFmpegAvailable } from "./watermark.js";
import { uploadVideoToGCS, uploadImageToGCS, deleteFileFromGCS } from "./cloudStorage.js";
import { sanitizeError } from "./validation.js";

// Kie.ai API configuration
const KIE_API_BASE_URL = "https://api.kie.ai/api/v1/jobs";
const KIE_API_KEY = process.env.KIE_API_KEY;

// Check for required environment variables
if (!KIE_API_KEY) {
  console.error("❌ KIE_API_KEY not found. Please set the KIE_API_KEY environment variable");
} else {
  console.log("✅ Kie.ai API key configured");
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

// Prompt versioning for A/B testing and debugging
const PROMPT_VERSION = "3.0-kling";
const CHARS_PER_SECOND = 15; // Average speaking rate for English

/**
 * Calculate dynamic video duration based on prompt length
 * Kling 2.6 only supports 5 or 10 seconds
 */
function calculateDuration(text: string): "5" | "10" {
  const calculated = Math.ceil(text.length / CHARS_PER_SECOND);
  // Kling 2.6 only supports 5 or 10 seconds
  const duration = calculated <= 7 ? "5" : "10";

  console.log(`⏱️  Duration calculation: ${text.length} chars ÷ ${CHARS_PER_SECOND} chars/sec = ${calculated}s → rounded to ${duration}s (Kling supports: 5, 10)`);
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
  taskId: string;
}

export interface VideoStatusResult {
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  operation?: any;
}

/**
 * Build structured prompt for Kling 2.6
 * Optimized for talking dog video generation with audio
 */
function buildEnhancedPrompt(config: VideoGenerationConfig, duration: string): string {
  // Build voice description
  const voiceDescription = buildVoiceDescription(config.tone, config.voiceStyle);

  // Use raw action from user (no sanitization)
  const userAction = config.action && config.action.trim().length > 0
    ? config.action.trim()
    : '';

  // Build the structured prompt for Kling 2.6
  // Kling uses [character description, voice style] format for audio
  const prompt = `A photorealistic talking dog video. The dog in the image comes to life and speaks the following dialogue with a ${voiceDescription}.

The dog's appearance stays IDENTICAL to the photo - same breed, face, fur color, and any clothing/accessories.
The background, lighting, and camera angle remain exactly the same as the source image.
Only natural movements: mouth moving to speak, subtle head motion, ear twitches, blinking.
The video feels like the still image just came to life.
${userAction ? `\nThe dog also: ${userAction}` : ''}

[Dog character, ${voiceDescription}] speaks: "${config.prompt}"

Duration: ${duration} seconds of continuous footage. No cuts, no camera movement, no scene changes.`;

  // Log for debugging (with version info)
  console.log(`🎬 Generated prompt (v${PROMPT_VERSION}):`);
  console.log('---START PROMPT---');
  console.log(prompt);
  console.log('---END PROMPT---');

  return prompt;
}

export async function generateVideo(config: VideoGenerationConfig): Promise<VideoGenerationResult> {
  if (!KIE_API_KEY) {
    throw new Error("KIE_API_KEY is not configured");
  }

  try {
    // Use sharp to read the image and automatically correct EXIF orientation
    // This fixes the issue where iPhone/mobile photos appear rotated
    console.log("Processing image with EXIF orientation correction...");
    const processedImageBuffer = await sharp(config.imagePath)
      .rotate() // Automatically rotates based on EXIF orientation data
      .toBuffer();

    // Save processed image to temp file for upload
    const tempImagePath = path.join(
      process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), 'uploads'),
      `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
    );

    // Ensure directory exists
    const tempDir = path.dirname(tempImagePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Convert to JPEG for compatibility and save
    await sharp(processedImageBuffer)
      .jpeg({ quality: 90 })
      .toFile(tempImagePath);

    // Upload image to GCS to get a public URL (Kling requires URL, not base64)
    const imageFileName = `temp-images/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    console.log("Uploading image to cloud storage for API access...");
    const imageUrl = await uploadImageToGCS(tempImagePath, imageFileName);

    // Clean up local temp file
    fs.unlinkSync(tempImagePath);

    // Calculate dynamic duration based on prompt length
    const duration = calculateDuration(config.prompt);

    const enhancedPrompt = buildEnhancedPrompt(config, duration);

    // Build request body for Kie.ai Kling 2.6 API
    const requestBody = {
      model: "kling-2.6/image-to-video",
      input: {
        prompt: enhancedPrompt,
        image_urls: [imageUrl],
        sound: true, // Enable audio generation for talking
        duration: duration,
      },
    };

    // Log generation parameters
    console.log(`📊 Generation Parameters (Prompt v${PROMPT_VERSION}):`);
    console.log(`   - Model: kling-2.6/image-to-video`);
    console.log(`   - Duration: ${duration}s`);
    console.log(`   - Sound: enabled`);
    console.log(`   - Voice Style: ${buildVoiceDescription(config.tone, config.voiceStyle)}`);
    console.log(`   - Action (user input): ${config.action || 'none'}`);
    console.log(`   - Dialogue Length: ${config.prompt.length} chars`);
    console.log(`   - Image URL: ${imageUrl}`);

    console.log("Initiating video generation request to Kie.ai...");

    const response = await fetch(`${KIE_API_BASE_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok || responseData.code !== 200) {
      console.error("❌ Kie.ai API Error Response:");
      console.error("Status:", response.status, response.statusText);
      console.error("Response:", JSON.stringify(responseData, null, 2));

      const rawError = responseData.message || responseData.msg || `API request failed: ${response.status}`;
      const sanitizedError = sanitizeError({ message: rawError });
      throw new Error(sanitizedError);
    }

    const taskId = responseData.data?.taskId;
    if (!taskId) {
      throw new Error("No task ID returned from Kie.ai API");
    }

    console.log(`✅ Kie.ai task created successfully: ${taskId}`);

    // Store the temp image filename so we can clean it up later
    return {
      operation: {
        taskId,
        imageFileName, // Store for cleanup
      },
      taskId,
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
  if (!KIE_API_KEY) {
    return {
      status: "failed",
      error: "KIE_API_KEY is not configured",
    };
  }

  try {
    // operationName is the taskId from Kie.ai
    // It might be a JSON string with additional data or just the taskId
    let taskId: string;
    let imageFileName: string | undefined;

    try {
      const parsed = JSON.parse(operationName);
      taskId = parsed.taskId || operationName;
      imageFileName = parsed.imageFileName;
    } catch {
      taskId = operationName;
    }

    console.log(`Polling Kie.ai task status: ${taskId}`);

    const response = await fetch(`${KIE_API_BASE_URL}/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData.message || responseData.msg || `Status check failed: ${response.status}`;
      const sanitizedError = sanitizeError({ message: errorMsg });
      console.error("Task status check failed:", sanitizedError);
      throw new Error(sanitizedError);
    }

    const taskData = responseData.data;
    const state = taskData?.state;

    console.log(`Task state: ${state}`);

    // Handle different states
    if (state === "success") {
      // Parse result to get video URL
      let resultUrls: string[] = [];
      try {
        const resultJson = JSON.parse(taskData.resultJson || "{}");
        resultUrls = resultJson.resultUrls || [];
      } catch {
        console.error("Failed to parse resultJson:", taskData.resultJson);
      }

      if (resultUrls.length === 0) {
        console.error("No video URL in response");
        return {
          status: "failed",
          error: "No video generated",
        };
      }

      const sourceVideoUrl = resultUrls[0];
      console.log(`Video generated: ${sourceVideoUrl}`);

      // Download the video from Kie.ai (URLs expire after 24 hours)
      // and upload to our GCS for permanent storage
      try {
        console.log("Downloading video from Kie.ai...");
        const videoResponse = await fetch(sourceVideoUrl);
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.status}`);
        }

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        // Save to temp file
        const uploadsDir = process.env.NODE_ENV === 'production'
          ? path.join('/tmp', 'videos')
          : path.join(process.cwd(), "uploads", "videos");

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const videoFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
        const videoPath = path.join(uploadsDir, videoFileName);
        fs.writeFileSync(videoPath, videoBuffer);

        console.log("Video downloaded successfully");

        // Add watermark to the video
        let finalVideoPath = videoPath;
        let finalVideoUrl: string;

        try {
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

            finalVideoPath = watermarkedPath;
            console.log("Watermark added successfully");
          } else {
            console.warn("FFmpeg not available - video will not have watermark");
          }
        } catch (watermarkError: any) {
          console.error("Failed to add watermark:", watermarkError.message);
          console.log("Continuing without watermark...");
        }

        // Upload to GCS for persistent storage
        const gcsFileName = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
        console.log("Uploading video to cloud storage...");

        finalVideoUrl = await uploadVideoToGCS(finalVideoPath, gcsFileName);

        // Clean up local temp file
        fs.unlinkSync(finalVideoPath);

        // Clean up the temp image from GCS
        if (imageFileName) {
          await deleteFileFromGCS(imageFileName);
        }

        console.log("Video uploaded successfully");

        return {
          status: "completed",
          videoUrl: finalVideoUrl,
        };
      } catch (uploadError: any) {
        const sanitizedError = sanitizeError(uploadError);
        console.error("Failed to process video:", sanitizedError);
        throw new Error(`Video generated but failed to process: ${sanitizedError}`);
      }
    } else if (state === "fail") {
      const errorMsg = taskData.failMsg || "Video generation failed";
      const sanitizedError = sanitizeError({ message: errorMsg });
      console.error("Video generation failed:", sanitizedError);

      // Clean up temp image on failure
      if (imageFileName) {
        await deleteFileFromGCS(imageFileName);
      }

      return {
        status: "failed",
        error: sanitizedError,
      };
    } else {
      // Still processing
      console.log("Video still processing...");
      return {
        status: "processing",
      };
    }
  } catch (error: any) {
    const sanitizedMsg = sanitizeError(error);
    console.error("Error checking video status:", sanitizedMsg);
    return {
      status: "failed",
      error: sanitizedMsg,
    };
  }
}