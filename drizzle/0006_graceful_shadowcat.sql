ALTER TABLE `lockers` ADD `keyCode` varchar(64);--> statement-breakpoint
ALTER TABLE `lockers` ADD `nameplateLabel` varchar(255);--> statement-breakpoint
ALTER TABLE `lockers` ADD `lockerType` enum('individual','corporate','enterprise','oversized') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `lockers` ADD `paymentOverdue` boolean DEFAULT false;