-- AlterTable
ALTER TABLE `courses` ADD COLUMN `fld_groups_locked` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `group_access_requests` (
    `fld_access_req_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_type` ENUM('JOIN', 'LEAVE') NOT NULL,
    `fld_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `fld_course_id` INTEGER NOT NULL,
    `fld_group_id` INTEGER NOT NULL,
    `fld_student_id` INTEGER NOT NULL,
    `fld_reason` TEXT NULL,
    `fld_responded_by` INTEGER NULL,
    `fld_responded_at` DATETIME(3) NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `group_access_requests_fld_course_id_fld_status_idx`(`fld_course_id`, `fld_status`),
    INDEX `group_access_requests_fld_student_id_idx`(`fld_student_id`),
    PRIMARY KEY (`fld_access_req_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `group_access_requests` ADD CONSTRAINT `group_access_requests_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_access_requests` ADD CONSTRAINT `group_access_requests_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups`(`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_access_requests` ADD CONSTRAINT `group_access_requests_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_access_requests` ADD CONSTRAINT `group_access_requests_fld_responded_by_fkey` FOREIGN KEY (`fld_responded_by`) REFERENCES `users`(`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
