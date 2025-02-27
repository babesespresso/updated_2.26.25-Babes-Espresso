-- Add content rating and premium status to gallery table
ALTER TABLE gallery ADD COLUMN content_rating TEXT NOT NULL DEFAULT 'sfw' CHECK (content_rating IN ('sfw', 'nsfw'));
ALTER TABLE gallery ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;
