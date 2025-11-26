var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, insertUserSchema, insertOAuthUserSchema, videoOperations, insertVideoOperationSchema, waitlistEmails, insertWaitlistEmailSchema, transactions, insertTransactionSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
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
      adminCredits: integer("admin_credits").notNull().default(0),
      // Credits given by admin (can be revoked)
      stripeCustomerId: text("stripe_customer_id"),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      lastLogin: timestamp("last_login")
    });
    insertUserSchema = createInsertSchema(users, {
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters").optional(),
      name: z.string().min(1, "Name is required")
    }).pick({
      email: true,
      password: true,
      name: true
    });
    insertOAuthUserSchema = createInsertSchema(users, {
      email: z.string().email("Invalid email address"),
      name: z.string().min(1, "Name is required"),
      googleId: z.string().min(1, "Google ID is required")
    }).pick({
      email: true,
      googleId: true,
      name: true,
      picture: true
    });
    videoOperations = pgTable("video_operations", {
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
    insertVideoOperationSchema = createInsertSchema(videoOperations).omit({
      id: true,
      createdAt: true
    });
    waitlistEmails = pgTable("waitlist_emails", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull().unique(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertWaitlistEmailSchema = createInsertSchema(waitlistEmails, {
      email: z.string().email("Invalid email address")
    }).pick({
      email: true
    });
    transactions = pgTable("transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: text("user_id").notNull(),
      // Reference to users table
      stripeSessionId: text("stripe_session_id").notNull().unique(),
      stripePaymentIntentId: text("stripe_payment_intent_id"),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      // Amount in dollars
      currency: text("currency").notNull().default("usd"),
      credits: integer("credits").notNull(),
      // Number of credits purchased
      productName: text("product_name").notNull(),
      // e.g., "1 Credit", "3 Credits"
      status: text("status").notNull(),
      // e.g., "completed", "pending", "failed"
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertTransactionSchema = createInsertSchema(transactions).omit({
      id: true,
      createdAt: true
    });
  }
});

// api/serverless.ts
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
init_schema();
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
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
init_schema();
import { eq, desc } from "drizzle-orm";
var MemStorage = class {
  users;
  videoOperations;
  waitlistEmails;
  transactions;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.videoOperations = /* @__PURE__ */ new Map();
    this.waitlistEmails = /* @__PURE__ */ new Map();
    this.transactions = /* @__PURE__ */ new Map();
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
  async addWaitlistEmail(email) {
    if (this.waitlistEmails.has(email)) {
      throw new Error("Email already exists in waitlist");
    }
    const id = randomUUID();
    const waitlistEmail = {
      id,
      email,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.waitlistEmails.set(email, waitlistEmail);
    return waitlistEmail;
  }
  async createTransaction(insertTransaction) {
    const id = randomUUID();
    const transaction = {
      id,
      ...insertTransaction,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  async getAllTransactions() {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  async getTransactionsByUserId(userId) {
    return Array.from(this.transactions.values()).filter((t) => t.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};
var DbStorage = class {
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result?.[0] || void 0;
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result?.[0] || void 0;
  }
  async getUserByGoogleId(googleId) {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result?.[0] || void 0;
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
    return result?.[0];
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
    return result?.[0];
  }
  async updateVideoOperation(id, updates) {
    const result = await db.update(videoOperations).set(updates).where(eq(videoOperations.id, id)).returning();
    return result?.[0];
  }
  async getVideosByUserId(userId) {
    return await db.select().from(videoOperations).where(eq(videoOperations.userId, userId));
  }
  async addWaitlistEmail(email) {
    const result = await db.insert(waitlistEmails).values({
      email
    }).returning();
    return result[0];
  }
  async createTransaction(insertTransaction) {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }
  async getAllTransactions() {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }
  async getTransactionsByUserId(userId) {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
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
var storage2 = null;
var isGCSConfigured = false;
try {
  if (process.env.SERVICE_ACCOUNT_JSON && process.env.VERTEX_AI_PROJECT_ID) {
    storage2 = new Storage({
      credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
      projectId: process.env.VERTEX_AI_PROJECT_ID
    });
    isGCSConfigured = true;
    console.log("\u2705 Google Cloud Storage configured successfully");
  } else {
    console.warn("\u274C Google Cloud Storage not configured. Video uploads will be unavailable.");
  }
} catch (error) {
  console.error("\u26A0\uFE0F  Failed to initialize Google Cloud Storage:", error);
  console.warn("Video uploads will be unavailable.");
}
var BUCKET_NAME = process.env.GCS_BUCKET_NAME || "makemydogtalk-videos";
async function uploadVideoToGCS(localFilePath, destinationFileName) {
  if (!isGCSConfigured || !storage2) {
    throw new Error("Google Cloud Storage is not configured. Please set SERVICE_ACCOUNT_JSON and VERTEX_AI_PROJECT_ID.");
  }
  try {
    console.log(`\u{1F4E4} Uploading video to GCS: ${destinationFileName}`);
    const bucket = storage2.bucket(BUCKET_NAME);
    await bucket.upload(localFilePath, {
      destination: destinationFileName,
      metadata: {
        contentType: "video/mp4",
        cacheControl: "public, max-age=31536000"
        // Cache for 1 year
      }
      // Don't set public: true because uniform bucket-level access is enabled
      // Instead, the bucket should have allUsers permission set at the bucket level
    });
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationFileName}`;
    console.log(`\u2705 Video uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("\u274C Error uploading video to GCS:", error);
    throw new Error(`Failed to upload video to cloud storage: ${error.message}`);
  }
}

// server/validation.ts
import { z as z2 } from "zod";
var VALIDATION_LIMITS = {
  MAX_PROMPT_LENGTH: 500,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png"],
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png"],
  MIN_PROMPT_LENGTH: 5,
  MAX_BACKGROUND_LENGTH: 100,
  MAX_ACTION_LENGTH: 100,
  MAX_VOICE_STYLE_LENGTH: 50
};
var videoGenerationSchema = z2.object({
  prompt: z2.string().min(VALIDATION_LIMITS.MIN_PROMPT_LENGTH, "Prompt must be at least 5 characters").max(VALIDATION_LIMITS.MAX_PROMPT_LENGTH, "Prompt must be less than 500 characters").refine(
    (val) => val.trim().length > 0,
    "Prompt cannot be empty or only whitespace"
  ).refine(
    (val) => {
      const isMultiDog = /Dog\s+\d+:/i.test(val);
      if (isMultiDog) {
        const dogSections = val.split(/Dog\s+\d+:/i);
        const dogDialogues = dogSections.slice(1);
        return dogDialogues.every((dialogue) => dialogue.trim().length > 0);
      }
      return true;
    },
    'Each dog must have dialogue. Format: "Dog 1: [dialogue] Dog 2: [dialogue]"'
  ),
  intent: z2.enum(["adoption", "apology", "celebration", "funny", "business", "memorial", ""]).optional(),
  tone: z2.enum(["friendly", "calm", "excited", "sad", "funny", "professional", ""]).optional(),
  voiceStyle: z2.string().max(VALIDATION_LIMITS.MAX_VOICE_STYLE_LENGTH, "Voice style must be less than 50 characters").optional(),
  action: z2.string().max(VALIDATION_LIMITS.MAX_ACTION_LENGTH, "Action must be less than 100 characters").optional(),
  background: z2.string().max(VALIDATION_LIMITS.MAX_BACKGROUND_LENGTH, "Background must be less than 100 characters").optional(),
  aspectRatio: z2.enum(["16:9", "9:16", "1:1"]).optional()
});
function validateImageFile(file) {
  if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${VALIDATION_LIMITS.MAX_FILE_SIZE_MB}MB limit`
    };
  }
  if (!VALIDATION_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Only JPEG and PNG images are allowed`
    };
  }
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !VALIDATION_LIMITS.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Only .jpg, .jpeg, and .png are allowed`
    };
  }
  return { valid: true };
}
function sanitizeError(error) {
  const errorMessage = error?.message || "An unexpected error occurred";
  if (errorMessage.includes("sensitive words") || errorMessage.includes("Responsible AI practices") || errorMessage.includes("violate") || errorMessage.includes("content policy") || errorMessage.includes("Invalid aspect ratio") || errorMessage.includes("Invalid") && errorMessage.includes("ratio")) {
    return errorMessage;
  }
  const sensitivePatterns = [
    /projects\/[^\/]+/g,
    // GCP project IDs
    /service-account-[^@]+@[^\.]+\.iam\.gserviceaccount\.com/g,
    // Service account emails
    /gs:\/\/[^\/]+/g,
    // GCS bucket paths
    /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g,
    // Bearer tokens
    /AIza[0-9A-Za-z\-_]{35}/g,
    // API keys
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi
    // UUIDs/operation IDs
  ];
  let sanitized = errorMessage;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  if (sanitized.includes("PERMISSION_DENIED") || sanitized.includes("403")) {
    return "Service configuration error. Please contact support.";
  }
  if (sanitized.includes("QUOTA_EXCEEDED") || sanitized.includes("429")) {
    return "Service is temporarily busy. Please try again in a few minutes.";
  }
  if (sanitized.includes("INVALID_ARGUMENT") || sanitized.includes("400")) {
    return "Invalid request. Please check your input and try again.";
  }
  if (sanitized.includes("NOT_FOUND") || sanitized.includes("404")) {
    return "Resource not found. Please try again.";
  }
  return "An error occurred while processing your request. Please try again later.";
}

// server/veo.ts
var serviceAccountCredentials;
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccountCredentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    console.log("\u2705 Using SERVICE_ACCOUNT_JSON from environment");
  } catch (error) {
    console.error("\u274C Failed to parse SERVICE_ACCOUNT_JSON");
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
var PROMPT_VERSION = "2.1";
var MIN_DURATION_SECONDS = 4;
var MAX_DURATION_SECONDS = 8;
var CHARS_PER_SECOND = 15;
function calculateDuration(text2) {
  const calculated = Math.ceil(text2.length / CHARS_PER_SECOND);
  const duration = Math.max(MIN_DURATION_SECONDS, Math.min(MAX_DURATION_SECONDS, calculated));
  console.log(`\u23F1\uFE0F  Duration calculation: ${text2.length} chars \xF7 ${CHARS_PER_SECOND} chars/sec = ${calculated}s \u2192 clamped to ${duration}s`);
  return duration;
}
function buildVoiceDescription(tone, voiceStyle) {
  const parts = [];
  const toneDescriptions = {
    excited: "energetic, fast-paced, enthusiastic voice",
    funny: "comedic, playful voice with good timing",
    professional: "clear, articulate, professional voice",
    friendly: "warm, casual, approachable voice",
    calm: "soothing, measured, relaxed voice",
    sad: "soft, emotional, slower-paced voice"
  };
  if (tone && toneDescriptions[tone]) {
    parts.push(toneDescriptions[tone]);
  }
  if (voiceStyle && voiceStyle.trim().length > 0) {
    parts.push(voiceStyle.trim());
  }
  if (parts.length === 0) {
    return "natural, clear voice";
  }
  return parts.join(", ");
}
function buildEnhancedPrompt(config, duration) {
  const isMultiDog = /Dog\s+\d+:/i.test(config.prompt);
  const voiceDescription = buildVoiceDescription(config.tone, config.voiceStyle);
  const userAction = config.action && config.action.trim().length > 0 ? config.action.trim() : "";
  const orientationDesc = config.aspectRatio === "9:16" ? "Vertical 9:16 orientation (for TikTok/Reels/Shorts)." : config.aspectRatio === "1:1" ? "Square 1:1 orientation." : "Horizontal 16:9 orientation.";
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
- If the source photo aspect ratio differs from the target ${config.aspectRatio || "16:9"} format, intelligently extend or crop the scene to fill the frame completely.
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
  let requestDetails = `

Voice style: ${voiceDescription}`;
  if (userAction) {
    requestDetails += `

Requested action: ${userAction}`;
  }
  requestDetails += `

${isMultiDog ? "Dialogue (multiple dogs speaking in sequence):" : "Dialogue (what the dog says):"}
"${config.prompt}"

Duration: ${duration} seconds.
${orientationDesc}`;
  const fullPrompt = systemPrompt + requestDetails;
  console.log(`\u{1F3AC} Generated prompt (v${PROMPT_VERSION}):`);
  console.log("---START PROMPT---");
  console.log(fullPrompt);
  console.log("---END PROMPT---");
  return fullPrompt;
}
async function generateVideo(config) {
  try {
    const imageBytes = fs2.readFileSync(config.imagePath);
    const imageBase64 = imageBytes.toString("base64");
    const mimeType = config.imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    const duration = calculateDuration(config.prompt);
    const enhancedPrompt = buildEnhancedPrompt(config, duration);
    const accessToken = await getAccessToken();
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${VERTEX_AI_PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning`;
    let finalAspectRatio = config.aspectRatio === "1:1" ? "9:16" : config.aspectRatio || "16:9";
    if (config.aspectRatio === "1:1") {
      console.log("\u26A0\uFE0F  1:1 aspect ratio not supported by Veo 3.1, using 9:16 instead");
    }
    console.log("\u{1F4D0} Target aspect ratio:", finalAspectRatio, "(source image may be extended/cropped to fit)");
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
        durationSeconds: duration,
        generateAudio: true,
        sampleCount: 1
      }
    };
    console.log(`\u{1F4CA} Generation Parameters (Prompt v${PROMPT_VERSION}):`);
    console.log(`   - Duration: ${duration}s (fixed)`);
    console.log(`   - Aspect Ratio: ${finalAspectRatio}`);
    console.log(`   - Generate Audio: true`);
    console.log(`   - Sample Count: 1`);
    console.log(`   - Voice Style: ${buildVoiceDescription(config.tone, config.voiceStyle)}`);
    console.log(`   - Action (user input): ${config.action || "none"}`);
    console.log(`   - Dialogue Length: ${config.prompt.length} chars`);
    console.log("Initiating video generation request...");
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
      console.error("\u274C Vertex AI API Error Response:");
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
      operation
    };
  } catch (error) {
    console.error("RAW Error generating video:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    const sanitizedMsg = sanitizeError(error);
    console.error("SANITIZED Error generating video:", sanitizedMsg);
    throw new Error(sanitizedMsg);
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
    console.log("Polling video generation status...");
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
        status: "processing"
      };
    }
    if (updatedOperation.error) {
      const errorMsg = typeof updatedOperation.error === "string" ? updatedOperation.error : updatedOperation.error.message ? String(updatedOperation.error.message) : "Video generation failed";
      const sanitizedError = sanitizeError({ message: errorMsg });
      console.error("Video generation failed:", sanitizedError);
      return {
        status: "failed",
        error: sanitizedError
      };
    }
    const videos = updatedOperation.response?.videos;
    if (videos && videos.length > 0) {
      const videoData = videos[0];
      if (!videoData.bytesBase64Encoded) {
        console.error("No video data in response");
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
      console.log("Processing generated video...");
      const videoBuffer = Buffer.from(videoData.bytesBase64Encoded, "base64");
      fs2.writeFileSync(videoPath, videoBuffer);
      console.log("Video file created successfully");
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
        console.log("Uploading video to cloud storage...");
        finalVideoUrl = await uploadVideoToGCS(finalVideoPath, gcsFileName);
        fs2.unlinkSync(finalVideoPath);
        console.log("Video uploaded successfully");
      } catch (uploadError) {
        const sanitizedError = sanitizeError(uploadError);
        console.error("Failed to upload video:", sanitizedError);
        throw new Error(`Video generated but failed to upload to cloud storage. Please check configuration.`);
      }
      return {
        status: "completed",
        videoUrl: finalVideoUrl
      };
    }
    console.error("No video data in API response");
    return {
      status: "failed",
      error: "No video generated"
    };
  } catch (error) {
    const sanitizedMsg = sanitizeError(error);
    console.error("Error checking video status:", sanitizedMsg);
    return {
      status: "failed",
      error: sanitizedMsg
    };
  }
}

// server/rateLimiter.ts
var rateLimitStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1e3);
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
    const entries = Array.from(this.limitMap.entries());
    for (const [ip, entry] of entries) {
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
  // One-time purchases
  THREE_PACK: {
    name: "3 Videos",
    credits: 3,
    price: 14.99,
    priceId: process.env.STRIPE_PRICE_ID_3 || "price_1SWKdMJCeMRgqWWrfiNOA95r",
    type: "one_time"
  },
  TEN_PACK: {
    name: "10 Videos",
    credits: 10,
    price: 19.99,
    priceId: process.env.STRIPE_PRICE_ID_10 || "price_1SV2gfJCeMRgqWWr1l4nFBiX",
    type: "one_time"
  },
  // Subscription plans
  MONTHLY_SUBSCRIPTION: {
    name: "20 Videos/Month",
    credits: 20,
    price: 29.99,
    priceId: process.env.STRIPE_20_MONTHLY || "price_monthly_placeholder",
    type: "subscription",
    interval: "month"
  },
  ANNUAL_SUBSCRIPTION: {
    name: "240 Videos/Year",
    credits: 240,
    price: 299.99,
    priceId: process.env.STRIPE_299_ANNUAL || "price_annual_placeholder",
    type: "subscription",
    interval: "year",
    popular: true
    // Mark as best value
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
  usersWithPromoCode;
  // Track all users who have ever redeemed ANY promo code
  constructor() {
    this.promoCodes = /* @__PURE__ */ new Map();
    this.redemptions = /* @__PURE__ */ new Map();
    this.usersWithPromoCode = /* @__PURE__ */ new Set();
    this.initializeDefaultCodes();
  }
  /**
   * Initialize default promo codes
   */
  initializeDefaultCodes() {
    this.addPromoCode({
      code: "FACEBOOK",
      credits: 3,
      description: "Facebook ad source - 3 free video generations"
    });
    this.addPromoCode({
      code: "LINKEDIN",
      credits: 3,
      description: "LinkedIn ad source - 3 free video generations"
    });
    this.addPromoCode({
      code: "INSTAGRAM",
      credits: 3,
      description: "Instagram ad source - 3 free video generations"
    });
    this.addPromoCode({
      code: "TWITTER",
      credits: 3,
      description: "Twitter ad source - 3 free video generations"
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
    if (this.usersWithPromoCode.has(userId)) {
      return {
        success: false,
        error: "You have already used a promo code. Only one promo code is allowed per account."
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
    this.usersWithPromoCode.add(userId);
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
   * Check if a user has redeemed ANY promo code
   */
  hasRedeemedAnyCode(userId) {
    return this.usersWithPromoCode.has(userId);
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
function getRedirectUri() {
  return process.env.OAUTH_REDIRECT_URI || "http://localhost:5000/auth/google/callback";
}
var redirectUri = getRedirectUri();
console.log(`\u2705 OAuth redirect URI configured: ${redirectUri}`);
var oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
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
      const updatedUser = await storage.updateUser(user.id, { lastLogin: /* @__PURE__ */ new Date() });
      if (updatedUser) {
        user = updatedUser;
      }
    }
    if (!user) {
      throw new Error("Failed to create or retrieve user");
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
  const expiredTokens = [];
  sessions.forEach((session, token) => {
    if (session.expiresAt < now) {
      expiredTokens.push(token);
    }
  });
  expiredTokens.forEach((token) => sessions.delete(token));
}
setInterval(cleanupExpiredSessions, 60 * 60 * 1e3);

// server/emailAuth.ts
import bcrypt from "bcrypt";
init_schema();
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
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia"
}) : null;
var isStripeConfigured = !!stripe;
function registerStripeRoutes(app2) {
  app2.post("/api/create-checkout-session", optionalAuth, async (req, res) => {
    if (!isStripeConfigured) {
      return res.status(503).json({ error: "Payment processing is not configured. Please contact the administrator." });
    }
    try {
      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }
      const product = getProductByPriceId(priceId);
      if (!product) {
        return res.status(400).json({ error: "Invalid price ID" });
      }
      console.log(`[CHECKOUT] Price ID: ${priceId}, Product: ${product.name}, Expected Price: $${product.price}`);
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
      const isSubscription = product.type === "subscription";
      const checkoutMode = isSubscription ? "subscription" : "payment";
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: checkoutMode,
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
          credits: product.credits.toString(),
          productType: product.type
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
    if (!isStripeConfigured) {
      return res.status(503).json({ error: "Payment processing is not configured. Please contact the administrator." });
    }
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
        if (webhookSecret && stripe) {
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
          const productType = session.metadata?.productType;
          const productName = session.metadata?.productName || "Unknown Product";
          if (!userId || !credits) {
            console.error("Missing metadata in checkout session:", session.id);
            break;
          }
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUser(userId, {
              credits: (user.credits || 0) + credits
            });
            await storage.createTransaction({
              userId,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              amount: session.amount_total ? (session.amount_total / 100).toString() : "0",
              currency: session.currency || "usd",
              credits,
              productName,
              status: "completed"
            });
            console.log(`\u2705 ${productType === "subscription" ? "Subscription" : "Payment"} successful! Added ${credits} credits to ${user.email}. New balance: ${(user.credits || 0) + credits}`);
          } else {
            creditManager.addCredits(userId, credits);
            console.log(`\u2705 ${productType === "subscription" ? "Subscription" : "Payment"} successful! Added ${credits} credits to ${userId} (in-memory)`);
          }
          console.log(`Session ID: ${session.id}, Amount: ${session.amount_total ? session.amount_total / 100 : "N/A"}`);
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object;
          const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
          const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
          if (subscriptionId && customerId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id;
            const product = getProductByPriceId(priceId);
            if (product && product.type === "subscription") {
              const userId = subscription.metadata?.userId;
              if (userId) {
                const user = await storage.getUser(userId);
                if (user) {
                  const previousCredits = user.credits || 0;
                  await storage.updateUser(user.id, {
                    credits: product.credits
                  });
                  await storage.createTransaction({
                    userId: user.id,
                    stripeSessionId: `sub_${subscriptionId}`,
                    stripePaymentIntentId: invoice.payment_intent || null,
                    amount: invoice.amount_paid ? (invoice.amount_paid / 100).toString() : "0",
                    currency: invoice.currency || "usd",
                    credits: product.credits,
                    productName: product.name,
                    status: "completed"
                  });
                  console.log(`\u2705 Subscription renewal! Reset credits for ${user.email} from ${previousCredits} to ${product.credits} (unused credits do not roll over)`);
                }
              } else {
                console.warn(`No userId found in subscription metadata for ${subscriptionId}`);
              }
            }
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          console.log(`\u{1F514} Subscription cancelled: ${subscription.id}`);
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
        const adminCredits = user?.adminCredits || 0;
        const purchasedCredits = user?.credits || 0;
        res.json({
          credits: purchasedCredits + adminCredits,
          // Total available credits
          purchasedCredits,
          adminCredits,
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
    if (!isStripeConfigured) {
      return res.status(503).json({ error: "Payment processing is not configured. Please contact the administrator." });
    }
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

// server/adminRoutes.ts
init_schema();
import { eq as eq2, sql as sql4 } from "drizzle-orm";

// server/adminUtil.ts
var ADMIN_EMAILS = ["jeff@cuebee.ai"];
function isAdmin(email) {
  console.log("[isAdmin] Checking email:", email);
  console.log("[isAdmin] Admin emails list:", ADMIN_EMAILS);
  console.log("[isAdmin] Lowercased email:", email.toLowerCase());
  const result = ADMIN_EMAILS.includes(email.toLowerCase());
  console.log("[isAdmin] Result:", result);
  return result;
}

// server/adminRoutes.ts
function registerAdminRoutes(app2) {
  app2.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        credits: users.credits,
        adminCredits: users.adminCredits,
        createdAt: users.createdAt
      }).from(users).orderBy(sql4`${users.createdAt} DESC`);
      const usersWithDetails = allUsers.map((user) => ({
        ...user,
        totalCredits: user.credits + user.adminCredits,
        purchasedCredits: user.credits
        // credits field = purchased + promo
      }));
      return res.json({
        success: true,
        users: usersWithDetails,
        totalUsers: usersWithDetails.length
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        error: "Failed to fetch users",
        message: error.message
      });
    }
  });
  app2.post("/api/admin/give-credits", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { userId, credits } = req.body;
      if (!userId || typeof credits !== "number") {
        return res.status(400).json({
          error: "Invalid request",
          message: "userId and credits (number) are required"
        });
      }
      if (credits <= 0) {
        return res.status(400).json({
          error: "Invalid credits amount",
          message: "Credits must be greater than 0"
        });
      }
      const userResult = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = userResult[0];
      const newAdminCredits = user.adminCredits + credits;
      await db.update(users).set({
        adminCredits: newAdminCredits
      }).where(eq2(users.id, userId));
      console.log(`\u2705 Admin ${req.user.email} gave ${credits} credits to ${user.email}`);
      return res.json({
        success: true,
        message: `Successfully gave ${credits} credits to ${user.email}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          adminCredits: newAdminCredits,
          totalCredits: user.credits + newAdminCredits
        }
      });
    } catch (error) {
      console.error("Error giving credits:", error);
      return res.status(500).json({
        error: "Failed to give credits",
        message: error.message
      });
    }
  });
  app2.post("/api/admin/remove-credits", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { userId, credits } = req.body;
      if (!userId || typeof credits !== "number") {
        return res.status(400).json({
          error: "Invalid request",
          message: "userId and credits (number) are required"
        });
      }
      if (credits <= 0) {
        return res.status(400).json({
          error: "Invalid credits amount",
          message: "Credits must be greater than 0"
        });
      }
      const userResult = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = userResult[0];
      if (user.adminCredits < credits) {
        return res.status(400).json({
          error: "Insufficient admin credits",
          message: `User only has ${user.adminCredits} admin credits. Cannot remove ${credits} credits.`
        });
      }
      const newAdminCredits = user.adminCredits - credits;
      await db.update(users).set({
        adminCredits: newAdminCredits
      }).where(eq2(users.id, userId));
      console.log(`\u2705 Admin ${req.user.email} removed ${credits} credits from ${user.email}`);
      return res.json({
        success: true,
        message: `Successfully removed ${credits} credits from ${user.email}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          adminCredits: newAdminCredits,
          totalCredits: user.credits + newAdminCredits
        }
      });
    } catch (error) {
      console.error("Error removing credits:", error);
      return res.status(500).json({
        error: "Failed to remove credits",
        message: error.message
      });
    }
  });
  app2.get("/api/admin/check", optionalAuth, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      console.log("=== ADMIN CHECK ENDPOINT HIT ===");
      if (!req.user) {
        console.log("No user in request");
        return res.json({ isAdmin: false });
      }
      console.log("User in request:", req.user);
      console.log("Checking admin status for email:", req.user.email);
      const adminStatus = isAdmin(req.user.email);
      console.log("Admin status result:", adminStatus);
      return res.json({
        isAdmin: adminStatus,
        email: req.user.email
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      return res.status(500).json({
        error: "Failed to check admin status",
        message: error.message
      });
    }
  });
  app2.get("/api/admin/analytics", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!isAdmin(req.user.email)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allTransactions = await storage.getAllTransactions();
      const totalRevenue = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalSales = allTransactions.length;
      const salesByDate = allTransactions.reduce((acc, t) => {
        const date = t.createdAt.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, count: 0 };
        }
        acc[date].revenue += parseFloat(t.amount);
        acc[date].count += 1;
        return acc;
      }, {});
      const chartData = Object.values(salesByDate).sort(
        (a, b) => a.date.localeCompare(b.date)
      );
      const transactionsWithUsers = await Promise.all(
        allTransactions.map(async (t) => {
          const user = await storage.getUser(t.userId);
          return {
            id: t.id,
            amount: parseFloat(t.amount),
            currency: t.currency,
            credits: t.credits,
            productName: t.productName,
            status: t.status,
            createdAt: t.createdAt,
            user: user ? { email: user.email, name: user.name } : null
          };
        })
      );
      return res.json({
        success: true,
        summary: {
          totalRevenue,
          totalSales,
          averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
        },
        chartData,
        transactions: transactionsWithUsers
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return res.status(500).json({
        error: "Failed to fetch analytics",
        message: error.message
      });
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
    console.log(`\u2705 Created upload directory successfully`);
  } catch (error) {
    console.error(`\u274C Failed to create upload directory`);
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log(`\u{1F4C1} File upload attempt: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`);
    cb(null, true);
  }
});
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err.code, err.message);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  } else if (err) {
    console.error("Unknown upload error:", err);
    return res.status(500).json({ error: "File upload failed" });
  }
  next();
}
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
      console.error("Logout failed");
      res.status(500).json({ success: false, error: "Logout failed" });
    }
  });
  registerStripeRoutes(app2);
  registerAdminRoutes(app2);
  app2.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.path.endsWith(".mp4")) {
      res.header("Content-Type", "video/mp4");
    }
    next();
  }, express2.static(path2.join(process.cwd(), "uploads")));
  app2.post("/api/generate-video", optionalAuth, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  }, async (req, res) => {
    try {
      console.log("\u{1F4E5} Generate video request received");
      console.log("  - User:", req.user?.email || "anonymous");
      console.log("  - Has file:", !!req.file);
      console.log("  - Prompt length:", req.body.prompt?.length || 0);
      console.log("  - Aspect ratio:", req.body.aspectRatio);
      if (!req.file) {
        console.error("\u274C No file uploaded");
        return res.status(400).json({ error: "No image file provided" });
      }
      const fileValidation = validateImageFile(req.file);
      if (!fileValidation.valid) {
        fs3.unlinkSync(req.file.path);
        return res.status(400).json({ error: fileValidation.error });
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
      const isAdmin2 = !!(adminEmail && req.user && req.user.email === adminEmail);
      console.log(`Video generation request received${isAdmin2 ? " from admin user" : ""}`);
      if (isAdmin2) {
        console.log(`Admin bypass active for request`);
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
            console.log(`Attempting to fetch user from database: ${req.user.id}`);
            const currentUser = await storage.getUser(req.user.id);
            console.log(`Fetched user:`, currentUser ? `email=${currentUser.email}, credits=${currentUser.credits}` : "null/undefined");
            const totalCredits = (currentUser?.credits || 0) + (currentUser?.adminCredits || 0);
            if (!currentUser || totalCredits < 1) {
              console.log(`Credit deduction failed: currentUser=${currentUser ? "exists" : "null"}, total credits=${totalCredits}`);
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            let newAdminCredits = currentUser.adminCredits || 0;
            let newPurchasedCredits = currentUser.credits || 0;
            if (newAdminCredits > 0) {
              newAdminCredits -= 1;
              console.log(`Deducting 1 admin credit (${currentUser.adminCredits} \u2192 ${newAdminCredits})`);
            } else {
              newPurchasedCredits -= 1;
              console.log(`Deducting 1 purchased credit (${currentUser.credits} \u2192 ${newPurchasedCredits})`);
            }
            const updatedUser = await storage.updateUser(req.user.id, {
              credits: newPurchasedCredits,
              adminCredits: newAdminCredits
            });
            console.log(`Update result:`, updatedUser ? `total=${(updatedUser.credits || 0) + (updatedUser.adminCredits || 0)}` : "null/undefined");
            if (!updatedUser) {
              console.log(`Failed to update user in database`);
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "Could not update credit balance"
              });
            }
            req.user = updatedUser;
            console.log(`Authenticated user used a credit`);
          } else {
            const deducted = creditManager.deductCredit(userId);
            if (!deducted) {
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            console.log(`Anonymous user used a credit`);
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
      console.log(`Starting video generation`);
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
      if (!useCredit && !isAdmin2) {
        rateLimiter.recordGeneration(userId);
        console.log(`Rate limit recorded for request`);
      } else {
        console.log(`Credit used or admin bypass - rate limit not recorded`);
      }
      fs3.unlink(imagePath, (err) => {
        if (err) console.error("Failed to cleanup temp file:", err);
      });
      res.json({
        id: operation.id,
        status: "processing"
      });
    } catch (error) {
      console.error("Error in /api/generate-video (full error):", error);
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/generate-video (sanitized):", sanitizedMsg);
      res.status(500).json({ error: sanitizedMsg });
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
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/video-status:", sanitizedMsg);
      res.status(500).json({ error: sanitizedMsg });
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
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/my-videos:", sanitizedMsg);
      res.status(500).json({ error: sanitizedMsg });
    }
  });
  app2.post("/api/waitlist", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }
      await storage.addWaitlistEmail(email);
      res.json({ success: true, message: "Thank you for joining our waitlist!" });
    } catch (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        return res.status(200).json({ success: true, message: "You're already on our waitlist!" });
      }
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/waitlist:", sanitizedMsg);
      res.status(500).json({ error: "Failed to join waitlist. Please try again." });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// api/serverless.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(cookieParser());
var initialized = false;
async function initializeApp() {
  if (initialized) return;
  console.log("\u{1F680} Initializing serverless function...");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  try {
    await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error:", err);
      res.status(status).json({ message });
    });
    initialized = true;
    console.log("\u2705 Routes initialized successfully");
  } catch (error) {
    console.error("\u274C Failed to initialize routes:", error);
    throw error;
  }
}
async function handler(req, res) {
  console.log(`\u{1F4E8} Request: ${req.method} ${req.url}`);
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error("\u274C Handler error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
    if (!res.headersSent) {
      res.status(500).json({
        error: "Server initialization failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error instanceof Error ? error.stack : void 0 : void 0
      });
    }
  }
}
export {
  handler as default
};
