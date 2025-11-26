/**
 * Vercel Serverless Function Entry Point
 * Handles all /api/* and /auth/* routes
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes.js";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize routes once
let initialized = false;

async function initializeApp() {
  if (initialized) return;

  console.log('🚀 Initializing serverless function...');
  await registerRoutes(app);
  initialized = true;
  console.log('✅ Routes registered');
}

// Vercel serverless handler
export default async function handler(req, res) {
  await initializeApp();
  return app(req, res);
}
