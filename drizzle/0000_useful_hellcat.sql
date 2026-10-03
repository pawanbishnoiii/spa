CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`age` integer NOT NULL,
	`service` text NOT NULL,
	`therapist_preference` text,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`delete_after` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_reference_unique` ON `enquiries` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_idempotency_key_unique` ON `enquiries` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `enquiry_rate_limits` (
	`fingerprint` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
