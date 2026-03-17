CREATE TABLE `emailCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gmailId` varchar(255),
	`from` varchar(512),
	`subject` varchar(1024),
	`snippet` text,
	`body` text,
	`receivedAt` timestamp,
	`category` enum('inquiry','renewal','issue','event','general') DEFAULT 'general',
	`isRead` boolean DEFAULT false,
	`aiReplyDraft` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailCache_gmailId_unique` UNIQUE(`gmailId`)
);
--> statement-breakpoint
CREATE TABLE `meetingNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`meetingDate` timestamp,
	`rawTranscript` text,
	`aiSummary` text,
	`membershipMentions` text,
	`actionItems` text,
	`fileUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meetingNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(128),
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`tier` enum('Visionary','Atabey','APEX') NOT NULL DEFAULT 'Visionary',
	`status` enum('Active','Paused','Cancelled') NOT NULL DEFAULT 'Active',
	`lockerNumber` varchar(16),
	`lockerSection` varchar(32),
	`joinedAt` timestamp,
	`renewalDate` timestamp,
	`monthlyRate` float,
	`notes` text,
	`visitScore` int DEFAULT 0,
	`spendScore` int DEFAULT 0,
	`referralScore` int DEFAULT 0,
	`tenureScore` int DEFAULT 0,
	`eventScore` int DEFAULT 0,
	`totalScore` int DEFAULT 0,
	`apexEligible` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`source` varchar(128),
	`interestedTier` enum('Visionary','Atabey','APEX'),
	`status` enum('New','Contacted','Tour Scheduled','Proposal Sent','Closed Won','Closed Lost') NOT NULL DEFAULT 'New',
	`referredBy` varchar(255),
	`notes` text,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prospects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`owner` varchar(255),
	`quarter` varchar(16),
	`dueDate` timestamp,
	`status` enum('On Track','Off Track','Done','Not Started') NOT NULL DEFAULT 'Not Started',
	`progressPct` int DEFAULT 0,
	`ninetyUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rocks_id` PRIMARY KEY(`id`)
);
