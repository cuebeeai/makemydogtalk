import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, videoOperations } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.error("Please configure DATABASE_URL in Firebase App Hosting secrets.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("✅ DATABASE_URL is configured, initializing database connection...");

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, {
  schema: { users, videoOperations },
});

console.log("✅ Database connection initialized successfully");
