/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app without calling listen()
 */

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { ensureBucketExists } from "./cloudStorage";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Simple logging middleware
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes and setup using top-level await
// This ensures the app is fully initialized before Vercel receives it
console.log('Initializing Vercel serverless function...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BUILD_ID: v3.0.0-FORCE-REBUILD-' + Date.now());

// Initialize Google Cloud Storage bucket
try {
  console.log('🪣 Initializing Google Cloud Storage...');
  await ensureBucketExists();
  console.log('✅ GCS initialized successfully');
} catch (error: any) {
  console.error('❌ Failed to initialize GCS:', error.message);
  console.warn('⚠️  App will continue, but video uploads may fail');
}

await registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Setup static file serving for production
console.log('Setting up static file serving for Vercel...');

// Inline static file serving (instead of importing from vite.js)
const distPath = path.resolve(__dirname, "public");

if (!fs.existsSync(distPath)) {
  console.warn(`Static files directory not found: ${distPath}`);
} else {
  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all frontend routes (GET requests only)
  // Skip API and auth routes (these are handled by backend)
  app.get("*", (req, res, next) => {
    // Skip backend routes - let them be handled by registered route handlers
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/auth') || 
        req.path.startsWith('/uploads')) {
      return next();
    }
    
    // For all other GET requests, serve the SPA index.html
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Static files not found');
    }
  });
}

console.log('✅ Vercel serverless function initialized');

// Export the Express app for Vercel
export default app;

