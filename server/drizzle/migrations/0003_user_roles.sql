-- Add role and profile fields to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'follower' CHECK (role IN ('admin', 'creator', 'follower'));
ALTER TABLE users ADD COLUMN profile_id INTEGER;
ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add subscription status table
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    follower_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Add creator profiles table
CREATE TABLE creator_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    alias_name TEXT,
    instagram TEXT,
    twitter TEXT,
    tiktok TEXT,
    onlyfans TEXT,
    featured_image_url TEXT,
    subscription_price REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add follower profiles table
CREATE TABLE follower_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    preferences TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
