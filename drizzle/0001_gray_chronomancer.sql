CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`event_name` text NOT NULL,
	`path` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_events_session` ON `analytics_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_events_name_time` ON `analytics_events` (`event_name`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `analytics_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_hash` text NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`page_count` integer DEFAULT 1 NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	`medium` text DEFAULT 'none' NOT NULL,
	`campaign` text,
	`landing_path` text NOT NULL,
	`referrer_host` text,
	`device` text NOT NULL,
	`country` text,
	`region` text,
	`consent_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_sessions_last_seen` ON `analytics_sessions` (`last_seen`);--> statement-breakpoint
CREATE INDEX `idx_analytics_sessions_visitor` ON `analytics_sessions` (`visitor_hash`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `therapist_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_hi` text NOT NULL,
	`speciality_en` text NOT NULL,
	`speciality_hi` text NOT NULL,
	`image_key` text,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
