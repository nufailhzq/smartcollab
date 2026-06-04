-- Chat-request handshake for DMs between users who aren't friends, aren't in
-- the same course, and have no prior chat history. First message creates a
-- PENDING row; receiver must accept before further messages flow normally.

CREATE TABLE `message_requests` (
    `fld_msg_req_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_sender_id` INTEGER NOT NULL,
    `fld_receiver_id` INTEGER NOT NULL,
    `fld_status` ENUM('PENDING', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uniq_msg_request`(`fld_sender_id`, `fld_receiver_id`),
    INDEX `message_requests_fld_receiver_id_idx`(`fld_receiver_id`),
    PRIMARY KEY (`fld_msg_req_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `message_requests` ADD CONSTRAINT `message_requests_fld_sender_id_fkey`
    FOREIGN KEY (`fld_sender_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `message_requests` ADD CONSTRAINT `message_requests_fld_receiver_id_fkey`
    FOREIGN KEY (`fld_receiver_id`) REFERENCES `users`(`fld_user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
