-- Track the last time each user was seen by the auth layer (session-callback
-- throttled to ~5 minutes per user). Surfaces in Progress Monitoring so
-- lecturers can spot dormant students.

ALTER TABLE `users` ADD COLUMN `fld_last_seen_at` DATETIME(3) NULL;
