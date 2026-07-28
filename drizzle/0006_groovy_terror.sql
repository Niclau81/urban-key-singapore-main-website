CREATE TABLE `propertyListingFloorPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(768) NOT NULL,
	`url` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(80) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyListingFloorPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyListingFloorPlans_listing_unique` UNIQUE(`listingId`)
);
