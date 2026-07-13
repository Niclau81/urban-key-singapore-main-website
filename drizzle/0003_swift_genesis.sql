ALTER TABLE `propertyListings` ADD `commercialUsage` varchar(160);--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `floorLoading` decimal(7,2);--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `ceilingHeight` decimal(6,2);--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `loadingAccess` varchar(180);--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `parkingLots` int;--> statement-breakpoint
ALTER TABLE `propertyListings` ADD `availableFrom` varchar(24);