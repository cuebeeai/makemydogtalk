import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_REGION || "us-central1";

if (!projectId) {
  throw new Error("GCP_PROJECT_ID environment variable is required");
}

const ai = new GoogleGenAI({
  project: projectId,
  location: location,
});

// Store operations in memory (in production, use a database)
const operationsCache = new Map<string, any>();

export interface VideoGenerationConfig {
  prompt: string;
  imagePath: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  resolution?: "720p" | "1080p";
}

export interface VideoGenerationResult {
  operation: any;
  operationId?: string;
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

    // Store the operation object for later use
    const operationId = operation.name?.split('/').pop() || `op_${Date.now()}`;
    operationsCache.set(operationId, operation);
    
    console.log("Generated video operation:", operation.name, "ID:", operationId);

    return {
      operation,
      operationId,
    };
  } catch (error: any) {
    console.error("Error generating video:", error);
    throw new Error(`Video generation failed: ${error.message || "Unknown error"}`);
  }
}

export async function checkVideoStatus(operationName: string): Promise<VideoStatusResult> {
  try {
    const operationId = operationName.split('/').pop() || operationName;
    console.log("Checking status for operation ID:", operationId);

    // First, check if we have the operation cached
    let operation = operationsCache.get(operationId);
    
    if (operation && typeof operation.poll === 'function') {
      // If the operation object has a poll method, use it
      console.log("Using cached operation's poll method");
      try {
        const polledOperation = await operation.poll();
        if (polledOperation) {
          operation = polledOperation;
          operationsCache.set(operationId, operation);
        }
      } catch (pollError: any) {
        console.error("Poll failed:", pollError.message);
        // Continue with the cached operation
      }
    } else if (operation && typeof operation.wait === 'function') {
      // Some SDKs use wait() instead of poll()
      console.log("Using cached operation's wait method");
      try {
        const waitedOperation = await operation.wait();
        if (waitedOperation) {
          operation = waitedOperation;
          operationsCache.set(operationId, operation);
        }
      } catch (waitError: any) {
        console.error("Wait failed:", waitError.message);
      }
    } else {
      // Try to get the operation using various methods
      console.log("No cached operation or poll method, trying direct access");
      
      // Method 1: Try with the operations API if it exists
      if (ai.operations) {
        try {
          // Check what methods are available
          console.log("Available operations methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.operations)));
          
          // Try different method names that might exist
          if (typeof (ai.operations as any).poll === 'function') {
            operation = await (ai.operations as any).poll(operationId);
          } else if (typeof (ai.operations as any).wait === 'function') {
            operation = await (ai.operations as any).wait(operationId);
          } else if (typeof (ai.operations as any).check === 'function') {
            operation = await (ai.operations as any).check(operationId);
          } else {
            // Last resort: try get with just the ID
            operation = await (ai.operations as any).get(operationId);
          }
        } catch (err: any) {
          console.error("Operations API error:", err.message);
          
          // If we still have a cached operation, check if it has a done property
          if (operation) {
            console.log("Using cached operation despite error");
          } else {
            throw new Error("No operation found and unable to fetch");
          }
        }
      }
    }

    if (!operation) {
      return {
        status: "failed",
        error: "Operation not found",
      };
    }

    console.log("Operation object:", JSON.stringify(operation, null, 2));

    // Check if operation is done
    if (operation.done === false) {
      console.log("Video still processing...");
      return {
        status: "processing",
      };
    }

    // Check for errors
    if (operation.error) {
      const errorMsg = typeof operation.error === 'string' 
        ? operation.error 
        : (operation.error.message ? String(operation.error.message) : "Video generation failed");
      console.log("Error found:", errorMsg);
      return {
        status: "failed",
        error: errorMsg,
      };
    }

    // Check for video in response
    console.log("Checking for generated video. Response:", operation.response);
    
    const generatedSamples = operation.response?.generateVideoResponse?.generatedSamples;
    console.log("generatedSamples:", generatedSamples);
    
    if (generatedSamples && generatedSamples.length > 0) {
      const generatedSample = generatedSamples[0];
      
      if (!generatedSample.video) {
        console.log("No video in sample:", generatedSample);
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

      console.log("Downloading video from:", generatedSample.video);
      
      try {
        await ai.files.download({
          file: generatedSample.video,
          downloadPath: videoPath,
        });
      } catch (downloadError: any) {
        console.error("Download error:", downloadError);
        // Return the GCS URL directly if download fails
        return {
          status: "completed",
          videoUrl: generatedSample.video,
        };
      }

      const videoUrl = `/uploads/videos/${videoFileName}`;
      console.log("Video saved to:", videoUrl);
      
      // Clear from cache after successful completion
      operationsCache.delete(operationId);
      
      return {
        status: "completed",
        videoUrl,
      };
    }

    // If operation is done but no video, it might still be processing
    if (operation.done === true && !operation.response) {
      return {
        status: "processing",
      };
    }

    console.log("No generatedSamples found in response");
    return {
      status: "failed",
      error: "No video generated",
    };
  } catch (error: any) {
    console.error("Error checking video status:", error);
    console.error("Error stack:", error.stack);
    return {
      status: "failed",
      error: error.message || "Failed to check video status",
    };
  }
}

// Helper function to clear old operations from cache (call periodically)
export function clearOldOperations(maxAgeMs: number = 3600000) {
  // In production, you'd want to track timestamps and clear old ones
  // For now, this is a simple clear all
  if (operationsCache.size > 100) {
    operationsCache.clear();
  }
}