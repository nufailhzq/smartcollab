-- Live chat features: user blocks, mutes, and per-message soft delete
-- (unsend). Plus the "deletedAt" timestamp on private_messages so the bubble
-- can render "Mesej dipadam" without losing the row's audit trail.

ALTER TABLE `private_messages`
    ADD COLUMN `fld_deleted_at` DATETIME(3) NULL;

CREATE TABLE `user_blocks` (
    `fld_block_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_blocker_id` INTEGER NOT NULL,
    `fld_blocked_id` INTEGER NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uniq_user_block`(`fld_blocker_id`, `fld_blocked_id`),
    INDEX `user_blocks_fld_blocked_id_idx`(`fld_blocked_id`),
    PRIMARY KEY (`fld_block_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_fld_blocker_id_fkey`
    FOREIGN KEY (`fld_blocker_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_fld_blocked_id_fkey`
    FOREIGN KEY (`fld_blocked_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `user_mutes` (
    `fld_mute_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_muter_id` INTEGER NOT NULL,
    `fld_muted_id` INTEGER NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uniq_user_mute`(`fld_muter_id`, `fld_muted_id`),
    INDEX `user_mutes_fld_muted_id_idx`(`fld_muted_id`),
    PRIMARY KEY (`fld_mute_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_mutes` ADD CONSTRAINT `user_mutes_fld_muter_id_fkey`
    FOREIGN KEY (`fld_muter_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_mutes` ADD CONSTRAINT `user_mutes_fld_muted_id_fkey`
    FOREIGN KEY (`fld_muted_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
