-- AlterTable
ALTER TABLE `courses`
  ADD COLUMN `fld_self_service_groups` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `fld_group_max_members` INTEGER NULL,
  ADD COLUMN `fld_group_form_close_at` DATETIME(3) NULL;
