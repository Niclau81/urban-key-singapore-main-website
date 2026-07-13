CREATE TABLE `agentProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountType` enum('agent','co_broker') NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`middleName` varchar(100),
	`lastName` varchar(100) NOT NULL,
	`contactNumber` varchar(32) NOT NULL,
	`email` varchar(320) NOT NULL,
	`companyName` varchar(180) NOT NULL,
	`companyAddress` varchar(320) NOT NULL,
	`postalCode` varchar(12),
	`agentLicenseNumber` varchar(80) NOT NULL,
	`jobTitle` varchar(120),
	`businessRegistrationNumber` varchar(80),
	`website` varchar(320),
	`termsAcceptedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentProfiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `agentProfiles_license_unique` UNIQUE(`agentLicenseNumber`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` varchar(40) NOT NULL,
	`termMonths` int NOT NULL,
	`status` enum('pending','active','failed','cancelled','expired') NOT NULL DEFAULT 'pending',
	`stripeCheckoutSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeCustomerId` varchar(255),
	`receiptEmail` varchar(320) NOT NULL,
	`receiptEmailedAt` timestamp,
	`startedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionOrders_checkoutSession_unique` UNIQUE(`stripeCheckoutSessionId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);