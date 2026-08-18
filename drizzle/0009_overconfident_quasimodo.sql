CREATE TABLE `propertyTourCaptureAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`captureId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(160) NOT NULL,
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyTourCaptureAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyTourCaptures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(768) NOT NULL,
	`url` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(80) NOT NULL,
	`fileSize` int NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`aspectRatio` varchar(24) NOT NULL,
	`horizontalCoverage` int NOT NULL,
	`verticalCoverage` int NOT NULL,
	`floorLabel` varchar(120) NOT NULL,
	`roomLabel` varchar(120) NOT NULL,
	`qualityStatus` enum('uploaded','quality_review','privacy_review','approval_required','approved','rejected','published') NOT NULL DEFAULT 'uploaded',
	`technicalReviewPassed` boolean NOT NULL DEFAULT false,
	`privacyReviewStatus` enum('not_run','review_required','cleared','blocked') NOT NULL DEFAULT 'not_run',
	`manualPrivacyReviewed` boolean NOT NULL DEFAULT false,
	`listingAuthorizationConfirmed` boolean NOT NULL DEFAULT false,
	`captureConsentConfirmed` boolean NOT NULL DEFAULT false,
	`qualityNotes` text,
	`approvedAt` timestamp,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyTourCaptures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `propertyTourCaptures_listing_user_index` ON `propertyTourCaptures` (`listingId`,`userId`);