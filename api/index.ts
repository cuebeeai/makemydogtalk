/**
 * Vercel Serverless Function Entry Point
 * This exports the Express app as a Vercel serverless function
 */

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";

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
    if (path.startsWith("/api") || path.startsWith("/auth")) {
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

// Initialize routes
let routesInitialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (routesInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('Initializing serverless function...');
      console.log('NODE_ENV:', process.env.NODE_ENV);

      await registerRoutes(app);
      routesInitialized = true;
      console.log('✅ Routes initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize routes:', error);
      throw error;
    }
  })();

  return initPromise;
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error('Server error:', err);
  res.status(status).json({ message });
});

// Export handler for Vercel
export default async function handler(req: Request, res: Response) {
  await initializeApp();
  return app(req, res);
}
