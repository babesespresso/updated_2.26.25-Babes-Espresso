import { db } from '../db';
import { models } from '@shared/schema';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

async function createModelsTable() {
  console.log('Creating models table if it does not exist...');
  
  try {
    // Check if the models table exists
    const tableExists = await db.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='models'`
    );
    
    if (tableExists.length === 0) {
      console.log('Models table does not exist, creating it now...');
      
      // Create the models table
      await db.execute(`
        CREATE TABLE models (
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
        )
      `);
      
      console.log('Models table created successfully');
    } else {
      console.log('Models table already exists');
    }
  } catch (error) {
    console.error('Error creating models table:', error);
  }
}

export default createModelsTable;
