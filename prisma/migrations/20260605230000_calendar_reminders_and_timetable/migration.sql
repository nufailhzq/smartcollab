-- Calendar reminder presets + per-student weekly timetable.
-- - notifyBeforeMinutes: how long before an event to fire a notification
-- - notifiedAt: once-set sentinel so the dashboard only pings once per event
-- - timetable_entries: private recurring classes (not shared with other students)

ALTER TABLE `calendar_events`
    ADD COLUMN `fld_notify_before_minutes` INTEGER NULL,
    ADD COLUMN `fld_notified_at` DATETIME(3) NULL;

CREATE TABLE `timetable_entries` (
    `fld_timetable_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_day_of_week` INTEGER NOT NULL,
    `fld_start_time` VARCHAR(10) NOT NULL,
    `fld_end_time` VARCHAR(10) NOT NULL,
    `fld_location` VARCHAR(191) NULL,
    `fld_color` VARCHAR(10) NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `timetable_entries_fld_user_id_idx`(`fld_user_id`),
    PRIMARY KEY (`fld_timetable_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `timetable_entries`
    ADD CONSTRAINT `timetable_entries_user_fkey`
    FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
