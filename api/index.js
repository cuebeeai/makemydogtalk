// server/vercel.ts
import "dotenv/config";
import express3 from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
import { createServer } from "http";
import express2 from "express";
import multer from "multer";
import path2 from "path";
import fs3 from "fs";

// server/storage.ts
import { randomUUID } from "crypto";

// server/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Authentication fields
  email: text("email").notNull().unique(),
  password: text("password"),
  // Nullable for OAuth users
  googleId: text("google_id").unique(),
  // For Google OAuth users
  // Profile fields
  name: text("name").notNull(),
  picture: text("picture"),
  // Profile picture URL
  // Account management
  credits: integer("credits").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login")
});
var insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  name: z.string().min(1, "Name is required")
}).pick({
  email: true,
  password: true,
  name: true
});
var insertOAuthUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  googleId: z.string().min(1, "Google ID is required")
}).pick({
  email: true,
  googleId: true,
  name: true,
  picture: true
});
var videoOperations = pgTable("video_operations", {
  id: text("id").primaryKey(),
  operationId: text("operation_id"),
  status: text("status").notNull(),
  prompt: text("prompt").notNull(),
  imagePath: text("image_path"),
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id")
  // New field
});
var insertVideoOperationSchema = createInsertSchema(videoOperations).omit({
  id: true,
  createdAt: true
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  console.error("\u274C DATABASE_URL environment variable is not set!");
  console.error("Please configure DATABASE_URL in Firebase App Hosting secrets.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
console.log("\u2705 DATABASE_URL is configured, initializing database connection...");
var sql2 = neon(process.env.DATABASE_URL);
var db = drizzle(sql2, {
  schema: { users, videoOperations }
});
console.log("\u2705 Database connection initialized successfully");

// server/storage.ts
import { eq } from "drizzle-orm";
var MemStorage = class {
  users;
  videoOperations;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.videoOperations = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async getUserByGoogleId(googleId) {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      id,
      email: insertUser.email,
      password: insertUser.password ?? null,
      googleId: null,
      name: insertUser.name,
      picture: null,
      credits: 0,
      stripeCustomerId: null,
      createdAt: /* @__PURE__ */ new Date(),
      lastLogin: null
    };
    this.users.set(id, user);
    return user;
  }
  async createOAuthUser(insertUser) {
    const id = randomUUID();
    const user = {
      id,
      email: insertUser.email,
      password: null,
      googleId: insertUser.googleId,
      name: insertUser.name,
      picture: insertUser.picture ?? null,
      credits: 0,
      stripeCustomerId: null,
      createdAt: /* @__PURE__ */ new Date(),
      lastLogin: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
  async createVideoOperation(insertOperation) {
    const id = randomUUID();
    const operation = {
      id,
      operationId: insertOperation.operationId ?? null,
      status: insertOperation.status,
      prompt: insertOperation.prompt,
      imagePath: insertOperation.imagePath ?? null,
      videoUrl: insertOperation.videoUrl ?? null,
      error: insertOperation.error ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      userId: insertOperation.userId ?? null
    };
    this.videoOperations.set(id, operation);
    return operation;
  }
  async getVideoOperation(id) {
    return this.videoOperations.get(id);
  }
  async updateVideoOperation(id, updates) {
    const operation = this.videoOperations.get(id);
    if (!operation) return void 0;
    const updated = { ...operation, ...updates };
    this.videoOperations.set(id, updated);
    return updated;
  }
  async getVideosByUserId(userId) {
    return Array.from(this.videoOperations.values()).filter(
      (op) => op.userId === userId
    );
  }
};
var DbStorage = class {
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async getUserByGoogleId(googleId) {
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values({
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      credits: 0
    }).returning();
    return result[0];
  }
  async createOAuthUser(insertUser) {
    const result = await db.insert(users).values({
      email: insertUser.email,
      googleId: insertUser.googleId,
      name: insertUser.name,
      picture: insertUser.picture,
      credits: 0,
      lastLogin: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  async createVideoOperation(insertOperation) {
    const id = randomUUID();
    const result = await db.insert(videoOperations).values({
      id,
      operationId: insertOperation.operationId,
      status: insertOperation.status,
      prompt: insertOperation.prompt,
      imagePath: insertOperation.imagePath,
      videoUrl: insertOperation.videoUrl,
      error: insertOperation.error,
      userId: insertOperation.userId
    }).returning();
    return result[0];
  }
  async getVideoOperation(id) {
    const result = await db.select().from(videoOperations).where(eq(videoOperations.id, id));
    return result[0];
  }
  async updateVideoOperation(id, updates) {
    const result = await db.update(videoOperations).set(updates).where(eq(videoOperations.id, id)).returning();
    return result[0];
  }
  async getVideosByUserId(userId) {
    return await db.select().from(videoOperations).where(eq(videoOperations.userId, userId));
  }
};
var storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();

// server/veo.ts
import * as fs2 from "fs";
import * as path from "path";
import { GoogleAuth } from "google-auth-library";

// server/watermark.ts
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
var execAsync = promisify(exec);
async function addWatermark(options) {
  const {
    inputPath,
    outputPath,
    text: text2 = "MakeMyDogTalk.com",
    fontSize = 24,
    opacity = 0.3,
    position = "bottom-center"
  } = options;
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video file not found: ${inputPath}`);
  }
  const finalOutputPath = outputPath || inputPath.replace(".mp4", "_watermarked.mp4");
  let xPosition;
  let yPosition;
  switch (position) {
    case "bottom-center":
      xPosition = "(w-text_w)/2";
      yPosition = "h-th-40";
      break;
    case "bottom-right":
      xPosition = "w-text_w-20";
      yPosition = "h-th-40";
      break;
    case "bottom-left":
      xPosition = "20";
      yPosition = "h-th-40";
      break;
    case "top-center":
      xPosition = "(w-text_w)/2";
      yPosition = "20";
      break;
    default:
      xPosition = "(w-text_w)/2";
      yPosition = "h-th-40";
  }
  const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "drawtext=text='${text2}':fontcolor=white@${opacity}:fontsize=${fontSize}:x=${xPosition}:y=${yPosition}" -codec:a copy "${finalOutputPath}"`;
  console.log(`Adding watermark to video: ${inputPath}`);
  console.log(`Watermark text: "${text2}"`);
  console.log(`Output: ${finalOutputPath}`);
  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    if (stderr && !stderr.includes("frame=")) {
      console.log("FFmpeg stderr:", stderr);
    }
    if (!fs.existsSync(finalOutputPath)) {
      throw new Error("Watermarked video file was not created");
    }
    const stats = fs.statSync(finalOutputPath);
    console.log(`Watermarked video created: ${finalOutputPath} (${stats.size} bytes)`);
    return finalOutputPath;
  } catch (error) {
    console.error("FFmpeg watermarking error:", error);
    try {
      await execAsync("ffmpeg -version");
    } catch {
      throw new Error("FFmpeg is not installed. Please install FFmpeg: brew install ffmpeg");
    }
    throw new Error(`Failed to add watermark: ${error.message}`);
  }
}
async function isFFmpegAvailable() {
  try {
    await execAsync("ffmpeg -version");
    return true;
  } catch {
    return false;
  }
}

// server/cloudStorage.ts
import { Storage } from "@google-cloud/storage";
var storage2 = new Storage({
  credentials: process.env.SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.SERVICE_ACCOUNT_JSON) : void 0,
  projectId: process.env.VERTEX_AI_PROJECT_ID
});
var BUCKET_NAME = process.env.GCS_BUCKET_NAME || "makemydogtalk-videos";
async function uploadVideoToGCS(localFilePath, destinationFileName) {
  try {
    console.log(`\u{1F4E4} Uploading video to GCS: ${destinationFileName}`);
    const bucket = storage2.bucket(BUCKET_NAME);
    await bucket.upload(localFilePath, {
      destination: destinationFileName,
      metadata: {
        contentType: "video/mp4",
        cacheControl: "public, max-age=31536000"
        // Cache for 1 year
      },
      public: true
      // Make the file publicly accessible
    });
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationFileName}`;
    console.log(`\u2705 Video uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("\u274C Error uploading video to GCS:", error);
    throw new Error(`Failed to upload video to cloud storage: ${error.message}`);
  }
}
async function ensureBucketExists() {
  try {
    const bucket = storage2.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log(`\u{1F4E6} Creating GCS bucket: ${BUCKET_NAME}`);
      await storage2.createBucket(BUCKET_NAME, {
        location: "US",
        storageClass: "STANDARD",
        iamConfiguration: {
          publicAccessPrevention: "inherited",
          uniformBucketLevelAccess: {
            enabled: false
            // Allow fine-grained ACLs for public access
          }
        }
      });
      console.log(`\u2705 Bucket created: ${BUCKET_NAME}`);
    } else {
      console.log(`\u2705 GCS bucket already exists: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error(`\u274C Error ensuring bucket exists: ${error.message}`);
    console.warn("\u26A0\uFE0F  Continuing without bucket verification. Videos may fail to upload.");
  }
}

// server/veo.ts
var serviceAccountCredentials;
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccountCredentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    console.log("\u2705 Using SERVICE_ACCOUNT_JSON from environment");
  } catch (error) {
    console.error("\u274C Failed to parse SERVICE_ACCOUNT_JSON:", error);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log("\u2705 Using GOOGLE_APPLICATION_CREDENTIALS file path");
} else {
  console.error("\u274C No Google credentials found. Please set SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS");
}
if (!process.env.VERTEX_AI_PROJECT_ID) {
  console.error("\u274C Vertex AI Project ID not found. Please set the VERTEX_AI_PROJECT_ID environment variable");
}
var VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
var VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";
var auth = new GoogleAuth({
  credentials: serviceAccountCredentials,
  keyFilename: serviceAccountCredentials ? void 0 : process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});
async function getAccessToken() {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw new Error("Failed to get access token");
  }
  return accessToken.token;
}
function buildEnhancedPrompt(config) {
  let enhancedPrompt = "";
  let voiceDescription = "";
  if (config.voiceStyle && config.voiceStyle.trim()) {
    voiceDescription = `with ${config.voiceStyle.trim()}`;
  } else {
    const toneMap = {
      friendly: "in a cheerful and playful tone",
      calm: "in a calm and sincere tone",
      excited: "in an excited and energetic tone",
      sad: "in a sad and emotional tone",
      funny: "in a funny and sarcastic tone",
      professional: "in a professional and clear tone"
    };
    voiceDescription = config.tone ? toneMap[config.tone] || "in a friendly tone" : "in a friendly tone";
  }
  enhancedPrompt = `A talking dog video that exactly matches the visual style of the input image. The dog should appear to be speaking ${voiceDescription}, saying: "${config.prompt}"`;
  if (config.action && config.action.trim()) {
    enhancedPrompt += `. The dog ${config.action.trim()}`;
  }
  if (config.background && config.background.trim()) {
    enhancedPrompt += `. The scene is set in ${config.background}`;
  }
  const intentContext = {
    adoption: ". The video has a warm, hopeful feeling suitable for adoption or rescue.",
    apology: ". The video conveys sincerity and heartfelt emotion.",
    celebration: ". The video is joyful and celebratory.",
    funny: ". The video is humorous and entertaining.",
    business: ". The video is professional and clear for promotional purposes.",
    memorial: ". The video is respectful and touching, suitable for a tribute."
  };
  if (config.intent && intentContext[config.intent]) {
    enhancedPrompt += intentContext[config.intent];
  }
  enhancedPrompt += " Preserve the exact visual style, lighting, and quality of the input image. If the image is photorealistic, maintain photorealism. If it's a cartoon or illustration, maintain that style. Use natural lip-sync and realistic movements. The video should be 8 seconds long.";
  return enhancedPrompt;
}
async function generateVideo(config) {
  try {
    const imageBytes = fs2.readFileSync(config.imagePath);
    const imageBase64 = imageBytes.toString("base64");
    const mimeType = config.imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const enhancedPrompt = buildEnhancedPrompt(config);
    console.log("Enhanced prompt:", enhancedPrompt);
    const accessToken = await getAccessToken();
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;
    let finalAspectRatio = config.aspectRatio;
    if (finalAspectRatio === "1:1") {
      console.warn("1:1 aspect ratio is not supported by Vertex AI. Converting to 16:9.");
      finalAspectRatio = "16:9";
    }
    const requestBody = {
      instances: [{
        prompt: enhancedPrompt,
        image: {
          bytesBase64Encoded: imageBase64,
          mimeType
        }
      }],
      parameters: {
        aspectRatio: finalAspectRatio,
        durationSeconds: 8,
        generateAudio: true,
        sampleCount: 1
      }
    };
    console.log("Calling Vertex AI endpoint:", endpoint);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
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
      operation
    };
  } catch (error) {
    console.error("Error generating video:", error);
    throw new Error(`Video generation failed: ${error.message || "Unknown error"}`);
  }
}
async function checkVideoStatus(operationName) {
  try {
    const accessToken = await getAccessToken();
    let fullOperationName;
    if (operationName.startsWith("projects/")) {
      fullOperationName = operationName;
    } else if (operationName.startsWith("models/")) {
      fullOperationName = `projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/${operationName}`;
    } else {
      fullOperationName = `projects/${VERTEX_AI_PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/veo-3.1-generate-preview/operations/${operationName}`;
    }
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:fetchPredictOperation`;
    console.log("Polling operation:", fullOperationName);
    console.log("Using endpoint:", endpoint);
    const requestBody = {
      operationName: fullOperationName
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
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
        status: "processing"
      };
    }
    console.log("Operation completed. Checking for errors...");
    if (updatedOperation.error) {
      const errorMsg = typeof updatedOperation.error === "string" ? updatedOperation.error : updatedOperation.error.message ? String(updatedOperation.error.message) : "Video generation failed";
      console.log("Error found:", errorMsg);
      return {
        status: "failed",
        error: errorMsg
      };
    }
    console.log("Checking for generated video. Full updatedOperation:", JSON.stringify(updatedOperation, null, 2));
    console.log("updatedOperation.response exists?", !!updatedOperation.response);
    console.log("updatedOperation.response:", updatedOperation.response);
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
          error: "No video data in response"
        };
      }
      const uploadsDir = process.env.NODE_ENV === "production" ? path.join("/tmp", "videos") : path.join(process.cwd(), "uploads", "videos");
      if (!fs2.existsSync(uploadsDir)) {
        fs2.mkdirSync(uploadsDir, { recursive: true });
      }
      const videoFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
      const videoPath = path.join(uploadsDir, videoFileName);
      console.log("Saving base64 video data to file");
      const videoBuffer = Buffer.from(videoData.bytesBase64Encoded, "base64");
      fs2.writeFileSync(videoPath, videoBuffer);
      console.log("Video saved to:", videoPath);
      let finalVideoPath = videoPath;
      let finalVideoUrl;
      try {
        const ffmpegAvailable = await isFFmpegAvailable();
        if (ffmpegAvailable) {
          console.log("Adding watermark to video...");
          const watermarkedPath = await addWatermark({
            inputPath: videoPath,
            text: "MakeMyDogTalk.com",
            fontSize: 28,
            opacity: 0.25,
            position: "bottom-center"
          });
          fs2.unlinkSync(videoPath);
          finalVideoPath = watermarkedPath;
          console.log("Watermark added successfully");
        } else {
          console.warn("FFmpeg not available - video will not have watermark. Install FFmpeg with: brew install ffmpeg");
        }
      } catch (watermarkError) {
        console.error("Failed to add watermark:", watermarkError.message);
        console.log("Continuing without watermark...");
      }
      try {
        const gcsFileName = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
        console.log("\u{1F4E4} Uploading video to Google Cloud Storage...");
        console.log("\u{1F4E6} GCS Bucket:", process.env.GCS_BUCKET_NAME || "makemydogtalk-videos");
        console.log("\u{1F4C1} File:", gcsFileName);
        finalVideoUrl = await uploadVideoToGCS(finalVideoPath, gcsFileName);
        fs2.unlinkSync(finalVideoPath);
        console.log("\u2705 Local temp file cleaned up");
        console.log("\u2705 Video available at:", finalVideoUrl);
      } catch (uploadError) {
        console.error("\u274C Failed to upload to GCS:");
        console.error("   Error message:", uploadError.message);
        console.error("   Error stack:", uploadError.stack);
        console.error("   GCS_BUCKET_NAME:", process.env.GCS_BUCKET_NAME);
        console.error("   SERVICE_ACCOUNT_JSON present:", !!process.env.SERVICE_ACCOUNT_JSON);
        console.error("   VERTEX_AI_PROJECT_ID:", process.env.VERTEX_AI_PROJECT_ID);
        throw new Error(`Video generated but failed to upload to cloud storage: ${uploadError.message}. Please check GCS configuration.`);
      }
      console.log("Final video URL:", finalVideoUrl);
      return {
        status: "completed",
        videoUrl: finalVideoUrl
      };
    }
    console.log("No videos found in response");
    return {
      status: "failed",
      error: "No video generated"
    };
  } catch (error) {
    console.error("Error checking video status:", error);
    return {
      status: "failed",
      error: error.message || "Failed to check video status"
    };
  }
}

// server/rateLimiter.ts
var RateLimiter = class {
  limitMap;
  cooldownMs;
  constructor(cooldownHours = 3) {
    this.limitMap = /* @__PURE__ */ new Map();
    this.cooldownMs = cooldownHours * 60 * 60 * 1e3;
  }
  /**
   * Check if an IP address can generate a video
   * @param ipAddress - User's IP address
   * @param isPaid - Whether user paid to skip the line
   * @returns { allowed: boolean, remainingMinutes?: number }
   */
  canGenerate(ipAddress, isPaid = false) {
    if (isPaid) {
      return { allowed: true };
    }
    const entry = this.limitMap.get(ipAddress);
    if (!entry) {
      return { allowed: true };
    }
    const now = Date.now();
    const timeSinceLastGen = now - entry.lastGeneration;
    if (timeSinceLastGen < this.cooldownMs) {
      const remainingMs = this.cooldownMs - timeSinceLastGen;
      const remainingMinutes = Math.ceil(remainingMs / (1e3 * 60));
      return { allowed: false, remainingMinutes };
    }
    return { allowed: true };
  }
  /**
   * Record a video generation
   * @param ipAddress - User's IP address
   */
  recordGeneration(ipAddress) {
    const entry = this.limitMap.get(ipAddress);
    if (entry) {
      entry.lastGeneration = Date.now();
      entry.videoCount++;
    } else {
      this.limitMap.set(ipAddress, {
        lastGeneration: Date.now(),
        videoCount: 1
      });
    }
  }
  /**
   * Get usage stats for an IP
   * @param ipAddress - User's IP address
   */
  getStats(ipAddress) {
    const entry = this.limitMap.get(ipAddress);
    if (!entry) {
      return { videoCount: 0, lastGeneration: null };
    }
    return {
      videoCount: entry.videoCount,
      lastGeneration: new Date(entry.lastGeneration)
    };
  }
  /**
   * Clean up old entries (run periodically)
   * Removes entries older than 24 hours
   */
  cleanup() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1e3;
    for (const [ip, entry] of this.limitMap.entries()) {
      if (now - entry.lastGeneration > oneDayMs) {
        this.limitMap.delete(ip);
      }
    }
  }
};
var rateLimiter = new RateLimiter(3);
setInterval(() => {
  rateLimiter.cleanup();
}, 60 * 60 * 1e3);

// server/stripe.ts
import Stripe from "stripe";

// server/credits.ts
var CreditManager = class {
  creditMap;
  constructor() {
    this.creditMap = /* @__PURE__ */ new Map();
  }
  /**
   * Get credit balance for a user
   * @param userId - User identifier (IP address or user ID)
   * @returns Number of credits remaining
   */
  getCredits(userId) {
    const entry = this.creditMap.get(userId);
    return entry ? entry.credits : 0;
  }
  /**
   * Add credits to a user's balance
   * @param userId - User identifier
   * @param amount - Number of credits to add
   */
  addCredits(userId, amount) {
    const entry = this.creditMap.get(userId);
    if (entry) {
      entry.credits += amount;
      entry.lastUpdated = /* @__PURE__ */ new Date();
    } else {
      this.creditMap.set(userId, {
        credits: amount,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    }
    console.log(`Added ${amount} credits to ${userId}. New balance: ${this.getCredits(userId)}`);
  }
  /**
   * Deduct credits from a user's balance
   * @param userId - User identifier
   * @param amount - Number of credits to deduct (default 1)
   * @returns True if deduction was successful, false if insufficient credits
   */
  deductCredit(userId, amount = 1) {
    const currentCredits = this.getCredits(userId);
    if (currentCredits < amount) {
      console.log(`Insufficient credits for ${userId}. Has ${currentCredits}, needs ${amount}`);
      return false;
    }
    const entry = this.creditMap.get(userId);
    entry.credits -= amount;
    entry.lastUpdated = /* @__PURE__ */ new Date();
    console.log(`Deducted ${amount} credit(s) from ${userId}. Remaining: ${entry.credits}`);
    return true;
  }
  /**
   * Check if user has enough credits
   * @param userId - User identifier
   * @param amount - Number of credits required (default 1)
   * @returns True if user has enough credits
   */
  hasCredits(userId, amount = 1) {
    return this.getCredits(userId) >= amount;
  }
  /**
   * Get detailed credit information for a user
   * @param userId - User identifier
   */
  getCreditInfo(userId) {
    const entry = this.creditMap.get(userId);
    return {
      credits: entry ? entry.credits : 0,
      lastUpdated: entry ? entry.lastUpdated : null
    };
  }
  /**
   * Clean up old credit entries (optional maintenance)
   * Removes entries with 0 credits that haven't been used in 30 days
   */
  cleanup() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    for (const [userId, entry] of this.creditMap.entries()) {
      if (entry.credits === 0 && entry.lastUpdated < thirtyDaysAgo) {
        this.creditMap.delete(userId);
        console.log(`Cleaned up expired credit entry for ${userId}`);
      }
    }
  }
  /**
   * Get total number of users with credits
   */
  getUserCount() {
    return this.creditMap.size;
  }
  /**
   * Get total credits across all users
   */
  getTotalCredits() {
    let total = 0;
    for (const entry of this.creditMap.values()) {
      total += entry.credits;
    }
    return total;
  }
};
var creditManager = new CreditManager();
setInterval(() => {
  creditManager.cleanup();
}, 24 * 60 * 60 * 1e3);
var PRODUCTS = {
  JUMP_LINE: {
    name: "Jump The Line",
    credits: 1,
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_ID_JUMP_LINE
  },
  THREE_PACK: {
    name: "3 Video Pack",
    credits: 3,
    price: 11.99,
    priceId: process.env.STRIPE_PRICE_ID_THREE_PACK
  }
};
function getProductByPriceId(priceId) {
  for (const [key, product] of Object.entries(PRODUCTS)) {
    if (product.priceId === priceId) {
      return product;
    }
  }
  return null;
}

// server/promoCodes.ts
var PromoCodeManager = class {
  promoCodes;
  redemptions;
  // code -> Set of userIds who redeemed
  constructor() {
    this.promoCodes = /* @__PURE__ */ new Map();
    this.redemptions = /* @__PURE__ */ new Map();
    this.initializeDefaultCodes();
  }
  /**
   * Initialize default promo codes
   */
  initializeDefaultCodes() {
    this.addPromoCode({
      code: "FACEBOOK",
      credits: 5,
      description: "Facebook ad source - 5 free video generations"
    });
    this.addPromoCode({
      code: "LINKEDIN",
      credits: 5,
      description: "LinkedIn ad source - 5 free video generations"
    });
    this.addPromoCode({
      code: "INSTAGRAM",
      credits: 5,
      description: "Instagram ad source - 5 free video generations"
    });
    this.addPromoCode({
      code: "TWITTER",
      credits: 5,
      description: "Twitter ad source - 5 free video generations"
    });
  }
  /**
   * Add a new promo code
   */
  addPromoCode(promoCode) {
    const code = promoCode.code.toUpperCase();
    this.promoCodes.set(code, {
      ...promoCode,
      code
    });
    this.redemptions.set(code, /* @__PURE__ */ new Set());
    console.log(`\u2728 Promo code added: ${code} (${promoCode.credits} credits)`);
  }
  /**
   * Remove a promo code
   */
  removePromoCode(code) {
    const upperCode = code.toUpperCase();
    const deleted = this.promoCodes.delete(upperCode);
    this.redemptions.delete(upperCode);
    if (deleted) {
      console.log(`\u{1F5D1}\uFE0F  Promo code removed: ${upperCode}`);
    }
    return deleted;
  }
  /**
   * Validate and redeem a promo code
   * @returns Object with success status, credits awarded, and error message if any
   */
  redeemCode(userId, code) {
    const upperCode = code.toUpperCase();
    const promoCode = this.promoCodes.get(upperCode);
    if (!promoCode) {
      return {
        success: false,
        error: "Invalid promo code"
      };
    }
    if (promoCode.expiresAt && /* @__PURE__ */ new Date() > promoCode.expiresAt) {
      return {
        success: false,
        error: "This promo code has expired"
      };
    }
    const redemptionSet = this.redemptions.get(upperCode);
    if (redemptionSet.has(userId)) {
      return {
        success: false,
        error: "You have already used this promo code"
      };
    }
    if (promoCode.maxRedemptions && redemptionSet.size >= promoCode.maxRedemptions) {
      return {
        success: false,
        error: "This promo code has reached its redemption limit"
      };
    }
    redemptionSet.add(userId);
    console.log(`\u{1F389} Promo code redeemed: ${upperCode} by ${userId} (+${promoCode.credits} credits)`);
    return {
      success: true,
      credits: promoCode.credits,
      message: `Success! ${promoCode.credits} credits added to your account.`
    };
  }
  /**
   * Check if a user has redeemed a specific code
   */
  hasRedeemed(userId, code) {
    const upperCode = code.toUpperCase();
    const redemptionSet = this.redemptions.get(upperCode);
    return redemptionSet ? redemptionSet.has(userId) : false;
  }
  /**
   * Get promo code info (without exposing redemption data)
   */
  getPromoCodeInfo(code) {
    const upperCode = code.toUpperCase();
    const promoCode = this.promoCodes.get(upperCode);
    if (!promoCode) {
      return { valid: false };
    }
    if (promoCode.expiresAt && /* @__PURE__ */ new Date() > promoCode.expiresAt) {
      return { valid: false };
    }
    const redemptionSet = this.redemptions.get(upperCode);
    if (promoCode.maxRedemptions && redemptionSet.size >= promoCode.maxRedemptions) {
      return { valid: false };
    }
    return {
      valid: true,
      credits: promoCode.credits,
      description: promoCode.description
    };
  }
  /**
   * Get statistics for a promo code
   */
  getPromoCodeStats(code) {
    const upperCode = code.toUpperCase();
    const promoCode = this.promoCodes.get(upperCode);
    if (!promoCode) {
      return { exists: false };
    }
    const redemptionSet = this.redemptions.get(upperCode);
    return {
      exists: true,
      totalRedemptions: redemptionSet.size,
      maxRedemptions: promoCode.maxRedemptions,
      credits: promoCode.credits
    };
  }
  /**
   * List all active promo codes (admin function)
   */
  listAllCodes() {
    const codes = [];
    for (const [code, promoCode] of this.promoCodes.entries()) {
      const redemptionSet = this.redemptions.get(code);
      codes.push({
        code,
        credits: promoCode.credits,
        description: promoCode.description,
        redemptions: redemptionSet.size,
        maxRedemptions: promoCode.maxRedemptions
      });
    }
    return codes;
  }
};
var promoCodeManager = new PromoCodeManager();

// server/auth.ts
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";
var oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);
var sessions = /* @__PURE__ */ new Map();
function generateSessionToken() {
  return randomBytes(32).toString("hex");
}
function getAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    // Get refresh token
    scope: scopes,
    prompt: "consent"
    // Force consent screen to get refresh token
  });
}
async function handleOAuthCallback(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Failed to get user payload from ID token");
    }
    let user = await storage.getUserByGoogleId(payload.sub);
    if (!user) {
      const existingEmailUser = await storage.getUserByEmail(payload.email);
      if (existingEmailUser && !existingEmailUser.googleId) {
        user = await storage.updateUser(existingEmailUser.id, {
          googleId: payload.sub,
          picture: payload.picture,
          lastLogin: /* @__PURE__ */ new Date()
        });
      } else if (existingEmailUser) {
        user = existingEmailUser;
      } else {
        user = await storage.createOAuthUser({
          email: payload.email,
          googleId: payload.sub,
          name: payload.name,
          picture: payload.picture
        });
      }
    } else {
      await storage.updateUser(user.id, { lastLogin: /* @__PURE__ */ new Date() });
    }
    const token = generateSessionToken();
    const session = {
      userId: user.id,
      token,
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
      // 7 days
    };
    sessions.set(token, session);
    console.log(`User logged in via Google: ${user.email}`);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  } catch (error) {
    console.error("OAuth callback error:", error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
async function verifySessionToken(token) {
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt < /* @__PURE__ */ new Date()) {
    sessions.delete(token);
    return null;
  }
  const user = await storage.getUser(session.userId);
  if (!user) {
    sessions.delete(token);
    return null;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
function logoutSession(token) {
  sessions.delete(token);
  console.log(`Session logged out`);
}
function cleanupExpiredSessions() {
  const now = /* @__PURE__ */ new Date();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}
setInterval(cleanupExpiredSessions, 60 * 60 * 1e3);

// server/emailAuth.ts
import bcrypt from "bcrypt";
import { randomBytes as randomBytes2 } from "crypto";
var SALT_ROUNDS = 10;
var sessions2 = /* @__PURE__ */ new Map();
function generateSessionToken2() {
  return randomBytes2(32).toString("hex");
}
async function signupWithEmail(email, password, name) {
  const validation = insertUserSchema.safeParse({ email, password, name });
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new Error("An account with this email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await storage.createUser({
    email,
    password: hashedPassword,
    name
  });
  const token = generateSessionToken2();
  const session = {
    userId: user.id,
    token,
    createdAt: /* @__PURE__ */ new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
    // 7 days
  };
  sessions2.set(token, session);
  console.log(`New user registered: ${email}`);
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}
async function loginWithEmail(email, password) {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  if (!user.password) {
    throw new Error("This account uses Google sign-in. Please log in with Google.");
  }
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }
  await storage.updateUser(user.id, { lastLogin: /* @__PURE__ */ new Date() });
  const token = generateSessionToken2();
  const session = {
    userId: user.id,
    token,
    createdAt: /* @__PURE__ */ new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
    // 7 days
  };
  sessions2.set(token, session);
  console.log(`User logged in: ${email}`);
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}
async function verifySessionToken2(token) {
  const session = sessions2.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt < /* @__PURE__ */ new Date()) {
    sessions2.delete(token);
    return null;
  }
  const user = await storage.getUser(session.userId);
  if (!user) {
    sessions2.delete(token);
    return null;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
function logoutSession2(token) {
  sessions2.delete(token);
  console.log(`Session logged out`);
}
function cleanupExpiredSessions2() {
  const now = /* @__PURE__ */ new Date();
  for (const [token, session] of sessions2.entries()) {
    if (session.expiresAt < now) {
      sessions2.delete(token);
    }
  }
}
setInterval(cleanupExpiredSessions2, 60 * 60 * 1e3);

// server/middleware.ts
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to access this resource"
      });
    }
    let user = await verifySessionToken(token);
    if (!user) {
      user = await verifySessionToken2(token);
    }
    if (!user) {
      return res.status(401).json({
        error: "Invalid or expired session",
        message: "Please log in again"
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: error.message
    });
  }
}
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    if (token) {
      let user = await verifySessionToken(token);
      if (!user) {
        user = await verifySessionToken2(token);
      }
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
}

