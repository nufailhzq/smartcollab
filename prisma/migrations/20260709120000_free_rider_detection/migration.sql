-- CreateTable
CREATE TABLE `peer_assessments` (
    `fld_peer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_assignment_id` INTEGER NOT NULL,
    `fld_group_id` INTEGER NOT NULL,
    `fld_rater_id` INTEGER NOT NULL,
    `fld_ratee_id` INTEGER NOT NULL,
    `fld_contribution_score` INTEGER NOT NULL,
    `fld_comment` TEXT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `peer_assessments_fld_assignment_id_fld_ratee_id_idx`(`fld_assignment_id`, `fld_ratee_id`),
    INDEX `peer_assessments_fld_group_id_idx`(`fld_group_id`),
    UNIQUE INDEX `uniq_peer_assessment`(`fld_assignment_id`, `fld_rater_id`, `fld_ratee_id`),
    PRIMARY KEY (`fld_peer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contribution_logs` (
    `fld_log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_group_id` INTEGER NOT NULL,
    `fld_assignment_id` INTEGER NULL,
    `fld_action_type` ENUM('COMMENT', 'STATUS_CHANGE', 'PAGE_VIEW', 'LOGIN') NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contribution_logs_fld_group_id_fld_assignment_id_idx`(`fld_group_id`, `fld_assignment_id`),
    INDEX `contribution_logs_fld_user_id_fld_created_at_idx`(`fld_user_id`, `fld_created_at`),
    PRIMARY KEY (`fld_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `self_declared_contributions` (
    `fld_self_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_group_id` INTEGER NOT NULL,
    `fld_assignment_id` INTEGER NOT NULL,
    `fld_description` TEXT NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fld_updated_at` DATETIME(3) NOT NULL,

    INDEX `self_declared_contributions_fld_group_id_fld_assignment_id_idx`(`fld_group_id`, `fld_assignment_id`),
    UNIQUE INDEX `uniq_self_declaration`(`fld_user_id`, `fld_assignment_id`),
    PRIMARY KEY (`fld_self_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `peer_assessments` ADD CONSTRAINT `peer_assessments_fld_assignment_id_fkey` FOREIGN KEY (`fld_assignment_id`) REFERENCES `assignments`(`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_assessments` ADD CONSTRAINT `peer_assessments_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups`(`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_assessments` ADD CONSTRAINT `peer_assessments_fld_rater_id_fkey` FOREIGN KEY (`fld_rater_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_assessments` ADD CONSTRAINT `peer_assessments_fld_ratee_id_fkey` FOREIGN KEY (`fld_ratee_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution_logs` ADD CONSTRAINT `contribution_logs_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution_logs` ADD CONSTRAINT `contribution_logs_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups`(`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution_logs` ADD CONSTRAINT `contribution_logs_fld_assignment_id_fkey` FOREIGN KEY (`fld_assignment_id`) REFERENCES `assignments`(`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_declared_contributions` ADD CONSTRAINT `self_declared_contributions_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_declared_contributions` ADD CONSTRAINT `self_declared_contributions_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups`(`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `self_declared_contributions` ADD CONSTRAINT `self_declared_contributions_fld_assignment_id_fkey` FOREIGN KEY (`fld_assignment_id`) REFERENCES `assignments`(`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE;
