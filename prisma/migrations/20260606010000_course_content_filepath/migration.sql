-- Real file attachments for course materials (PDF / DOC / DOCX).
-- The existing fileName column kept just a label; this adds a real path.

ALTER TABLE `course_content`
    ADD COLUMN `fld_file_path` VARCHAR(255) NULL;
