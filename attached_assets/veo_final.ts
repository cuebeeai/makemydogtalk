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
    } else if (ai.operations) {
      // We found that getVideosOperation method exists, let's use it
      console.log("Trying to use getVideosOperation method");
      
      try {
        // Use the specific method we found in the logs
        if (typeof (ai.operations as any).getVideosOperation === 'function') {
          console.log("Calling getVideosOperation with ID:", operationId);
          const updatedOp = await (ai.operations as any).getVideosOperation(operationId);
          if (updatedOp) {
            operation = updatedOp;
            operationsCache.set(operationId, operation);
            console.log("Successfully retrieved operation via getVideosOperation");
          }
        } else if (typeof (ai.operations as any).getVideosOperationInternal === 'function') {
          console.log("Calling getVideosOperationInternal with ID:", operationId);
          const updatedOp = await (ai.operations as any).getVideosOperationInternal(operationId);
          if (updatedOp) {
            operation = updatedOp;
            operationsCache.set(operationId, operation);
            console.log("Successfully retrieved operation via getVideosOperationInternal");
          }
        } else {
          // Try with the full operation name from cache
          if (operation && operation.name) {
            console.log("Trying with full operation name:", operation.name);
            try {
              const updatedOp = await (ai.operations as any).getVideosOperation(operation.name);
              if (updatedOp) {
                operation = updatedOp;
                operationsCache.set(operationId, operation);
              }
            } catch (err: any) {
              console.error("getVideosOperation with full name failed:", err.message);
            }
          }
        }
      } catch (err: any) {
        console.error("Operations API error:", err.message);
        
        // If we still have a cached operation, we'll use it
        if (!operation) {
          throw new Error("No operation found and unable to fetch");
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

    // If we only have the basic cached operation without status, try REST API
    if (operation && !('done' in operation) && operation.name) {
      console.log("Operation missing 'done' property, trying REST API fallback");
      const restResult = await checkVideoStatusREST(operationId);
      
      // Update cache if we got a successful response
      if (restResult.status !== "failed") {
        return restResult;
      }
    }

    // Check if operation is done
    if (operation.done === false || operation.done === undefined || operation.done === null) {
      console.log("Video still processing (done:", operation.done, ")");
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
    
    // Try different response structures
    let generatedSamples = operation.response?.generateVideoResponse?.generatedSamples;
    
    // Sometimes the response might be directly in the operation
    if (!generatedSamples && operation.generateVideoResponse) {
      generatedSamples = operation.generateVideoResponse.generatedSamples;
    }
    
    // Or it might be in a different structure
    if (!generatedSamples && operation.result) {
      generatedSamples = operation.result.generatedSamples || operation.result.generateVideoResponse?.generatedSamples;
    }
    
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
        
        const videoUrl = `/uploads/videos/${videoFileName}`;
        console.log("Video saved to:", videoUrl);
        
        // Clear from cache after successful completion
        operationsCache.delete(operationId);
        
        return {
          status: "completed",
          videoUrl,
        };
      } catch (downloadError: any) {
        console.error("Download error:", downloadError);
        // Return the GCS URL directly if download fails
        return {
          status: "completed",
          videoUrl: generatedSample.video,
        };
      }
    }

    // If operation is done but no video, check if it's actually still processing
    // Sometimes done can be undefined or null instead of false
    if (operation.done !== true) {
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

// Helper function to manually poll using REST API as fallback
export async function checkVideoStatusREST(operationId: string): Promise<VideoStatusResult> {
  try {
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    // Try both possible endpoints
    const endpoints = [
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/operations/${operationId}`,
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview/operations/${operationId}`,
    ];
    
    for (const url of endpoints) {
      try {
        console.log("Trying REST endpoint:", url);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const operation = await response.json();
          console.log("REST API response:", operation);
          
          if (!operation.done) {
            return { status: "processing" };
          }
          
          if (operation.error) {
            return {
              status: "failed",
              error: operation.error.message || "Operation failed",
            };
          }
          
          const generatedSamples = operation.response?.generateVideoResponse?.generatedSamples || 
                                   operation.metadata?.generateVideoResponse?.generatedSamples;
                                   
          if (generatedSamples && generatedSamples.length > 0) {
            return {
              status: "completed",
              videoUrl: generatedSamples[0].video,
            };
          }
        }
      } catch (err) {
        console.error(`REST endpoint ${url} failed:`, err);
      }
    }
    
    return {
      status: "failed",
      error: "Unable to check status via REST API",
    };
  } catch (error: any) {
    console.error("REST API fallback failed:", error);
    return {
      status: "failed",
      error: error.message || "Failed to check video status via REST",
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