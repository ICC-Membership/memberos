ALTER TABLE `prospects` ADD `lightspeedCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `prospects` ADD `visitCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospects` ADD `totalSpend` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospects` ADD `prospectScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prospects` ADD `assignedStaffId` int;--> statement-breakpoint
ALTER TABLE `prospects` ADD `assignedStaffName` varchar(255);--> statement-breakpoint
ALTER TABLE `prospects` ADD `priority` enum('High','Medium','Low') DEFAULT 'Medium';