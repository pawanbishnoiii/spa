CREATE TABLE `therapist_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`therapist_id` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_therapist_photos_profile` ON `therapist_photos` (`therapist_id`);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `encrypted_details` text;