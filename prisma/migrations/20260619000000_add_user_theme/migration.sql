-- Account-saved UI theme on User. Drives the [data-sb-theme] attribute on
-- <html>. See src/lib/themes.ts for the valid theme keys.

ALTER TABLE `users`
    ADD COLUMN `fld_theme` VARCHAR(191) NOT NULL DEFAULT 'aurora';
