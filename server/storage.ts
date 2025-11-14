import { type User, type InsertUser, type InsertOAuthUser, type VideoOperation, type InsertVideoOperation, type WaitlistEmail } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, videoOperations, waitlistEmails } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(user: InsertOAuthUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  createVideoOperation(operation: InsertVideoOperation): Promise<VideoOperation>;
  getVideoOperation(id: string): Promise<VideoOperation | undefined>;
  updateVideoOperation(id: string, updates: Partial<VideoOperation>): Promise<VideoOperation | undefined>;
  getVideosByUserId(userId: string): Promise<VideoOperation[]>;
  addWaitlistEmail(email: string): Promise<WaitlistEmail>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private videoOperations: Map<string, VideoOperation>;
  private waitlistEmails: Map<string, WaitlistEmail>;

  constructor() {
    this.users = new Map();
    this.videoOperations = new Map();
    this.waitlistEmails = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password ?? null,
      googleId: null,
      name: insertUser.name,
      picture: null,
      credits: 0,
      stripeCustomerId: null,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  async createOAuthUser(insertUser: InsertOAuthUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      password: null,
      googleId: insertUser.googleId,
      name: insertUser.name,
      picture: insertUser.picture ?? null,
      credits: 0,
      stripeCustomerId: null,
      createdAt: new Date(),
      lastLogin: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async createVideoOperation(insertOperation: InsertVideoOperation): Promise<VideoOperation> {
    const id = randomUUID();
    const operation: VideoOperation = {
      id,
      operationId: insertOperation.operationId ?? null,
      status: insertOperation.status,
      prompt: insertOperation.prompt,
      imagePath: insertOperation.imagePath ?? null,
      videoUrl: insertOperation.videoUrl ?? null,
      error: insertOperation.error ?? null,
      createdAt: new Date(),
      userId: insertOperation.userId ?? null,
    };
    this.videoOperations.set(id, operation);
    return operation;
  }

  async getVideoOperation(id: string): Promise<VideoOperation | undefined> {
    return this.videoOperations.get(id);
  }

  async updateVideoOperation(id: string, updates: Partial<VideoOperation>): Promise<VideoOperation | undefined> {
    const operation = this.videoOperations.get(id);
    if (!operation) return undefined;
    
    const updated = { ...operation, ...updates };
    this.videoOperations.set(id, updated);
    return updated;
  }

  async getVideosByUserId(userId: string): Promise<VideoOperation[]> {
    return Array.from(this.videoOperations.values()).filter(
      (op) => op.userId === userId
    );
  }

  async addWaitlistEmail(email: string): Promise<WaitlistEmail> {
    if (this.waitlistEmails.has(email)) {
      throw new Error('Email already exists in waitlist');
    }
    const id = randomUUID();
    const waitlistEmail: WaitlistEmail = {
      id,
      email,
      createdAt: new Date(),
    };
    this.waitlistEmails.set(email, waitlistEmail);
    return waitlistEmail;
  }
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result?.[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result?.[0] || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result?.[0] || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      credits: 0,
    }).returning();
    return result[0];
  }

  async createOAuthUser(insertUser: InsertOAuthUser): Promise<User> {
    const result = await db.insert(users).values({
      email: insertUser.email,
      googleId: insertUser.googleId,
      name: insertUser.name,
      picture: insertUser.picture,
      credits: 0,
      lastLogin: new Date(),
    }).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result?.[0];
  }

  async createVideoOperation(insertOperation: InsertVideoOperation): Promise<VideoOperation> {
    const id = randomUUID();
    const result = await db.insert(videoOperations).values({
      id,
      operationId: insertOperation.operationId,
      status: insertOperation.status,
      prompt: insertOperation.prompt,
      imagePath: insertOperation.imagePath,
      videoUrl: insertOperation.videoUrl,
      error: insertOperation.error,
      userId: insertOperation.userId,
    }).returning();
    return result[0];
  }

  async getVideoOperation(id: string): Promise<VideoOperation | undefined> {
    const result = await db.select().from(videoOperations).where(eq(videoOperations.id, id));
    return result?.[0];
  }

  async updateVideoOperation(id: string, updates: Partial<VideoOperation>): Promise<VideoOperation | undefined> {
    const result = await db.update(videoOperations)
      .set(updates)
      .where(eq(videoOperations.id, id))
      .returning();
    return result?.[0];
  }

  async getVideosByUserId(userId: string): Promise<VideoOperation[]> {
    return await db.select().from(videoOperations).where(eq(videoOperations.userId, userId));
  }

  async addWaitlistEmail(email: string): Promise<WaitlistEmail> {
    const result = await db.insert(waitlistEmails).values({
      email,
    }).returning();
    return result[0];
  }
}

// Use DbStorage if DATABASE_URL is available, otherwise fall back to MemStorage
export const storage: IStorage = process.env.DATABASE_URL
  ? new DbStorage()
  : new MemStorage();
