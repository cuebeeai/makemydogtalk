import { type User, type InsertUser, type VideoOperation, type InsertVideoOperation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createVideoOperation(operation: InsertVideoOperation): Promise<VideoOperation>;
  getVideoOperation(id: string): Promise<VideoOperation | undefined>;
  updateVideoOperation(id: string, updates: Partial<VideoOperation>): Promise<VideoOperation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private videoOperations: Map<string, VideoOperation>;

  constructor() {
    this.users = new Map();
    this.videoOperations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
