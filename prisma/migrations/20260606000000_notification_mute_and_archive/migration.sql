-- Master notification mute on User and archive support on FolioPost.

ALTER TABLE `users`
    ADD COLUMN `fld_notifications_muted` BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE `folio_posts`
    ADD COLUMN `fld_archived_at` DATETIME(3) NULL;
