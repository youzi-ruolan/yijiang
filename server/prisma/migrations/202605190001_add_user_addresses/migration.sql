CREATE TABLE `UserAddress` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `countryName` VARCHAR(191) NOT NULL DEFAULT '中国',
  `countryCode` VARCHAR(191) NOT NULL DEFAULT 'chn',
  `provinceName` VARCHAR(191) NOT NULL,
  `provinceCode` VARCHAR(191) NOT NULL,
  `cityName` VARCHAR(191) NOT NULL,
  `cityCode` VARCHAR(191) NOT NULL,
  `districtName` VARCHAR(191) NOT NULL,
  `districtCode` VARCHAR(191) NOT NULL,
  `detailAddress` VARCHAR(191) NOT NULL,
  `addressTag` VARCHAR(191) NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `UserAddress_userId_isDefault_createdAt_idx` (`userId`, `isDefault`, `createdAt`),
  INDEX `UserAddress_userId_createdAt_idx` (`userId`, `createdAt`),
  CONSTRAINT `UserAddress_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `MiniProgramUser`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
