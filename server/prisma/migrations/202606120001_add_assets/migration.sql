CREATE TABLE `Asset` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `url` TEXT NOT NULL,
  `cover` TEXT NULL,
  `description` TEXT NULL,
  `tags` JSON NOT NULL,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Asset_type_sort_idx` ON `Asset`(`type`, `sort`);
CREATE INDEX `Asset_status_sort_idx` ON `Asset`(`status`, `sort`);
