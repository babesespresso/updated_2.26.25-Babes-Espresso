import { db } from '../db';
import { gallery } from '../../shared/schema';

async function seed() {
  try {
    // Add sample featured content
    await db.insert(gallery).values([
      {
        url: '/uploads/featured-1.jpg',
        title: 'Featured Image 1',
        type: 'featured',
        contentRating: 'sfw',
        isPremium: false,
        createdAt: new Date().toISOString(),
        tags: JSON.stringify(['featured', 'sample']),
        description: 'Sample featured content'
      },
      {
        url: '/uploads/featured-2.jpg',
        title: 'Featured Image 2',
        type: 'featured',
        contentRating: 'sfw',
        isPremium: false,
        createdAt: new Date().toISOString(),
        tags: JSON.stringify(['featured', 'sample']),
        description: 'Another sample featured content'
      }
    ]);
    console.log('Sample featured content added successfully');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

seed();
