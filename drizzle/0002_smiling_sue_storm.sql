CREATE TABLE `integrationTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`service` varchar(64) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`accountId` varchar(128),
	`expiresAt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrationTokens_service_unique` UNIQUE(`service`)
);
