-- Student-requested groups + per-assignment ad-hoc grouping.

ALTER TABLE `project_groups`
    ADD COLUMN `fld_status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN `fld_created_by` INTEGER NULL,
    ADD COLUMN `fld_assignment_id` INTEGER NULL;

ALTER TABLE `assignments`
    ADD COLUMN `fld_grouping_mode` ENUM('INHERIT', 'CUSTOM', 'RANDOM', 'INDIVIDUAL') NOT NULL DEFAULT 'INHERIT';

CREATE INDEX `project_groups_fld_assignment_id_idx` ON `project_groups`(`fld_assignment_id`);

ALTER TABLE `project_groups`
    ADD CONSTRAINT `project_groups_fld_created_by_fkey`
    FOREIGN KEY (`fld_created_by`) REFERENCES `users`(`fld_user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `project_groups`
    ADD CONSTRAINT `project_groups_fld_assignment_id_fkey`
    FOREIGN KEY (`fld_assignment_id`) REFERENCES `assignments`(`fld_assignment_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
