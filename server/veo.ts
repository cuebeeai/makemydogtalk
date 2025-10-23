import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({});

export interface VideoGenerationConfig {
  prompt: string;
  imagePath: string;
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

export async function generateVideo(config: VideoGenerationConfig): Promise<VideoGenerationResult> {
  try {
    const imageBytes = fs.readFileSync(config.imagePath);
    const imageBase64 = imageBytes.toString('base64');
    
    const mimeType = config.imagePath.toLowerCase().endsWith('.png') 
      ? 'image/png' 
      : 'image/jpeg';

    const operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: config.prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType,
      },
    });

    return {
      operation,
    };
  } catch (error: any) {
    console.error("Error generating video:", error);
    throw new Error(`Video generation failed: ${error.message || "Unknown error"}`);
  }
}

export async function checkVideoStatus(operation: any): Promise<VideoStatusResult> {
  try {
    const updatedOperation = await ai.operations.getVideosOperation({
      operation: operation,
    });

    if (!updatedOperation.done) {
      return {
        status: "processing",
      };
    }

    if (updatedOperation.error) {
      const errorMsg = typeof updatedOperation.error === 'string' 
        ? updatedOperation.error 
        : (updatedOperation.error.message ? String(updatedOperation.error.message) : "Video generation failed");
      return {
        status: "failed",
        error: errorMsg,
      };
    }

    if (updatedOperation.response?.generatedVideos && updatedOperation.response.generatedVideos.length > 0) {
      const generatedVideo = updatedOperation.response.generatedVideos[0];
      
      if (!generatedVideo.video) {
        return {
          status: "failed",
          error: "No video file in response",
        };
      }
      
      const uploadsDir = path.join(process.cwd(), "uploads", "videos");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const videoFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
      const videoPath = path.join(uploadsDir, videoFileName);

      await ai.files.download({
        file: generatedVideo.video,
        downloadPath: videoPath,
      });

      const videoUrl = `/uploads/videos/${videoFileName}`;
      
      return {
        status: "completed",
        videoUrl,
        operation: updatedOperation,
      };
    }

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
