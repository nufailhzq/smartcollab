-- CreateTable
CREATE TABLE `recent_access` (
    `fld_recent_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_type` ENUM('COURSE', 'ASSIGNMENT', 'GROUP', 'CONTENT', 'SUBMISSION') NOT NULL,
    `fld_ref_id` INTEGER NULL,
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_link` VARCHAR(191) NOT NULL,
    `fld_accessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `recent_access_fld_user_id_fld_accessed_at_idx`(`fld_user_id`, `fld_accessed_at`),
    UNIQUE INDEX `uniq_user_type_ref`(`fld_user_id`, `fld_type`, `fld_ref_id`),
    PRIMARY KEY (`fld_recent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bulletins` (
    `fld_bulletin_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_body` TEXT NOT NULL,
    `fld_image_path` VARCHAR(191) NULL,
    `fld_link_url` VARCHAR(191) NULL,
    `fld_link_label` VARCHAR(191) NULL,
    `fld_is_active` BOOLEAN NOT NULL DEFAULT true,
    `fld_is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `fld_created_by` INTEGER NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fld_updated_at` DATETIME(3) NOT NULL,

    INDEX `bulletins_fld_is_active_fld_is_pinned_fld_created_at_idx`(`fld_is_active`, `fld_is_pinned`, `fld_created_at`),
    PRIMARY KEY (`fld_bulletin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recent_access` ADD CONSTRAINT `recent_access_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulletins` ADD CONSTRAINT `bulletins_fld_created_by_fkey` FOREIGN KEY (`fld_created_by`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
