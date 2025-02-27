-- Add new fields to users table
ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 0;

-- Update creator_profiles table
ALTER TABLE creator_profiles ADD COLUMN monthly_subscription_price REAL NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN per_post_price REAL NOT NULL DEFAULT 0;
ALTER TABLE creator_profiles ADD COLUMN approval_status TEXT CHECK(approval_status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending';
ALTER TABLE creator_profiles ADD COLUMN approval_date TEXT;
ALTER TABLE creator_profiles ADD COLUMN approved_by INTEGER REFERENCES users(id);
ALTER TABLE creator_profiles ADD COLUMN rejection_reason TEXT;
ALTER TABLE creator_profiles DROP COLUMN subscription_price;

-- Create content table
CREATE TABLE content (
  id INTEGER PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK(content_type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_premium INTEGER DEFAULT 0,
  price REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id),
  creator_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('monthly', 'per_post')),
  start_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TEXT,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create content_purchases table
CREATE TABLE content_purchases (
  id INTEGER PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES content(id),
  follower_id INTEGER NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  purchase_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_subscriptions_follower_id ON subscriptions(follower_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_content_purchases_content_id ON content_purchases(content_id);
CREATE INDEX idx_content_purchases_follower_id ON content_purchases(follower_id);
