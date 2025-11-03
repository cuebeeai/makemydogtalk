import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { generateVideo, checkVideoStatus } from "./veo";
import { rateLimiter } from "./rateLimiter";
import { registerStripeRoutes } from "./stripe";
import { creditManager } from "./credits";
import { optionalAuth, requireAuth } from "./middleware";
import authRoutes from "./authRoutes";
import { logoutSession } from "./auth";
import { logoutSession as logoutEmailSession } from "./emailAuth";
import { validateImageFile, sanitizeError } from "./validation";

// Use /tmp for Vercel serverless (read-only filesystem otherwise)
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads/temp/';

// Ensure upload directory exists before multer initialization
// This is critical for Vercel serverless where /tmp is the only writable location
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Created upload directory successfully`);
  } catch (error) {
    console.error(`❌ Failed to create upload directory`);
  }
}

// Create multer storage configuration
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Directory should already exist, but double-check
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Cloud Run
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Register unified authentication routes (Email/Password + OAuth)
  app.use(authRoutes);

  // Get current authenticated user
  app.get('/auth/me', optionalAuth, (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        user: req.user,
      });
    } else {
      res.status(401).json({ success: false, error: 'Not authenticated' });
    }
  });

  // Logout endpoint
  app.post('/auth/logout', optionalAuth, (req, res) => {
    try {
      // Get token from cookie or header
      const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);

      if (token) {
        // Try to logout from both session stores
        logoutSession(token);
        logoutEmailSession(token);
      }

      res.clearCookie('auth_token');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout failed');
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  });

  // Register Stripe payment routes
  registerStripeRoutes(app);

  // Serve static files with proper headers for video files
  app.use("/uploads", (req, res, next) => {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Set proper content-type for video files
    if (req.path.endsWith('.mp4')) {
      res.header('Content-Type', 'video/mp4');
    }

    next();
  }, express.static(path.join(process.cwd(), "uploads")));

  app.post("/api/generate-video", optionalAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Validate file
      const fileValidation = validateImageFile(req.file);
      if (!fileValidation.valid) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: fileValidation.error });
      }

      if (!req.body.prompt) {
        return res.status(400).json({ error: "No prompt provided" });
      }

      const prompt = req.body.prompt;

      // Validate prompt length
      if (prompt.length > 300) {
        return res.status(400).json({ error: "Prompt must be 300 characters or less" });
      }

      if (prompt.length < 5) {
        return res.status(400).json({ error: "Prompt must be at least 5 characters" });
      }

      // Get user identifier: Prioritize authenticated user ID, fallback to IP
      const userId = req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
      const useCredit = req.body.useCredit === 'true' || req.body.useCredit === true;

      // New: Admin bypass logic
      const adminEmail = process.env.ADMIN_EMAIL;
      const isAdmin = !!(adminEmail && req.user && req.user.email === adminEmail);

      console.log(`Video generation request received${isAdmin ? ' from admin user' : ''}`);

      if (isAdmin) {
        console.log(`Admin bypass active for request`);
      } else {
        // Check if user has credits
        let hasCredits = false;
        let creditBalance = 0;

        if (req.user) {
          // For authenticated users, fetch current credits from database
          const currentUser = await storage.getUser(req.user.id);
          creditBalance = currentUser?.credits || 0;
          hasCredits = creditBalance > 0;
        } else {
          // For anonymous users, use in-memory credit manager (legacy)
          hasCredits = creditManager.hasCredits(userId);
          creditBalance = creditManager.getCredits(userId);
        }

        // If user wants to use a credit and has credits available
        if (useCredit && hasCredits) {
          // Deduct credit and skip rate limit
          if (req.user) {
            // Fetch current user from database to ensure latest credit balance
            console.log(`Attempting to fetch user from database: ${req.user.id}`);
            const currentUser = await storage.getUser(req.user.id);
            console.log(`Fetched user:`, currentUser ? `email=${currentUser.email}, credits=${currentUser.credits}` : 'null/undefined');
            
            if (!currentUser || (currentUser.credits || 0) < 1) {
              console.log(`Credit deduction failed: currentUser=${currentUser ? 'exists' : 'null'}, credits=${currentUser?.credits || 0}`);
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "You don't have enough credits"
              });
            }
            // Update database credits for authenticated users
            console.log(`Attempting to update user credits from ${currentUser.credits} to ${currentUser.credits - 1}`);
            const updatedUser = await storage.updateUser(req.user.id, {
              credits: currentUser.credits - 1
            });
            console.log(`Update result:`, updatedUser ? `credits=${updatedUser.credits}` : 'null/undefined');
            
            if (!updatedUser) {
              console.log(`Failed to update user in database`);
              return res.status(400).json({
                error: "Failed to deduct credit",
                message: "Could not update credit balance"
              });
            }
            req.user = updatedUser; // Update session user
            console.log(`Authenticated user used a credit`);
          } else {
            // Use in-memory credit manager for anonymous users
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
          // Check rate limit for free generation
          const rateLimitCheck = rateLimiter.canGenerate(userId, false);

          if (!rateLimitCheck.allowed) {
            const hours = Math.floor(rateLimitCheck.remainingMinutes! / 60);
            const minutes = rateLimitCheck.remainingMinutes! % 60;
            const timeString = hours > 0
              ? `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

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

      // Add validation for aspectRatio
      if (!aspectRatio || !['16:9', '9:16', '1:1'].includes(aspectRatio)) {
        // Clean up the uploaded file before sending an error response
        fs.unlink(imagePath, (err) => {
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
        aspectRatio: aspectRatio as "16:9" | "9:16" | "1:1",
        voiceStyle,
        action,
      });

      const operation = await storage.createVideoOperation({
        operationId: result.operation.name || null,
        status: "processing",
        prompt,
        imagePath,
        videoUrl: null,
        error: null,
        userId: req.user ? req.user.id : null, // Add userId
      });

      // Record this generation for rate limiting (only if not using credits and not an admin)
      if (!useCredit && !isAdmin) {
        rateLimiter.recordGeneration(userId);
        console.log(`Rate limit recorded for request`);
      } else {
        console.log(`Credit used or admin bypass - rate limit not recorded`);
      }

      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to cleanup temp file:", err);
      });

      res.json({
        id: operation.id,
        status: "processing",
      });
    } catch (error: any) {
      console.error("Error in /api/generate-video (full error):", error);
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/generate-video (sanitized):", sanitizedMsg);
      res.status(500).json({ error: sanitizedMsg });
    }
  });

  app.get("/api/video-status/:id", optionalAuth, async (req, res) => {
    try {
      const operationId = req.params.id;
      const operation = await storage.getVideoOperation(operationId);

      if (!operation) {
        return res.status(404).json({ error: "Operation not found" });
      }

      if (operation.status === "completed") {
        return res.json({
          status: "completed",
          videoUrl: operation.videoUrl,
        });
      }

      if (operation.status === "failed") {
        return res.json({
          status: "failed",
          error: operation.error,
        });
      }

      if (operation.operationId) {
        const statusResult = await checkVideoStatus(operation.operationId);

        await storage.updateVideoOperation(operationId, {
          status: statusResult.status,
          videoUrl: statusResult.videoUrl || null,
          error: statusResult.error || null,
        });

        res.json({
          status: statusResult.status,
          videoUrl: statusResult.videoUrl,
          error: statusResult.error,
        });
      } else {
        res.json({
          status: operation.status,
          videoUrl: operation.videoUrl,
          error: operation.error,
        });
      }
    } catch (error: any) {
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/video-status:", sanitizedMsg);
      res.status(500).json({ error: sanitizedMsg });
    }
  });

  // New endpoint to get user's video creations
  app.get("/api/my-videos", optionalAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const videos = await storage.getVideosByUserId(req.user.id);
      res.json(videos);
    } catch (error: any) {
      const sanitizedMsg = sanitizeError(error);
      console.error("Error in /api/my-videos:", sanitizedMsg);
      res.status(500).json({ error: sanitizedMsg });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