// server/stripe.ts
import express from "express";
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia"
});
function registerStripeRoutes(app2) {
  app2.post("/api/create-checkout-session", optionalAuth, async (req, res) => {
    try {
      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }
      const product = getProductByPriceId(priceId);
      if (!product) {
        return res.status(400).json({ error: "Invalid price ID" });
      }
      const userId = req.user?.id || req.ip || req.socket.remoteAddress || "unknown";
      const userEmail = req.user?.email;
      let stripeCustomerId = req.user?.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: req.user?.name,
          metadata: { userId }
        });
        stripeCustomerId = customer.id;
        if (req.user) {
          await storage.updateUser(req.user.id, { stripeCustomerId });
        }
      }
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: "payment",
        return_url: `${req.protocol}://${req.get("host")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        customer: stripeCustomerId,
        // Associate with customer
        customer_update: {
          address: "auto"
        },
        metadata: {
          userId,
          userEmail: userEmail || "",
          priceId,
          productName: product.name,
          credits: product.credits.toString()
        }
      });
      console.log(`Created checkout session for ${userId}: ${session.id}`);
      res.json({ clientSecret: session.client_secret });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });
  app2.get("/api/session-status/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      res.json({
        status: session.status,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email
      });
    } catch (error) {
      console.error("Error retrieving session:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve session" });
    }
  });
  app2.post(
    "/api/stripe-webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn("STRIPE_WEBHOOK_SECRET not set - webhook verification disabled");
      }
      let event;
      try {
        if (webhookSecret) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          event = JSON.parse(req.body.toString());
        }
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      console.log(`Received webhook event: ${event.type}`);
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata?.userId;
          const priceId = session.metadata?.priceId;
          const credits = parseInt(session.metadata?.credits || "0", 10);
          if (!userId || !credits) {
            console.error("Missing metadata in checkout session:", session.id);
            break;
          }
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUser(userId, {
              credits: (user.credits || 0) + credits
            });
            console.log(`\u2705 Payment successful! Added ${credits} credits to ${user.email}. New balance: ${(user.credits || 0) + credits}`);
          } else {
            creditManager.addCredits(userId, credits);
            console.log(`\u2705 Payment successful! Added ${credits} credits to ${userId} (in-memory)`);
          }
          console.log(`Session ID: ${session.id}, Amount: ${session.amount_total ? session.amount_total / 100 : "N/A"}`);
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          console.error(`\u274C Payment failed: ${paymentIntent.id}`);
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      res.json({ received: true });
    }
  );
  app2.get("/api/stripe-config", (req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  });
  app2.get("/api/credits", optionalAuth, async (req, res) => {
    try {
      if (req.user) {
        const user = await storage.getUser(req.user.id);
        res.json({
          credits: user?.credits || 0,
          lastUpdated: user?.createdAt || null,
          user: { email: user?.email, name: user?.name }
        });
      } else {
        const userId = req.ip || req.socket.remoteAddress || "unknown";
        const creditInfo = creditManager.getCreditInfo(userId);
        res.json({
          credits: creditInfo.credits,
          lastUpdated: creditInfo.lastUpdated,
          user: null
        });
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ error: error.message || "Failed to fetch credits" });
    }
  });
  app2.post("/api/redeem-promo-code", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Promo code is required" });
      }
      const userId = req.user.id;
      const result = promoCodeManager.redeemCode(userId, code);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await storage.updateUser(userId, {
        credits: (currentUser.credits || 0) + result.credits
      });
      const newBalance = updatedUser?.credits || 0;
      res.json({
        success: true,
        credits: result.credits,
        message: result.message,
        newBalance
      });
    } catch (error) {
      console.error("Error redeeming promo code:", error);
      res.status(500).json({ error: error.message || "Failed to redeem promo code" });
    }
  });
  app2.post("/api/create-billing-portal-session", optionalAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    let stripeCustomerId = req.user.stripeCustomerId;
    try {
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: { userId: req.user.id }
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(req.user.id, { stripeCustomerId });
        console.log(`Created Stripe customer ${stripeCustomerId} for user ${req.user.email}`);
      }
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${req.protocol}://${req.get("host")}/dashboard`
      });
      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Error creating billing portal session:", error);
      res.status(500).json({ error: "Failed to create billing portal session" });
    }
  });
}

