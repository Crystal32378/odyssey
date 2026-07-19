CREATE TABLE `encounter_receipts` (
	`journey_id` text NOT NULL,
	`layer` text NOT NULL,
	`trigger_id` text NOT NULL,
	`payload_hash` text NOT NULL,
	`status` text NOT NULL,
	`result_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`journey_id`, `layer`, `trigger_id`),
	CONSTRAINT "encounter_receipts_layer_check" CHECK("encounter_receipts"."layer" IN ('divine', 'luna')),
	CONSTRAINT "encounter_receipts_status_check" CHECK("encounter_receipts"."status" IN ('pending', 'ready', 'authored_fallback'))
);
--> statement-breakpoint
CREATE INDEX `encounter_receipts_expires_at_idx` ON `encounter_receipts` (`expires_at`);