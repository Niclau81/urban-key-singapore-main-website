CREATE TABLE `propertyListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`mode` enum('Sell','Rent-Out') NOT NULL,
	`district` varchar(80) NOT NULL,
	`propertyType` varchar(80) NOT NULL,
	`price` int NOT NULL,
	`size` int NOT NULL,
	`mrtMinutes` int NOT NULL,
	`tenure` varchar(60) NOT NULL,
	`status` enum('draft','active','paused') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyListings_id` PRIMARY KEY(`id`)
);
