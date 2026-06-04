-- AlterTable
ALTER TABLE `submissions`
  ADD COLUMN `fld_submitted_by_id` INTEGER NULL;

-- Backfill: existing rows were always self-submitted before this column existed.
UPDATE `submissions`
  SET `fld_submitted_by_id` = `fld_student_id`
  WHERE `fld_submitted_by_id` IS NULL;

-- CreateIndex
CREATE INDEX `submissions_fld_submitted_by_id_idx` ON `submissions`(`fld_submitted_by_id`);

-- AddForeignKey
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_fld_submitted_by_id_fkey`
  FOREIGN KEY (`fld_submitted_by_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
