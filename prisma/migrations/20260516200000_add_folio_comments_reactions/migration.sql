-- Folio Connect: comments + emoji reactions on posts.

-- CreateTable: folio_comments
CREATE TABLE `folio_comments` (
    `fld_comment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_post_id` INTEGER NOT NULL,
    `fld_author_id` INTEGER NOT NULL,
    `fld_content` TEXT NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `folio_comments_fld_post_id_idx`(`fld_post_id`),
    INDEX `folio_comments_fld_author_id_idx`(`fld_author_id`),
    PRIMARY KEY (`fld_comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: folio_reactions
CREATE TABLE `folio_reactions` (
    `fld_reaction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_post_id` INTEGER NOT NULL,
    `fld_user_id` INTEGER NOT NULL,
    `fld_emoji` VARCHAR(16) NOT NULL,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uniq_post_user_emoji`(`fld_post_id`, `fld_user_id`, `fld_emoji`),
    INDEX `folio_reactions_fld_post_id_idx`(`fld_post_id`),
    PRIMARY KEY (`fld_reaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `folio_comments`
  ADD CONSTRAINT `folio_comments_fld_post_id_fkey`
  FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts`(`fld_post_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_comments`
  ADD CONSTRAINT `folio_comments_fld_author_id_fkey`
  FOREIGN KEY (`fld_author_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_reactions`
  ADD CONSTRAINT `folio_reactions_fld_post_id_fkey`
  FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts`(`fld_post_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `folio_reactions`
  ADD CONSTRAINT `folio_reactions_fld_user_id_fkey`
  FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
