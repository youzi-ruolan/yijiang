CREATE TABLE `MiniProgramUser` (
  `id` VARCHAR(191) NOT NULL,
  `openid` VARCHAR(191) NOT NULL,
  `unionId` VARCHAR(191) NULL,
  `nickName` VARCHAR(191) NOT NULL,
  `avatarUrl` VARCHAR(191) NULL,
  `gender` INTEGER NOT NULL DEFAULT 0,
  `phoneNumber` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `MiniProgramUser_openid_key`(`openid`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
