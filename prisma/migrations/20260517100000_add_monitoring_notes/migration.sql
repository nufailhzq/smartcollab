-- Lecturer Progress Monitoring: per-student private notes scoped to (course, lecturer).
-- A lecturer can write one note per student per course; updated in place via upsert.

CREATE TABLE `monitoring_notes` (
    `fld_note_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_course_id` INTEGER NOT NULL,
    `fld_lecturer_id` INTEGER NOT NULL,
    `fld_student_id` INTEGER NOT NULL,
    `fld_note` TEXT NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fld_updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uniq_monitoring_note`(`fld_course_id`, `fld_lecturer_id`, `fld_student_id`),
    INDEX `monitoring_notes_fld_course_id_fld_lecturer_id_idx`(`fld_course_id`, `fld_lecturer_id`),
    PRIMARY KEY (`fld_note_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `monitoring_notes`
  ADD CONSTRAINT `monitoring_notes_fld_course_id_fkey`
  FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `monitoring_notes`
  ADD CONSTRAINT `monitoring_notes_fld_lecturer_id_fkey`
  FOREIGN KEY (`fld_lecturer_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `monitoring_notes`
  ADD CONSTRAINT `monitoring_notes_fld_student_id_fkey`
  FOREIGN KEY (`fld_student_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
