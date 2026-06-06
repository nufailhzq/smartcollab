-- Group courses by owning faculty (FTSM, FSSK, FST, CITRA, …).
-- Existing courses default to FTSM until edited in the admin panel.

ALTER TABLE `courses`
    ADD COLUMN `fld_faculty` VARCHAR(191) NOT NULL DEFAULT 'FTSM';
