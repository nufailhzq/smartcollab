-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `fld_reset_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_token_hash` VARCHAR(191) NOT NULL,
    `fld_expires_at` DATETIME(3) NOT NULL,
    `fld_used_at` DATETIME(3) NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_fld_token_hash_key`(`fld_token_hash`),
    INDEX `password_reset_tokens_fld_user_id_idx`(`fld_user_id`),
    PRIMARY KEY (`fld_reset_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_change_codes` (
    `fld_code_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_code_hash` VARCHAR(191) NOT NULL,
    `fld_expires_at` DATETIME(3) NOT NULL,
    `fld_used_at` DATETIME(3) NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `password_change_codes_fld_user_id_idx`(`fld_user_id`),
    PRIMARY KEY (`fld_code_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
