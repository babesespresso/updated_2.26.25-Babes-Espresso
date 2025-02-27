/// <reference lib="dom" />
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const models = sqliteTable('models', {
  id: integer('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  aliasName: text('alias_name'),
  socialPlatforms: text('social_platforms', { mode: 'json' }).notNull(),
  socialHandles: text('social_handles'),
  onlyFansLink: text('only_fans_link'),
  bodyPhotoUrl: text('body_photo_url').notNull(),
  licensePhotoUrl: text('license_photo_url').notNull(),
  termsAccepted: text('terms_accepted', { mode: 'json' }).notNull()
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('follower'),
  username: text('username').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  verified: integer('verified').default(0),
  isApproved: integer('is_approved').default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  profileId: integer('profile_id')
});

export const creatorProfiles = sqliteTable('creator_profiles', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  aliasName: text('alias_name'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  tiktok: text('tiktok'),
  onlyfans: text('onlyfans'),
  featuredImageUrl: text('featured_image_url'),
  monthlySubscriptionPrice: real('monthly_subscription_price').notNull().default(0),
  perPostPrice: real('per_post_price').notNull().default(0),
  approvalStatus: text('approval_status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  approvalDate: text('approval_date'),
  approvedBy: integer('approved_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
});

export const followerProfiles = sqliteTable('follower_profiles', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  preferences: text('preferences', { mode: 'json' }),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
});

export const content = sqliteTable('content', {
  id: integer('id').primaryKey(),
  creatorId: integer('creator_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  contentType: text('content_type', { enum: ['image', 'video'] }).notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false),
  price: real('price'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey(),
  followerId: integer('follower_id').notNull().references(() => users.id),
  creatorId: integer('creator_id').notNull().references(() => users.id),
  type: text('type', { enum: ['monthly', 'per_post'] }).notNull(),
  startDate: text('start_date').notNull().default('CURRENT_TIMESTAMP'),
  endDate: text('end_date'),
  amount: real('amount').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

export const contentPurchases = sqliteTable('content_purchases', {
  id: integer('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => content.id),
  followerId: integer('follower_id').notNull().references(() => users.id),
  amount: real('amount').notNull(),
  purchaseDate: text('purchase_date').notNull().default('CURRENT_TIMESTAMP'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

// Zod schemas for validation
export const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  contentType: z.enum(['image', 'video']),
  url: z.string().url('Invalid URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).optional()
});

export const subscriptionSchema = z.object({
  type: z.enum(['monthly', 'per_post']),
  amount: z.number().min(0),
});

export const gallery = sqliteTable('gallery', {
  id: integer('id').primaryKey(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull().default('gallery'),
  contentRating: text('content_rating', { enum: ['sfw', 'nsfw'] }).notNull().default('sfw'),
  isPremium: integer('is_premium', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  twitter: text('twitter'),
  onlyfans: text('onlyfans'),
  description: text('description')
});

export const insertModelSchema = createInsertSchema(models)
  .extend({
    dateOfBirth: z.coerce.date(),
    socialPlatforms: z.array(z.string()),
    termsAccepted: z.array(z.boolean()),
    bodyPhoto: z.any(),
    licensePhoto: z.any(),
  })
  .omit({ id: true, bodyPhotoUrl: true, licensePhotoUrl: true });

export const insertUserSchema = createInsertSchema(users)
  .extend({
    role: z.enum(['admin', 'creator', 'follower']).default('follower'),
    username: z.string().min(3).max(30).optional(),
    displayName: z.string().max(50).optional(),
    bio: z.string().max(500).optional(),
  })
  .omit({ id: true, verified: true, createdAt: true, profileId: true });

export const insertCreatorProfileSchema = createInsertSchema(creatorProfiles)
  .extend({
    aliasName: z.string().min(2).max(50).optional(),
    instagram: z.string().max(30).optional(),
    twitter: z.string().max(30).optional(),
    tiktok: z.string().max(30).optional(),
    onlyfans: z.string().url().optional(),
    subscriptionPrice: z.number().min(0).default(0)
  })
  .omit({ id: true, createdAt: true });

export const insertFollowerProfileSchema = createInsertSchema(followerProfiles)
  .extend({
    preferences: z.record(z.string(), z.any()).optional()
  })
  .omit({ id: true, createdAt: true });

export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .extend({
    status: z.enum(['active', 'cancelled', 'expired']),
    expiresAt: z.coerce.date()
  })
  .omit({ id: true, createdAt: true });

// Type definitions
export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = typeof gallery.$inferInsert;

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type InsertCreatorProfile = typeof creatorProfiles.$inferInsert;

export type FollowerProfile = typeof followerProfiles.$inferSelect;
export type InsertFollowerProfile = typeof followerProfiles.$inferInsert;

export type Content = typeof content.$inferSelect;
export type InsertContent = typeof content.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type ContentPurchase = typeof contentPurchases.$inferSelect;
export type InsertContentPurchase = typeof contentPurchases.$inferInsert;