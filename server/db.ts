import { eq, and, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import fs from 'fs';

// Ensure the database directory exists
const dbDir = path.dirname('babes_espresso.db');
console.log('Database directory:', dbDir);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqlite: Database.Database;
try {
  const dbFilePath = path.join(process.cwd(), 'babes_espresso.db');
  console.log('Database file path:', dbFilePath);
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, '');
    console.log('Created database file:', dbFilePath);
  } else {
    console.log('Database file already exists:', dbFilePath);
  }
  // Improved SQLite connection with better options
  sqlite = new Database(dbFilePath, { 
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    fileMustExist: false,
    timeout: 5000, // 5 seconds
    // Add journaling mode for better crash recovery
    prepareStatement: (sql) => {
      if (sql === 'PRAGMA journal_mode = WAL;') return true;
      return false;
    }
  });
  
  // Enable WAL mode for better performance and reliability
  sqlite.pragma('journal_mode = WAL');
  // Ensure foreign keys are enforced
  sqlite.pragma('foreign_keys = ON');
  
  console.log('SQLite database connection established successfully');
} catch (error) {
  console.error('Failed to create SQLite database:', error);
  process.exit(1);
}

// Register a function to close the database on process exit
process.on('exit', () => {
  if (sqlite) {
    console.log('Closing SQLite database connection...');
    try {
      sqlite.close();
    } catch (error) {
      console.error('Error closing SQLite database:', error);
    }
  }
});

export const db = drizzle(sqlite, { schema });

// Initialize database tables
const initDb = async () => {
  console.log('Initializing database tables...');
  try {
    // Create tables if they don't exist
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'follower',
        username TEXT UNIQUE,
        display_name TEXT,
        avatar_url TEXT,
        bio TEXT,
        verified INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        alias_name TEXT,
        social_platforms TEXT NOT NULL,
        social_handles TEXT,
        only_fans_link TEXT,
        body_photo_url TEXT NOT NULL,
        license_photo_url TEXT NOT NULL,
        terms_accepted TEXT NOT NULL
      );
    `);
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'gallery',
        content_rating TEXT NOT NULL DEFAULT 'sfw',
        is_premium INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        instagram TEXT,
        tiktok TEXT,
        twitter TEXT,
        onlyfans TEXT,
        description TEXT
      );
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create default admin user if it doesn't exist
export async function createDefaultAdmin() {
  console.log('Starting admin user creation/verification...');
  try {
    // Check if admin user exists
    const [adminUser] = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@babesespresso.com'));
    
    if (!adminUser) {
      console.log('Creating default admin user...');
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword('admin123');
      
      await db.insert(schema.users).values({
        email: 'admin@babesespresso.com',
        password: hashedPassword,
        role: 'admin',
        username: 'admin',
        display_name: 'Administrator'
      });
      
      console.log('Default admin user created successfully');
    } else {
      // Update existing admin to ensure role is set
      await db
        .update(schema.users)
        .set({ role: 'admin' })
        .where(eq(schema.users.email, 'admin@babesespresso.com'));
      console.log('Admin role verified');
    }
  } catch (error) {
    console.error('Failed to create/verify default admin user:', error);
    throw error; // Re-throw to prevent server from starting with invalid admin
  }
}

// Initialize the database and create admin user
export const initializeDatabase = async () => {
  await initDb();
  await createDefaultAdmin();
};

export { eq, and, sql };