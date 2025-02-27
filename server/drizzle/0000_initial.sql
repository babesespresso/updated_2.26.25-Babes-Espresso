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

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  password TEXT NOT NULL
);

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
