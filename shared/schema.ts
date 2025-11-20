import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Authentication fields
  email: text("email").notNull().unique(),
  password: text("password"), // Nullable for OAuth users
  googleId: text("google_id").unique(), // For Google OAuth users

  // Profile fields
  name: text("name").notNull(),
  picture: text("picture"), // Profile picture URL

  // Account management
  credits: integer("credits").notNull().default(0),
  adminCredits: integer("admin_credits").notNull().default(0), // Credits given by admin (can be revoked)
  stripeCustomerId: text("stripe_customer_id"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// Schema for email/password signup
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  name: z.string().min(1, "Name is required"),
}).pick({
  email: true,
  password: true,
  name: true,
});

// Schema for Google OAuth signup
export const insertOAuthUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  googleId: z.string().min(1, "Google ID is required"),
}).pick({
  email: true,
  googleId: true,
  name: true,
  picture: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOAuthUser = z.infer<typeof insertOAuthUserSchema>;
export type User = typeof users.$inferSelect;

export const videoOperations = pgTable("video_operations", {
  id: text("id").primaryKey(),
  operationId: text("operation_id"),
  status: text("status").notNull(),
  prompt: text("prompt").notNull(),
  imagePath: text("image_path"),
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id"), // New field
});

export const insertVideoOperationSchema = createInsertSchema(videoOperations).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoOperation = z.infer<typeof insertVideoOperationSchema>;
export type VideoOperation = typeof videoOperations.$inferSelect;

export const waitlistEmails = pgTable("waitlist_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWaitlistEmailSchema = createInsertSchema(waitlistEmails, {
  email: z.string().email("Invalid email address"),
}).pick({
  email: true,
});

export type InsertWaitlistEmail = z.infer<typeof insertWaitlistEmailSchema>;
export type WaitlistEmail = typeof waitlistEmails.$inferSelect;

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // Reference to users table
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Amount in dollars
  currency: text("currency").notNull().default("usd"),
  credits: integer("credits").notNull(), // Number of credits purchased
  productName: text("product_name").notNull(), // e.g., "1 Credit", "3 Credits"
  status: text("status").notNull(), // e.g., "completed", "pending", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
