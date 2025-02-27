import { Router } from 'express';
import { db } from '../db';
import { content, contentSchema, users, creatorProfiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth';
import multer from 'multer';
import path from 'path';
import { processImage } from '../utils/imageProcessor';

const router = Router();

// Configure multer for content uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'content'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get content feed (public content)
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const feed = await db.query.content.findMany({
      where: (content, { eq }) => eq(content.isPremium, 0),
      limit,
      offset,
      orderBy: (content, { desc }) => [desc(content.createdAt)],
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    res.json(feed);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
});

// Get creator's content
router.get('/creator/:creatorId', requireAuth, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const userId = req.user?.id;

    // Check if user has access to premium content
    const hasAccess = userId ? await db.query.subscriptions.findFirst({
      where: (subscriptions, { and, eq }) => and(
        eq(subscriptions.followerId, userId),
        eq(subscriptions.creatorId, parseInt(creatorId)),
        eq(subscriptions.status, 'active')
      )
    }) : false;

    const creatorContent = await db.query.content.findMany({
      where: (content, { and, eq, or }) => and(
        eq(content.creatorId, parseInt(creatorId)),
        hasAccess ? undefined : eq(content.isPremium, 0)
      ),
      orderBy: (content, { desc }) => [desc(content.createdAt)],
      with: {
        creator: {
          columns: {
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    res.json(creatorContent);
  } catch (error) {
    console.error('Error fetching creator content:', error);
    res.status(500).json({ message: 'Error fetching creator content' });
  }
});

// Create new content (creators only)
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id;

    // Check if user is an approved creator
    const creator = await db.query.creatorProfiles.findFirst({
      where: (profiles, { and, eq }) => and(
        eq(profiles.userId, userId),
        eq(profiles.approvalStatus, 'approved')
      )
    });

    if (!creator) {
      return res.status(403).json({ message: 'Only approved creators can post content' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate content data
    const contentData = contentSchema.parse({
      ...req.body,
      url: `/uploads/content/${file.filename}`,
      contentType: file.mimetype.startsWith('image/') ? 'image' : 'video'
    });

    // Process image if it's an image file
    if (contentData.contentType === 'image') {
      await processImage(file.path, {
        quality: 80,
        maxWidth: 2000
      });
    }

    // Create content record
    const [newContent] = await db.insert(content).values({
      ...contentData,
      creatorId: userId
    }).returning();

    res.status(201).json(newContent);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ message: 'Error creating content' });
  }
});

// Delete content
router.delete('/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?.id;

    // Check if user owns the content or is admin
    const contentItem = await db.query.content.findFirst({
      where: (content, { eq }) => eq(content.id, parseInt(contentId))
    });

    if (!contentItem) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId)
    });

    if (contentItem.creatorId !== userId && user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this content' });
    }

    await db.delete(content).where(eq(content.id, parseInt(contentId)));

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Error deleting content' });
  }
});

export default router;
