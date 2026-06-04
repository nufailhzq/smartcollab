-- Folio Connect: social posting module
-- Adds optional program / bio columns to users and three new tables.

ALTER TABLE `users`
  ADD COLUMN `fld_program` VARCHAR(191) NULL,
  ADD COLUMN `fld_bio` TEXT NULL;

-- CreateTable: folio_posts
CREATE TABLE `folio_posts` (
    `fld_post_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_author_id` INTEGER NOT NULL,
    `fld_content` TEXT NOT NULL,
    `fld_visibility` ENUM('PUBLIC', 'FACULTY', 'FRIENDS') NOT NULL DEFAULT 'PUBLIC',
    `fld_parent_id` INTEGER NULL,
    `fld_is_repost` BOOLEAN NOT NULL DEFAULT false,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `folio_posts_fld_author_id_idx`(`fld_author_id`),
    INDEX `folio_posts_fld_parent_id_idx`(`fld_parent_id`),
    INDEX `folio_posts_fld_created_at_idx`(`fld_created_at`),
    PRIMARY KEY (`fld_post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: folio_post_images
CREATE TABLE `folio_post_images` (
    `fld_image_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_post_id` INTEGER NOT NULL,
    `fld_image_path` VARCHAR(191) NOT NULL,
    `fld_position` INTEGER NOT NULL DEFAULT 0,

    INDEX `folio_post_images_fld_post_id_idx`(`fld_post_id`),
    PRIMARY KEY (`fld_image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: folio_post_mentions
CREATE TABLE `folio_post_mentions` (
    `fld_mention_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_post_id` INTEGER NOT NULL,
    `fld_user_id` INTEGER NOT NULL,
    `fld_matric_num` VARCHAR(191) NOT NULL,

    INDEX `folio_post_mentions_fld_post_id_idx`(`fld_post_id`),
    INDEX `folio_post_mentions_fld_user_id_idx`(`fld_user_id`),
    PRIMARY KEY (`fld_mention_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `folio_posts`
  ADD CONSTRAINT `folio_posts_fld_author_id_fkey`
  FOREIGN KEY (`fld_author_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_posts`
  ADD CONSTRAINT `folio_posts_fld_parent_id_fkey`
  FOREIGN KEY (`fld_parent_id`) REFERENCES `folio_posts`(`fld_post_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `folio_post_images`
  ADD CONSTRAINT `folio_post_images_fld_post_id_fkey`
  FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts`(`fld_post_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_post_mentions`
  ADD CONSTRAINT `folio_post_mentions_fld_post_id_fkey`
  FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts`(`fld_post_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_post_mentions`
  ADD CONSTRAINT `folio_post_mentions_fld_user_id_fkey`
  FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
