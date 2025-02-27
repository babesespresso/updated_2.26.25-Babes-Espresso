CREATE TABLE `gallery` (
	`id` integer PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'gallery' NOT NULL,
	`content_rating` text DEFAULT 'sfw' NOT NULL,
	`is_premium` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`instagram` text,
	`tiktok` text,
	`twitter` text,
	`onlyfans` text,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`alias_name` text,
	`social_platforms` text NOT NULL,
	`social_handles` text,
	`only_fans_link` text,
	`body_photo_url` text NOT NULL,
	`license_photo_url` text NOT NULL,
	`terms_accepted` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL
);
