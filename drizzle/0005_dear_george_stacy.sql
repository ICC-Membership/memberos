CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`dealType` enum('Equity','Consulting','Partnership','Acquisition','Advisory') NOT NULL DEFAULT 'Equity',
	`industry` varchar(128),
	`stage` enum('Intake','Diligence','Term Sheet','Closed','Passed') NOT NULL DEFAULT 'Intake',
	`askAmount` varchar(64),
	`equityOffered` varchar(32),
	`revenue` varchar(64),
	`ebitda` varchar(64),
	`useOfFunds` text,
	`founderBackground` text,
	`competitiveAdvantage` text,
	`keyRisks` text,
	`exitStrategy` text,
	`aiMemo` text,
	`score` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lockerHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lockerNumber` varchar(16) NOT NULL,
	`bank` varchar(32),
	`fromMemberName` varchar(255),
	`toMemberName` varchar(255),
	`action` enum('assigned','unassigned','moved') DEFAULT 'assigned',
	`performedBy` varchar(255) DEFAULT 'Andrew Frakes',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lockerHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`memberName` varchar(255),
	`authorName` varchar(255) DEFAULT 'Andrew Frakes',
	`note` text NOT NULL,
	`type` enum('general','payment','complaint','compliment','winback','apex') DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memberNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemErrors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(64) NOT NULL,
	`errorType` varchar(128),
	`message` text,
	`resolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemErrors_id` PRIMARY KEY(`id`)
);
