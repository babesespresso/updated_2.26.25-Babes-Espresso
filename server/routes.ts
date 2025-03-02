import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import multer from "multer";
import type { MulterError } from "multer";
import * as fsPromises from 'fs/promises';
import { processImage, ensureImageQuality } from './utils/imageProcessor';
import { gallery, models } from "../shared/schema";
import { db, eq, and } from "./db";
import fs from "fs";
import path from "path";
import express from 'express';
import { setupAuth, requireAuth } from "./auth";
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { sql } from 'drizzle-orm';

// Set up multer storage
const uploadDir = path.join(process.cwd(), 'uploads');
const publicUploadsDir = path.join(process.cwd(), 'client', 'public', 'uploads');

// Ensure upload directories exist with proper permissions
async function ensureUploadDirectories() {
  for (const dir of [uploadDir, publicUploadsDir]) {
    try {
      // Check if directory exists
      try {
        await fsPromises.access(dir, fs.constants.W_OK);
        console.log(`Directory ${dir} exists and is writable`);
      } catch {
        // Directory doesn't exist or isn't writable, create it
        await fsPromises.mkdir(dir, { recursive: true, mode: 0o755 });
        console.log(`Created directory ${dir}`);
      }

      // Ensure correct permissions
      await fsPromises.chmod(dir, 0o755);
      
      // Verify directory is writable using a safer approach
      const testFile = path.join(dir, '.write-test');
      try {
        await fsPromises.writeFile(testFile, '');
        await fsPromises.unlink(testFile);
        console.log(`Directory ${dir} verified as writable`);
      } catch (error) {
        console.error(`Failed to verify write permissions on ${dir}:`, error);
        throw new Error(`Cannot write to directory ${dir}: ${error.message}`);
      }
      
      const stats = await fsPromises.stat(dir);
      console.log(`Directory ${dir} verified with permissions:`, stats.mode.toString(8));
    } catch (error) {
      console.error(`Failed to setup directory ${dir}:`, error);
      throw new Error(`Failed to initialize directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

import { hashPassword } from "./auth";

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // Store files directly in the public uploads directory
      if (!fs.existsSync(publicUploadsDir)) {
        try {
          fs.mkdirSync(publicUploadsDir, { recursive: true, mode: 0o755 });
        } catch (error) {
          console.error('Failed to create upload directory:', error);
          return cb(new Error('Failed to create upload directory'), '');
        }
      }
      cb(null, publicUploadsDir);
    },
    filename: function (req, file, cb) {
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        console.log('Generated filename:', filename);
        
        // Validate filename
        if (!filename.match(/^[a-zA-Z0-9-_.]+$/)) {
          console.error('Invalid filename:', filename);
          return cb(new Error('Invalid filename'), '');
        }
        cb(null, filename);
      } catch (error) {
        console.error('Failed to generate filename:', error);
        cb(new Error('Failed to generate filename'), '');
      }
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: function (req, file, cb) {
    console.log('Validating file:', { mimetype: file.mimetype, originalname: file.originalname });
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.error('Invalid file type:', file.mimetype);
      return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
    cb(null, true);
  }
});

const initializeDatabase = async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      social_platforms TEXT NOT NULL,
      social_handles TEXT NOT NULL,
      only_fans_link TEXT,
      body_photo_url TEXT NOT NULL,
      license_photo_url TEXT NOT NULL,
      terms_accepted TEXT NOT NULL,
      created_at DATETIME NOT NULL
    )
  `);
  console.log('✅ Database initialized');
};

initializeDatabase();

export async function registerRoutes(app: Express) {
  console.log('Registering routes...');

  try {
    console.log('Starting route registration...');

    // Setup auth first
    setupAuth(app);

    // Ensure upload directories exist
    await ensureUploadDirectories();

    // Import API routes
    const contentRoutes = (await import('./api/content')).default;
    const subscriptionRoutes = (await import('./api/subscriptions')).default;

    // Register API routes
    app.use('/api/content', contentRoutes);
    app.use('/api/subscriptions', subscriptionRoutes);

    // Creators API endpoints
    app.get('/api/creators', async (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          // Return empty creators array for unauthenticated users
          return res.json({ creators: [], total: 0, page: 1, pageSize: 10 });
        }

        // Get all creators
        const creators = await db.query.creatorProfiles.findMany({
          with: {
            user: {
              columns: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
              }
            }
          }
        });
        
        res.json(creators);
      } catch (error) {
        console.error('Error fetching creators:', error);
        // Return empty array instead of 500 error
        res.json({ creators: [], total: 0, page: 1, pageSize: 10 });
      }
    });

    app.get('/api/creators/:id', requireAuth(), async (req, res) => {
      try {
        const { id } = req.params;
        const userId = parseInt(id);
        
        // Check if user is admin or the creator themselves
        if (req.user?.role !== 'admin' && req.user?.id !== userId) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const creator = await db.query.users.findFirst({
          where: (users, { eq, and }) => and(
            eq(users.id, userId),
            eq(users.role, 'creator')
          ),
          with: {
            creatorProfile: true
          }
        });
        
        if (!creator) {
          return res.status(404).json({ error: 'Creator not found' });
        }
        
        res.json({
          id: creator.id,
          email: creator.email,
          username: creator.username,
          displayName: creator.display_name,
          avatarUrl: creator.avatar_url,
          bio: creator.bio,
          verified: creator.verified,
          approved: creator.creatorProfile?.approval_status === 'approved',
          createdAt: creator.created_at,
          instagram: creator.creatorProfile?.instagram,
          twitter: creator.creatorProfile?.twitter,
          tiktok: creator.creatorProfile?.tiktok,
          onlyfans: creator.creatorProfile?.onlyfans,
          featuredImageUrl: creator.creatorProfile?.featured_image_url,
          monthlySubscriptionPrice: creator.creatorProfile?.monthly_subscription_price,
          perPostPrice: creator.creatorProfile?.per_post_price
        });
      } catch (error) {
        console.error('Error fetching creator:', error);
        res.status(500).json({ 
          error: 'Failed to fetch creator', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    app.get('/api/creators/:id/content', requireAuth(), async (req, res) => {
      try {
        const { id } = req.params;
        const creatorId = parseInt(id);
        
        // Check if user is admin or the creator themselves
        if (req.user?.role !== 'admin' && req.user?.id !== creatorId) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        
        // For now, return mock content data
        // In a real implementation, you would query the database for creator content
        const mockContent = [
          {
            id: 1,
            title: 'Welcome to my page',
            description: 'This is my first post!',
            contentType: 'image',
            url: '/uploads/sample-image-1.jpg',
            isPremium: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Premium Content',
            description: 'Exclusive content for subscribers',
            contentType: 'image',
            url: '/uploads/sample-image-2.jpg',
            isPremium: true,
            price: 5.99,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        res.json(mockContent);
      } catch (error) {
        console.error('Error fetching creator content:', error);
        res.status(500).json({ 
          error: 'Failed to fetch creator content', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    app.patch('/api/creators/:id/approval', requireAuth(['admin']), async (req, res) => {
      try {
        const { id } = req.params;
        const creatorId = parseInt(id);
        const { approved, rejectionReason } = req.body;
        
        const creator = await db.query.users.findFirst({
          where: (users, { eq, and }) => and(
            eq(users.id, creatorId),
            eq(users.role, 'creator')
          ),
          with: {
            creatorProfile: true
          }
        });
        
        if (!creator) {
          return res.status(404).json({ error: 'Creator not found' });
        }
        
        // Update creator profile approval status
        if (creator.creatorProfile) {
          await db.update(storage.creatorProfiles)
            .set({
              approval_status: approved ? 'approved' : 'rejected',
              approval_date: approved ? new Date().toISOString() : null,
              approved_by: approved ? req.user?.id : null,
              rejection_reason: !approved ? rejectionReason : null
            })
            .where(eq(storage.creatorProfiles.user_id, creatorId));
        } else {
          // Create creator profile if it doesn't exist
          await db.insert(storage.creatorProfiles).values({
            user_id: creatorId,
            approval_status: approved ? 'approved' : 'rejected',
            approval_date: approved ? new Date().toISOString() : null,
            approved_by: approved ? req.user?.id : null,
            rejection_reason: !approved ? rejectionReason : null
          });
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error('Error updating creator approval:', error);
        res.status(500).json({ 
          error: 'Failed to update creator approval', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Followers API endpoints
    app.get('/api/followers', async (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          // Return empty array for unauthenticated users instead of error
          return res.json([]);
        }

        // Get all followers
        const followers = await db.query.followerProfiles.findMany({
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                email: true,
                created_at: true,
                role: true
              }
            }
          }
        });
        
        res.json(followers);
      } catch (error) {
        console.error('Error fetching followers:', error);
        // Return empty array instead of 500 error
        res.json([]);
      }
    });

    // File upload endpoint
    app.post('/api/auth/upload', (req, res) => {
      console.log('Upload request received');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);

      upload.single('file')(req, res, async (err) => {
        if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({ 
            error: 'Upload failed', 
            details: err.message 
          });
        }

        try {
          console.log('File received:', req.file);

          if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ error: 'No file uploaded' });
          }

          const file = req.file;
          const type = req.body.type;

          console.log('Processing file:', {
            path: file.path,
            type: file.mimetype,
            size: file.size,
            destination: file.destination,
            filename: file.filename
          });

          // Ensure upload directory exists
          const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
          console.log('Creating upload directory:', uploadDir);
          await fsPromises.mkdir(uploadDir, { recursive: true });

          // Move file to public uploads directory
          const publicPath = path.join(uploadDir, file.filename);
          console.log('Moving file to:', publicPath);
          await fsPromises.copyFile(file.path, publicPath);
          console.log('File moved successfully');

          // Process image if it's a photo
          if (file.mimetype.startsWith('image/')) {
            try {
              console.log('Processing image...');
              await processImage(publicPath, {
                quality: 80,
                maxWidth: 2000,
                maxHeight: 2000
              });
              console.log('Image processed successfully');
            } catch (processError) {
              console.error('Image processing error:', processError);
            }
          }

          // Return the URL
          const url = `/uploads/${file.filename}`;
          console.log('Upload successful, returning URL:', url);
          res.json({ url });
        } catch (error) {
          console.error('Upload error:', error);
          res.status(500).json({ 
            error: 'Upload failed', 
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
    });

    // Signup endpoint
    app.post("/api/auth/signup", upload.fields([
      { name: 'bodyPhoto', maxCount: 1 },
      { name: 'licensePhoto', maxCount: 1 }
    ]), async (req, res) => {
      try {
        const { email, password, role, username, displayName, ...modelData } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email)
        });

        if (existingUser) {
          return res.status(400).json({
            message: "Email already registered"
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await db.insert(schema.users).values({
          email,
          password: hashedPassword,
          role,
          username,
          displayName
        }).returning().get();

        // If creator role, create model profile
        if (role === 'creator') {
          const bodyPhotoUrl = files?.bodyPhoto?.[0]?.path;
          const licensePhotoUrl = files?.licensePhoto?.[0]?.path;

          await db.insert(schema.creatorProfiles).values({
            userId: user.id,
            ...modelData,
            bodyPhotoUrl,
            licensePhotoUrl
          });
        }

        // If follower role, create follower profile
        if (role === 'follower') {
          await db.insert(schema.followerProfiles).values({
            userId: user.id,
            preferences: req.body.interests ? JSON.stringify(req.body.interests) : null
          });
        }

        // Log the user in
        req.login(user, (err) => {
          if (err) {
            console.error('Login error after signup:', err);
            return res.status(500).json({
              message: "Error logging in after signup"
            });
          }

          return res.json({
            message: "Account created successfully",
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              username: user.username
            },
            redirectTo: role === 'creator' ? '/creator/dashboard' : '/gallery'
          });
        });
      } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
          message: "Error creating account"
        });
      }
    });

    // Basic health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // API health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Create initial admin user if it doesn't exist
    app.post('/api/auth/setup', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Check if any users exist
        const existingUsers = await db.select().from(users);
        if (existingUsers.length > 0) {
          return res.status(400).json({ message: 'Setup already completed' });
        }

        // Create admin user
        const hashedPassword = await hashPassword(password);
        const [user] = await db.insert(users).values({
          email,
          password: hashedPassword,
          role: 'admin'
        }).returning();

        return res.json({ message: 'Admin user created successfully', user: { id: user.id, email: user.email } });
      } catch (error) {
        console.error('Failed to create admin user:', error);
        return res.status(500).json({ message: 'Failed to create admin user' });
      }
    });

    // Set up authentication
    setupAuth(app);

    // Session status endpoint
    app.get('/api/auth/session', (req, res) => {
      // Set CORS headers explicitly for this endpoint
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, cache-control, pragma, Accept, X-Requested-With');
      
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      
      if (!req.session) {
        return res.json({ authenticated: false });
      }
      
      res.json({ 
        authenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, email: req.user.email } : null
      });
    });

    // Serve uploaded files with proper CORS and security headers
    app.use('/uploads', (req, res, next) => {
      // Only allow GET requests
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
      }
      
      // Set security headers
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('X-Content-Type-Options', 'nosniff');
      
      // Set content type for videos
      if (req.path.endsWith('.mp4')) {
        res.type('video/mp4');
      }
      next();
    });
    
    // Serve static files after setting headers
    app.use('/uploads', express.static(publicUploadsDir, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        // Set appropriate content type based on file extension
        if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (path.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.webp')) {
          res.setHeader('Content-Type', 'image/webp');
        }
      }
    }));
    
    console.log('Serving uploads from:', publicUploadsDir);

    // Debug endpoint to check if files exist
    app.get('/api/debug/files', async (req, res) => {
      try {
        // Check if uploads directories exist
        const serverUploadsExists = fs.existsSync(uploadDir);
        const clientUploadsExists = fs.existsSync(publicUploadsDir);
        
        // Get list of files in both directories
        const serverFiles = serverUploadsExists ? fs.readdirSync(uploadDir) : [];
        const clientFiles = clientUploadsExists ? fs.readdirSync(publicUploadsDir) : [];
        
        res.json({
          directories: {
            serverUploads: {
              path: uploadDir,
              exists: serverUploadsExists,
              fileCount: serverFiles.length,
              sampleFiles: serverFiles.slice(0, 5)
            },
            clientUploads: {
              path: publicUploadsDir,
              exists: clientUploadsExists,
              fileCount: clientFiles.length,
              sampleFiles: clientFiles.slice(0, 5)
            }
          }
        });
      } catch (error) {
        console.error('Debug files endpoint error:', error);
        res.status(500).json({
          error: 'Failed to check files',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Gallery endpoints
    // Initialize upload directories
    await ensureUploadDirectories();

    app.post("/api/:type(gallery|featured)", requireAuth, async (req, res) => {
      console.log(`Gallery upload request received for type: ${req.params.type}`);
      console.log(`Server port: ${process.env.PORT || 3004}`);
      console.log(`Authentication status:`, {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'function not available',
        hasSession: !!req.session,
        hasUser: !!req.user,
        userRole: req.user?.role || 'none'
      });
      console.log(`Request headers:`, {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        host: req.headers.host,
        origin: req.headers.origin,
      });
      
      let originalPath: string | null = null;
      let serverProcessedPath: string | null = null;
      let clientProcessedPath: string | null = null;
      
      try {
        // First ensure upload directories exist
        await ensureUploadDirectories();
        console.log('Upload directories verified');
        
        // Handle file upload with proper error handling
        const file = await new Promise<Express.Multer.File>((resolve, reject) => {
          console.log('Starting multer file upload process');
          upload.single('image')(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
              console.error('Multer upload error:', err);
              if (err.code === 'LIMIT_FILE_SIZE') {
                reject(new Error('File size too large. Maximum size is 5MB'));
              } else {
                reject(new Error(`Upload error: ${err.message}`));
              }
              return;
            } else if (err) {
              console.error('Unknown upload error:', err);
              reject(new Error('Failed to upload file'));
              return;
            }
            
            if (!req.file) {
              console.error('No file in request');
              reject(new Error('No file uploaded'));
              return;
            }

            console.log('File upload successful:', {
              filename: req.file.filename,
              size: req.file.size,
              mimetype: req.file.mimetype
            });

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(req.file.mimetype)) {
              console.error('Invalid file type:', req.file.mimetype);
              reject(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
              return;
            }

            resolve(req.file);
          });
        });
        
        // Log request details
        console.log('Gallery upload request:', { 
          body: req.body, 
          file: {
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
          }
        });

        originalPath = file.path;

        // Validate and process the image
        await ensureImageQuality(originalPath);
        
        // Generate processed image filename with timestamp for uniqueness
        const timestamp = Date.now();
        const processedFilename = `processed_${timestamp}_${file.filename}`;
        
        // Save to both upload directories to ensure availability
        serverProcessedPath = path.join(uploadDir, processedFilename);
        clientProcessedPath = path.join(publicUploadsDir, processedFilename);
        
        // Ensure we can write to the destinations
        await fsPromises.access(path.dirname(serverProcessedPath), fs.constants.W_OK);
        await fsPromises.access(path.dirname(clientProcessedPath), fs.constants.W_OK);
        
        // Process the image and save to server uploads
        const processedImage = await processImage(originalPath, serverProcessedPath);
        
        // Also copy to client public uploads
        await fsPromises.copyFile(serverProcessedPath, clientProcessedPath);
        
        const imageUrl = `/uploads/${processedFilename}`;
        const title = req.body.title || "Featured Model";
        
        console.log('Processing gallery upload complete:', {
          originalPath,
          serverProcessedPath,
          clientProcessedPath,
          dimensions: `${processedImage.width}x${processedImage.height}`,
          url: imageUrl,
          title
        });

        // Parse and validate tags
        let tags: string[] = [];
        if (req.body.tags) {
          try {
            const parsedTags = JSON.parse(req.body.tags);
            if (!Array.isArray(parsedTags)) {
              throw new Error('Tags must be an array');
            }
            tags = parsedTags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
          } catch (error) {
            console.warn('Failed to parse tags:', error);
            // Continue without tags rather than failing the upload
          }
        }

        // Validate content rating
        const contentRating = req.body.contentRating === 'nsfw' ? 'nsfw' : 'sfw';
        
        // Parse isPremium flag properly (handle both string and boolean values)
        const isPremium = req.body.isPremium === true || req.body.isPremium === 'true' ? true : false;
        console.log('Setting isPremium to:', isPremium, 'from value:', req.body.isPremium);
        
        // Insert into database
        const result = await db.insert(gallery).values({
          url: imageUrl,
          title: title,
          type: req.params.type,
          contentRating,
          is_premium: isPremium,
          createdAt: new Date().toISOString(),
          tags,
          instagram: req.body.instagram?.trim() || null,
          tiktok: req.body.tiktok?.trim() || null,
          twitter: req.body.twitter?.trim() || null,
          onlyfans: req.body.onlyfans?.trim() || null,
          description: req.body.description?.trim() || null
        }).returning();

        // Clean up original file after successful processing
        try {
          if (originalPath) {
            try {
              await fsPromises.unlink(originalPath);
              console.log('Cleaned up original file:', originalPath);
            } catch (e) {
              console.warn('Failed to delete original file:', e);
            }
          }
        } catch (cleanupError) {
          console.error('Failed to clean up files after error:', cleanupError);
        }

        console.log('Successfully saved gallery media:', result[0]);
        return res.json(result[0]);
      } catch (err) {
        console.error('Failed to upload media:', err);

        // Clean up any files on error
        try {
          if (originalPath) {
            try {
              await fsPromises.unlink(originalPath);
              console.log('Cleaned up original file:', originalPath);
            } catch (e) {
              console.warn('Failed to delete original file:', e);
            }
          }
        } catch (cleanupError) {
          console.error('Failed to clean up files after error:', cleanupError);
        }

        if (err instanceof Error) {
          if (err.message.includes('Image dimensions too small')) {
            return res.status(400).json({ 
              message: err.message,
              error: err.message,
              code: 'INVALID_IMAGE_DIMENSIONS'
            });
          } else if (err.message.includes('Invalid image format')) {
            return res.status(415).json({ 
              message: err.message,
              error: err.message,
              code: 'INVALID_IMAGE_FORMAT'
            });
          } else if (err.message.includes('File size too large')) {
            return res.status(413).json({ 
              message: 'File size too large. Maximum size is 5MB',
              error: err.message,
              code: 'FILE_TOO_LARGE'
            });
          } else if (err.message.includes('Failed to save to database')) {
            return res.status(500).json({ 
              message: 'Database error while saving image',
              error: err.message,
              code: 'DATABASE_ERROR'
            });
          } else if (err.message.includes('Failed to process image')) {
            return res.status(500).json({ 
              message: 'Error processing image',
              error: err.message,
              code: 'IMAGE_PROCESSING_ERROR'
            });
          }
        }

        return res.status(500).json({ 
          message: 'Failed to upload media',
          error: err instanceof Error ? err.message : 'Unknown error',
          code: 'UPLOAD_ERROR'
        });
      } finally {
        // Any cleanup if needed
      }
    });

    // Temporary endpoint for testing gallery uploads without authentication
    app.post("/api/test-gallery-upload", upload.single('image'), async (req, res) => {
      console.log(`Test gallery upload request received`);
      console.log(`Request headers:`, {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        host: req.headers.host,
        origin: req.headers.origin,
      });
      
      try {
        if (!req.file) {
          console.log('No file in request');
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        console.log('File upload successful:', {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        // Skip any image processing for the test endpoint
        // Just return success immediately
        const imageUrl = `/uploads/${req.file.filename}`;
        
        return res.json({ 
          message: 'Test upload successful',
          file: {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path,
            url: imageUrl
          }
        });
      } catch (err) {
        console.error('Test upload failed:', err);
        return res.status(500).json({ 
          message: 'Test upload failed',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    });

    // Update gallery item premium status
    app.patch("/api/gallery/:id/premium", requireAuth, async (req, res) => {
      try {
        const { id } = req.params;
        const { isPremium } = req.body;
        
        // Convert isPremium to boolean properly
        const isPremiumBool = isPremium === true || isPremium === 'true' ? true : false;
        
        console.log(`Updating premium status for gallery item ${id} to ${isPremiumBool}`);
        
        // Validate the ID
        if (!id || isNaN(Number(id))) {
          return res.status(400).json({ 
            message: "Invalid gallery item ID" 
          });
        }
        
        // Update the gallery item
        const result = await db.update(gallery)
          .set({ is_premium: isPremiumBool })
          .where(eq(gallery.id, Number(id)))
          .returning();
        
        if (!result.length) {
          return res.status(404).json({ 
            message: "Gallery item not found" 
          });
        }
        
        console.log('Successfully updated gallery item:', result[0]);
        res.json({ 
          message: "Gallery item updated", 
          updatedItem: result[0] 
        });
      } catch (error) {
        console.error('Failed to update gallery item:', error);
        res.status(500).json({ 
          message: "Failed to update gallery item",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Batch update gallery items to remove premium status
    app.post("/api/gallery/remove-premium", requireAuth, async (req, res) => {
      try {
        console.log('Removing premium status from all gallery items');
        
        // Update all gallery items
        const result = await db.update(gallery)
          .set({ is_premium: false })
          .where(eq(gallery.is_premium, true))
          .returning();
        
        console.log(`Successfully updated ${result.length} gallery items`);
        res.json({ 
          message: `Successfully removed premium status from ${result.length} gallery items`, 
          updatedCount: result.length 
        });
      } catch (error) {
        console.error('Failed to update gallery items:', error);
        res.status(500).json({ 
          message: "Failed to update gallery items",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    // Featured models endpoints
    app.post("/api/featured", requireAuth, upload.single("image"), async (req, res) => {
      let error: unknown;
      try {
        // Log request details
        console.log('Featured upload request:', { 
          body: req.body, 
          file: req.file ? {
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
          } : null,
          auth: req.headers.authorization ? 'present' : 'missing'
        });

        // Validate file
        if (!req.file) {
          console.error('No file provided in request');
          return res.status(400).json({ message: "No image file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          console.error('Invalid file type:', req.file.mimetype);
          return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." });
        }

        // Ensure upload directory exists and is writable
        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
            console.log('Created upload directory:', uploadDir);
          }
          await fsPromises.access(uploadDir, fs.constants.W_OK);
        } catch (error) {
          console.error('Upload directory error:', error);
          return res.status(500).json({ 
            message: "Server configuration error: Upload directory is not accessible",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }

        // Process and validate the image
        await ensureImageQuality(req.file.path);
        
        // Generate processed image filename
        const processedFilename = `processed_${req.file.filename}`;
        const publicImagePath = path.join(publicUploadsDir, processedFilename);
        
        // Process the image to ensure good composition
        const processedImage = await processImage(req.file.path, publicImagePath);
        
        const imageUrl = `/uploads/${processedFilename}`;
        const title = req.body.title || req.file.originalname;
        
        console.log('Processing featured upload:', {
          originalPath: req.file.path,
          processedPath: publicImagePath,
          dimensions: `${processedImage.width}x${processedImage.height}`,
          url: imageUrl,
          title
        });

        const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
        console.log('Inserting into database:', {
          url: imageUrl,
          title: title,
          type: 'featured',
          tags
        });

        const result = await db.insert(gallery).values({
          url: imageUrl,
          title: title,
          type: 'featured',
          createdAt: new Date().toISOString(),
          tags,
          instagram: req.body.instagram || null,
          tiktok: req.body.tiktok || null,
          twitter: req.body.twitter || null,
          onlyfans: req.body.onlyfans || null,
          description: req.body.description || null
        }).returning();

        console.log('Successfully saved featured media:', result[0]);
        res.json(result[0]);
      } catch (error) {
        console.error('Failed to upload media:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({ 
          message: "Failed to upload media", 
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
      } finally {
        // Clean up any uploaded files if there was an error
        if (req.file && error) {
          try {
            await fsPromises.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Failed to clean up uploaded file:', unlinkError);
          }
        }
      }
    });

    // Combined endpoint for gallery and featured content
  } catch (error) {
    console.error('Error during route registration:', error);
    throw error; // Re-throw to ensure the server fails on startup
  }
}