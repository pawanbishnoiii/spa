ALTER TABLE `enquiries` ADD `first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `enquiries` ADD `button_id` text DEFAULT 'legacy' NOT NULL;