// server/authRoutes.ts
import { Router } from "express";
var router = Router();
router.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Email, password, and name are required"
      });
    }
    const { user, token } = await signupWithEmail(email, password, name);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      sameSite: "lax",
      path: "/"
    });
    res.json({
      success: true,
      user,
      token,
      message: "Account created successfully"
    });
  } catch (error) {
    console.error("[Signup Error]", error);
    res.status(400).json({
      success: false,
      error: error.message || "Signup failed"
    });
  }
});
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Email and password are required"
      });
    }
    const { user, token } = await loginWithEmail(email, password);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      sameSite: "lax",
      path: "/"
    });
    res.json({
      success: true,
      user,
      token,
      message: "Logged in successfully"
    });
  } catch (error) {
    console.error("[Login Error]", error);
    res.status(400).json({
      success: false,
      error: error.message || "Login failed"
    });
  }
});
router.get("/auth/google", (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).send(`Authentication error: ${error.message}`);
  }
});
async function processOAuthCallback(req, res) {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.status(400).json({
        success: false,
        error: "OAuth authentication failed",
        details: error
      });
    }
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing authorization code"
      });
    }
    const { user, token } = await handleOAuthCallback(code);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      sameSite: "lax",
      path: "/"
      // Ensure cookie is available for all routes
    });
    res.redirect(`/?auth=success`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: error.message
    });
  }
}
router.get("/auth/google/callback", processOAuthCallback);
router.get("/auth/callback", processOAuthCallback);
var authRoutes_default = router;

