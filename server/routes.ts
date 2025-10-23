import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { generateVideo, checkVideoStatus } from "./veo";

const upload = multer({
  dest: "uploads/temp/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.post("/api/generate-video", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      if (!req.body.prompt) {
        return res.status(400).json({ error: "No prompt provided" });
      }

      const imagePath = req.file.path;
      const prompt = req.body.prompt;

      console.log(`Generating video with prompt: "${prompt}"`);

      const result = await generateVideo({
        prompt,
        imagePath,
      });

      const operation = await storage.createVideoOperation({
        operationId: result.operation.name || null,
        status: "processing",
        prompt,
        imagePath,
        videoUrl: null,
        error: null,
      });

      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to cleanup temp file:", err);
      });

      res.json({
        id: operation.id,
        status: "processing",
      });
    } catch (error: any) {
      console.error("Error in /api/generate-video:", error);
      res.status(500).json({ error: error.message || "Failed to start video generation" });
    }
  });

  app.get("/api/video-status/:id", async (req, res) => {
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
      console.error("Error in /api/video-status:", error);
      res.status(500).json({ error: error.message || "Failed to check video status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
