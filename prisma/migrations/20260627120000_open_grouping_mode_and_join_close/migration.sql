-- AlterTable
ALTER TABLE `assignments` ADD COLUMN `fld_join_close_at` DATETIME(3) NULL,
    MODIFY `fld_grouping_mode` ENUM('INHERIT', 'CUSTOM', 'OPEN', 'RANDOM', 'INDIVIDUAL') NOT NULL DEFAULT 'INHERIT';