// server/routes.ts
var uploadDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : "uploads/temp/";
if (!fs3.existsSync(uploadDir)) {
  try {
    fs3.mkdirSync(uploadDir, { recursive: true });
    console.log(`\u2705 Created upload directory: ${uploadDir}`);
  } catch (error) {
    console.error(`\u274C Failed to create upload directory: ${uploadDir}`, error);
  }
}
var multerStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    if (!fs3.existsSync(uploadDir)) {
      fs3.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path2.extname(file.originalname));
  }
});
var upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});
async function registerRoutes(app2) {
  app2.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.use(authRoutes_default);
  app2.get("/auth/me", optionalAuth, (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        user: req.user
      });
    } else {
      res.status(401).json({ success: false, error: "Not authenticated" });
    }
  });
  app2.post("/auth/logout", optionalAuth, (req, res) => {
    try {
      const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);
      if (token) {
        logoutSession(token);
        logoutSession2(token);
      }
      res.clearCookie("auth_token");
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ success: false, error: "Logout failed" });
    }
  });
  registerStripeRoutes(app2);
  app2.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.path.endsWith(".mp4")) {
      res.header("Content-Type", "video/mp4");
    }
    next();
  }, express2.static(path2.join(process.cwd(), "uploads")));
  app2.post("/api/generate-video", optionalAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      if (!req.body.prompt) {
        return res.status(400).json({ error: "No prompt provided" });
      }
      const prompt = req.body.prompt;
      if (prompt.length > 300) {
        return res.status(400).json({ error: "Prompt must be 300 characters or less" });
      }
      if (prompt.length < 5) {
        return res.status(400).json({ error: "Prompt must be at least 5 characters" });
      }
      const userId = req.user?.id || req.ip || req.socket.remoteAddress || "unknown";
      const useCredit = req.body.useCredit === "true" || req.body.useCredit === true;
      const adminEmail = process.env.ADMIN_EMAIL;
      const isAdmin = !!(adminEmail && req.user && req.user.email === adminEmail);
      console.log(`Video generation request from ${req.user ? `user ${req.user.email}` : `IP ${userId}`}${isAdmin ? " (Admin)" : ""}`);
      if (isAdmin) {
        console.log(`Admin user ${req.user.email} bypassing credit and rate limits.`);
      } else {
        let hasCredits = false;
        let creditBalance = 0;
        if (req.user) {
          const currentUser = await storage.getUser(req.user.id);
          creditBalance = currentUser?.credits || 0;
          hasCredits = creditBalance > 0;
        } else {
          hasCredits = creditManager.hasCredits(userId);
          creditBalance = creditManager.getCredits(userId);
        }
        if (useCredit && hasCredits) {
          if (req.user) {
            const currentUser = await storage.getUser(req.user.id);
            if (!currentUser || (currentUser.credits || 0) < 1) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            const updatedUser = await storage.updateUser(req.user.id, {
              credits: currentUser.credits - 1
            });
            if (!updatedUser) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "Could not update credit balance"
              });
            }
            req.user = updatedUser;
            console.log(`User ${req.user.email} used a credit. Remaining: ${updatedUser.credits}`);
          } else {
            const deducted = creditManager.deductCredit(userId);
            if (!deducted) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            console.log(`Anonymous user ${userId} used a credit. Remaining: ${creditManager.getCredits(userId)}`);
          }
        } else {
          const rateLimitCheck = rateLimiter.canGenerate(userId, false);
          if (!rateLimitCheck.allowed) {
            const hours = Math.floor(rateLimitCheck.remainingMinutes / 60);
            const minutes = rateLimitCheck.remainingMinutes % 60;
            const timeString = hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}` : `${minutes} minute${minutes !== 1 ? "s" : ""}`;
            return res.status(429).json({
              error: "Rate limit exceeded",
              message: `Please wait ${timeString} or purchase credits to generate now.`,
              remainingMinutes: rateLimitCheck.remainingMinutes,
              credits: creditBalance,
              canPurchase: true
            });
          }
        }
      }
      const imagePath = req.file.path;
      const intent = req.body.intent || "";
      const tone = req.body.tone || "friendly";
      const background = req.body.background || "";
      const aspectRatio = req.body.aspectRatio;
      const voiceStyle = req.body.voiceStyle || "";
      const action = req.body.action || "";
      if (!aspectRatio || !["16:9", "9:16", "1:1"].includes(aspectRatio)) {
        fs3.unlink(imagePath, (err) => {
          if (err) console.error("Failed to cleanup temp file on validation error:", err);
        });
        return res.status(400).json({ error: `Invalid or missing aspectRatio. Received: ${aspectRatio}` });
      }
      console.log(`Generating video with prompt: "${prompt}", intent: "${intent}", tone: "${tone}", voiceStyle: "${voiceStyle}", action: "${action}", background: "${background}", aspectRatio: "${aspectRatio}"`);
      const result = await generateVideo({
        prompt,
        imagePath,
        intent,
        tone,
        background,
        aspectRatio,
        voiceStyle,
        action
      });
      const operation = await storage.createVideoOperation({
        operationId: result.operation.name || null,
        status: "processing",
        prompt,
        imagePath,
        videoUrl: null,
        error: null,
        userId: req.user ? req.user.id : null
        // Add userId
      });
      if (!useCredit && !isAdmin) {
        rateLimiter.recordGeneration(userId);
        console.log(`Rate limit recorded for user: ${userId}`);
      } else {
        console.log(`Credit used or admin bypass - rate limit not recorded for user: ${userId}`);
      }
      fs3.unlink(imagePath, (err) => {
        if (err) console.error("Failed to cleanup temp file:", err);
      });
      res.json({
        id: operation.id,
        status: "processing"
      });
    } catch (error) {
      console.error("Error in /api/generate-video:", error);
      res.status(500).json({ error: error.message || "Failed to start video generation" });
    }
  });
  app2.get("/api/video-status/:id", optionalAuth, async (req, res) => {
    try {
      const operationId = req.params.id;
      const operation = await storage.getVideoOperation(operationId);
      if (!operation) {
        return res.status(404).json({ error: "Operation not found" });
      }
      if (operation.status === "completed") {
        return res.json({
          status: "completed",
          videoUrl: operation.videoUrl
        });
      }
      if (operation.status === "failed") {
        return res.json({
          status: "failed",
          error: operation.error
        });
      }
      if (operation.operationId) {
        const statusResult = await checkVideoStatus(operation.operationId);
        await storage.updateVideoOperation(operationId, {
          status: statusResult.status,
          videoUrl: statusResult.videoUrl || null,
          error: statusResult.error || null
        });
        res.json({
          status: statusResult.status,
          videoUrl: statusResult.videoUrl,
          error: statusResult.error
        });
      } else {
        res.json({
          status: operation.status,
          videoUrl: operation.videoUrl,
          error: operation.error
        });
      }
    } catch (error) {
      console.error("Error in /api/video-status:", error);
      res.status(500).json({ error: error.message || "Failed to check video status" });
    }
  });
  app2.get("/api/my-videos", optionalAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const videos = await storage.getVideosByUserId(req.user.id);
      res.json(videos);
    } catch (error) {
      console.error("Error in /api/my-videos:", error);
      res.status(500).json({ error: error.message || "Failed to fetch user videos" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vercel.ts
import path3 from "path";
import fs4 from "fs";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(cookieParser());
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
console.log("Initializing Vercel serverless function...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("BUILD_ID: v3.0.0-FORCE-REBUILD-" + Date.now());
try {
  console.log("\u{1FAA3} Initializing Google Cloud Storage...");
  await ensureBucketExists();
  console.log("\u2705 GCS initialized successfully");
} catch (error) {
  console.error("\u274C Failed to initialize GCS:", error.message);
  console.warn("\u26A0\uFE0F  App will continue, but video uploads may fail");
}
await registerRoutes(app);
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
console.log("Setting up static file serving for Vercel...");
var distPath = path3.resolve(__dirname, "public");
if (!fs4.existsSync(distPath)) {
  console.warn(`Static files directory not found: ${distPath}`);
} else {
  console.log(`Serving static files from: ${distPath}`);
  app.use(express3.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.startsWith("/uploads")) {
      return next();
    }
    const indexPath = path3.resolve(distPath, "index.html");
    if (fs4.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Static files not found");
    }
  });
}
console.log("\u2705 Vercel serverless function initialized");
var vercel_default = app;
export {
  vercel_default as default
};
