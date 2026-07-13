CREATE TABLE `propertyListingImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(768) NOT NULL,
	`url` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(80) NOT NULL,
	`fileSize` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyListingImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `description` text;--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `address` varchar(240);--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `mrtName` varchar(120);