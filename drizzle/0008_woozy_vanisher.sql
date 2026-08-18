CREATE TABLE `propertyAgentAppointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`kind` enum('viewing','owner_contact','lawyer_review','completion','other') NOT NULL,
	`counterparty` varchar(180) NOT NULL,
	`preferredAt` timestamp,
	`status` enum('draft','approval_required','requested','confirmed','completed','cancelled') NOT NULL DEFAULT 'draft',
	`requiresAuthorization` boolean NOT NULL DEFAULT true,
	`authorizedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAgentAppointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAgentAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(160) NOT NULL,
	`actorRole` enum('customer','system','agent','professional') NOT NULL,
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAgentAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAgentCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketId` varchar(40) NOT NULL DEFAULT 'singapore',
	`journey` enum('buy','sell','rent','rent_out') NOT NULL,
	`title` varchar(180) NOT NULL,
	`propertyId` varchar(96),
	`status` enum('intake','sourcing','viewings','paperwork','professional_review','awaiting_authorisation','coordination','completed','on_hold','closed') NOT NULL DEFAULT 'intake',
	`processingConsent` boolean NOT NULL DEFAULT false,
	`processingConsentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyAgentCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAgentCommunications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`channel` enum('email','whatsapp') NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(240),
	`message` text NOT NULL,
	`status` enum('draft','approval_required','authorized_to_send','connection_required','sent','failed','cancelled') NOT NULL DEFAULT 'draft',
	`requiresAuthorization` boolean NOT NULL DEFAULT true,
	`customerAuthorizedAt` timestamp,
	`providerMessageId` varchar(255),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAgentCommunications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAgentDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(240) NOT NULL,
	`category` enum('identity','financial','property','offer','tenancy','tax','legal','other') NOT NULL,
	`status` enum('requested','uploaded','prepared','review_required','ready_for_handoff','handed_to_professional') NOT NULL DEFAULT 'requested',
	`storageKey` varchar(768),
	`url` text,
	`fileName` varchar(255),
	`mimeType` varchar(100),
	`fileSize` int,
	`requiresAuthorization` boolean NOT NULL DEFAULT false,
	`authorizedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyAgentDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAgentHandOffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`destination` enum('lawyer','licensed_agent','hdb','iras','sla','ura','bank','other') NOT NULL,
	`title` varchar(240) NOT NULL,
	`purpose` text NOT NULL,
	`status` enum('not_ready','pack_ready','approval_required','authorized_for_handoff','professionally_submitted','completed','blocked') NOT NULL DEFAULT 'not_ready',
	`requiresAuthorization` boolean NOT NULL DEFAULT true,
	`authorizedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyAgentHandOffs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAgentTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`category` enum('sourcing','paperwork','appointment','professional','government','communication') NOT NULL,
	`ownerRole` enum('customer','agent','lawyer','government','system') NOT NULL,
	`status` enum('pending','in_progress','waiting_customer','waiting_professional','completed','blocked') NOT NULL DEFAULT 'pending',
	`requiresAuthorization` boolean NOT NULL DEFAULT false,
	`authorizedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyAgentTasks_id` PRIMARY KEY(`id`)
);
