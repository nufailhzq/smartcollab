-- Chatbox: support image / video / file attachments on private + group messages.

ALTER TABLE `private_messages`
  ADD COLUMN `fld_attachment_path` VARCHAR(191) NULL,
  ADD COLUMN `fld_attachment_type` VARCHAR(16) NULL,
  ADD COLUMN `fld_attachment_name` VARCHAR(191) NULL,
  ADD COLUMN `fld_attachment_size` VARCHAR(32) NULL;
