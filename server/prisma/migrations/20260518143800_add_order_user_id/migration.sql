ALTER TABLE `Order`
ADD COLUMN `userId` VARCHAR(191) NULL;

CREATE INDEX `Order_userId_createdAt_idx` ON `Order`(`userId`, `createdAt`);
