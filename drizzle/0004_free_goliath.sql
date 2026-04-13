CREATE TABLE `lockers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lockerNumber` varchar(16) NOT NULL,
	`section` varchar(32),
	`row` int,
	`col` int,
	`memberId` int,
	`memberName` varchar(255),
	`tier` enum('Visionary','Atabey','APEX'),
	`assignedAt` timestamp,
	`notes` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lockers_id` PRIMARY KEY(`id`),
	CONSTRAINT `lockers_lockerNumber_unique` UNIQUE(`lockerNumber`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`referralCode` varchar(64),
	`shopifyUrl` varchar(1024),
	`email` varchar(320),
	`phone` varchar(32),
	`role` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`toursGivenAllTime` int DEFAULT 0,
	`toursGivenQtr` int DEFAULT 0,
	`closedAllTime` int DEFAULT 0,
	`closedQtr` int DEFAULT 0,
	`closedYTD` int DEFAULT 0,
	`currentRank` int,
	`bonusEligibleQtr` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `tourLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int,
	`staffName` varchar(255),
	`prospectFirstName` varchar(128),
	`prospectLastName` varchar(128),
	`prospectEmail` varchar(320),
	`prospectPhone` varchar(32),
	`cameWithGroup` boolean DEFAULT false,
	`interestedTier` enum('Visionary','Atabey','APEX'),
	`converted` boolean DEFAULT false,
	`memberId` int,
	`notes` text,
	`tourDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tourLogs_id` PRIMARY KEY(`id`)
);
