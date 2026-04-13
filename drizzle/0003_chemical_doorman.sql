CREATE TABLE `emailDraftQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toEmail` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`type` varchar(100) NOT NULL,
	`memberName` varchar(255),
	`tier` varchar(50),
	`contractId` int,
	`phone` varchar(50),
	`monthlyRate` float,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `emailDraftQueue_id` PRIMARY KEY(`id`)
);
