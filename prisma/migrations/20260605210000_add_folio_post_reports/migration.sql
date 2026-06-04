-- Folio Connect: user-submitted post reports.
-- Anyone can report a post; admins triage the queue at /admin/laporan and
-- either delete the post (with a reason that notifies the author) or dismiss.

CREATE TABLE `folio_post_reports` (
    `fld_report_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_post_id` INTEGER NOT NULL,
    `fld_reporter_id` INTEGER NOT NULL,
    `fld_reason` TEXT NOT NULL,
    `fld_status` ENUM('PENDING', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `folio_post_reports_fld_post_id_idx`(`fld_post_id`),
    INDEX `folio_post_reports_fld_reporter_id_idx`(`fld_reporter_id`),
    INDEX `folio_post_reports_fld_status_idx`(`fld_status`),
    PRIMARY KEY (`fld_report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `folio_post_reports` ADD CONSTRAINT `folio_post_reports_post_fkey`
    FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts`(`fld_post_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_post_reports` ADD CONSTRAINT `folio_post_reports_reporter_fkey`
    FOREIGN KEY (`fld_reporter_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
