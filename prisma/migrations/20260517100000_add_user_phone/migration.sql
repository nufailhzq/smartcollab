-- Optional phone number for users (lecturer/student quick contact info).

ALTER TABLE `users` ADD COLUMN `fld_phone` VARCHAR(32) NULL;
