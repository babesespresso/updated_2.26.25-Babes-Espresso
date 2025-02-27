import { models, users, gallery, followerProfiles, creatorProfiles, type Model, type User, type Gallery, type FollowerProfile, type CreatorProfile } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "./auth";

export interface IStorage {
  createUser(user: { email: string; password: string; role: string; username?: string; displayName?: string }): Promise<User>;
  createModel(model: Omit<Model, "id">): Promise<Model>;
  getModel(id: number): Promise<Model | undefined>;
  getAllModels(): Promise<Model[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUser(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getGalleryItems(type?: string, premium?: boolean): Promise<Gallery[]>;
  createGalleryItem(item: Omit<Gallery, "id">): Promise<Gallery>;
  deleteGalleryItem(id: number): Promise<Gallery | undefined>;
  createFollowerProfile(profile: { userId: number }): Promise<FollowerProfile>;
  createCreatorProfile(profile: { userId: number, displayName: string }): Promise<CreatorProfile>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: { email: string; password: string; role: string; username?: string; displayName?: string }): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          email: user.email,
          password: user.password,
          role: user.role,
          username: user.username,
          display_name: user.displayName
        })
        .returning();
      console.log('User created:', { id: newUser.id, email: newUser.email, role: newUser.role });
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  }
  async createModel(model: Omit<Model, "id">): Promise<Model> {
    const [newModel] = await db
      .insert(models)
      .values(model)
      .returning();
    return newModel;
  }

  async getModel(id: number): Promise<Model | undefined> {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model || undefined;
  }

  async getAllModels(): Promise<Model[]> {
    return db.select().from(models);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user;
  }

  async getUser(email: string): Promise<User | undefined> {
    console.log('Getting user by email:', email);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log('Getting user by username:', username);
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getGalleryItems(type?: string, premium?: boolean): Promise<Gallery[]> {
    try {
      let query = db.select().from(gallery);
      
      // Build where conditions
      const conditions = [];
      if (type) {
        conditions.push(eq(gallery.type, type));
      }
      if (premium !== undefined) {
        conditions.push(eq(gallery.isPremium, premium));
      }
      
      // Apply conditions if any exist
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const items = await query;
      if (!items || !Array.isArray(items)) {
        throw new Error('Invalid response from database');
      }
      
      // Process items to ensure URLs are correctly formatted
      return items.map(item => {
        // Ensure URL is properly formatted
        if (item.url && !item.url.startsWith('http')) {
          const filename = item.url.split('/').pop();
          // Use a relative URL that will be resolved by the static middleware
          item.url = `/uploads/${filename}`;
        }
        
        // Ensure tags are properly formatted
        if (typeof item.tags === 'string') {
          try {
            item.tags = JSON.parse(item.tags);
          } catch (e) {
            console.warn('Failed to parse tags for item:', item.id);
            item.tags = [];
          }
        }
        
        return item;
      });
    } catch (error) {
      console.error('Failed to fetch gallery items:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch gallery items from database: ${message}`);
    }
  }

  async createGalleryItem(item: Omit<Gallery, "id">): Promise<Gallery> {
    const [newItem] = await db
      .insert(gallery)
      .values(item)
      .returning();
    return newItem;
  }

  async deleteGalleryItem(id: number): Promise<Gallery | undefined> {
    const [deletedItem] = await db
      .delete(gallery)
      .where(eq(gallery.id, id))
      .returning();
    return deletedItem;
  }

  async createFollowerProfile(profile: { userId: number }): Promise<FollowerProfile> {
    try {
      const [newProfile] = await db
        .insert(followerProfiles)
        .values({
          userId: profile.userId,
          preferences: JSON.stringify({}),
          createdAt: new Date().toISOString()
        })
        .returning();
      console.log('Follower profile created:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('Failed to create follower profile:', error);
      throw new Error('Failed to create follower profile');
    }
  }

  async createCreatorProfile(profile: { userId: number, displayName: string }): Promise<CreatorProfile> {
    try {
      const [newProfile] = await db
        .insert(creatorProfiles)
        .values({
          userId: profile.userId,
          aliasName: profile.displayName,
          approvalStatus: 'pending',
          monthlySubscriptionPrice: 0,
          perPostPrice: 0,
          createdAt: new Date().toISOString()
        })
        .returning();
      console.log('Creator profile created:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('Failed to create creator profile:', error);
      throw new Error('Failed to create creator profile');
    }
  }
}

export const storage = new DatabaseStorage();