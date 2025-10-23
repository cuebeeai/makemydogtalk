import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const videoOperations = pgTable("video_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: text("operation_id"),
  status: text("status").notNull(),
  prompt: text("prompt").notNull(),
  imagePath: text("image_path"),
  videoUrl: text("video_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVideoOperationSchema = createInsertSchema(videoOperations).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoOperation = z.infer<typeof insertVideoOperationSchema>;
export type VideoOperation = typeof videoOperations.$inferSelect;
