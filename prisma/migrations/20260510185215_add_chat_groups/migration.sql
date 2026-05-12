-- AlterTable
ALTER TABLE `private_messages` ADD COLUMN `fld_chat_group_id` INTEGER NULL,
    MODIFY `fld_receiver_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `chat_groups` (
    `fld_chat_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_name` VARCHAR(191) NOT NULL,
    `fld_created_by` INTEGER NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`fld_chat_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_group_members` (
    `fld_chat_member_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_chat_group_id` INTEGER NOT NULL,
    `fld_user_id` INTEGER NOT NULL,
    `fld_is_admin` BOOLEAN NOT NULL DEFAULT false,
    `fld_last_read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fld_joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_group_members_fld_user_id_idx`(`fld_user_id`),
    UNIQUE INDEX `uniq_chat_group_member`(`fld_chat_group_id`, `fld_user_id`),
    PRIMARY KEY (`fld_chat_member_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `private_messages_fld_chat_group_id_idx` ON `private_messages`(`fld_chat_group_id`);

-- AddForeignKey
ALTER TABLE `private_messages` ADD CONSTRAINT `private_messages_fld_chat_group_id_fkey` FOREIGN KEY (`fld_chat_group_id`) REFERENCES `chat_groups`(`fld_chat_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_groups` ADD CONSTRAINT `chat_groups_fld_created_by_fkey` FOREIGN KEY (`fld_created_by`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_group_members` ADD CONSTRAINT `chat_group_members_fld_chat_group_id_fkey` FOREIGN KEY (`fld_chat_group_id`) REFERENCES `chat_groups`(`fld_chat_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_group_members` ADD CONSTRAINT `chat_group_members_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
