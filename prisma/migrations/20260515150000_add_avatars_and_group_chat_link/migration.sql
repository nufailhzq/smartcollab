-- Slice B: User avatar path
ALTER TABLE `users` ADD COLUMN `fld_avatar_path` VARCHAR(191) NULL;

-- Slice D: Project group <-> chat group link
ALTER TABLE `project_groups` ADD COLUMN `fld_chat_group_id` INTEGER NULL;

CREATE UNIQUE INDEX `project_groups_fld_chat_group_id_key` ON `project_groups`(`fld_chat_group_id`);

ALTER TABLE `project_groups`
  ADD CONSTRAINT `project_groups_fld_chat_group_id_fkey`
  FOREIGN KEY (`fld_chat_group_id`) REFERENCES `chat_groups`(`fld_chat_group_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
