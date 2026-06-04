-- Folio comments can now carry an optional image attachment (gif/jpg/png/webp).
-- Videos are intentionally NOT supported here — we keep comments lightweight.

ALTER TABLE `folio_comments`
    ADD COLUMN `fld_image_path` VARCHAR(255) NULL;
