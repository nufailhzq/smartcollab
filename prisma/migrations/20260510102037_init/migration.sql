-- CreateTable
CREATE TABLE `users` (
    `fld_user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_name` VARCHAR(191) NOT NULL,
    `fld_email` VARCHAR(191) NULL,
    `fld_password` VARCHAR(191) NOT NULL,
    `fld_role` ENUM('STUDENT', 'LECTURER', 'ADMIN') NOT NULL,
    `fld_matric_num` VARCHAR(191) NULL,
    `fld_faculty` VARCHAR(191) NULL DEFAULT 'FTSM',
    `fld_is_active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_fld_email_key`(`fld_email`),
    UNIQUE INDEX `users_fld_matric_num_key`(`fld_matric_num`),
    PRIMARY KEY (`fld_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `fld_course_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_course_code` VARCHAR(191) NOT NULL,
    `fld_title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `fld_lecturer_id` INTEGER NULL,
    `fld_semester` VARCHAR(191) NULL,
    `fld_credit_hour` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `courses_fld_course_code_key`(`fld_course_code`),
    INDEX `courses_fld_lecturer_id_idx`(`fld_lecturer_id`),
    PRIMARY KEY (`fld_course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_enrollments` (
    `fld_enrollment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_course_id` INTEGER NOT NULL,
    `fld_student_id` INTEGER NOT NULL,
    `fld_enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_enrollments_fld_student_id_idx`(`fld_student_id`),
    UNIQUE INDEX `uniq_course_student`(`fld_course_id`, `fld_student_id`),
    PRIMARY KEY (`fld_enrollment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `fld_assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_course_id` INTEGER NOT NULL,
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_description` TEXT NULL,
    `fld_type` ENUM('INDIVIDUAL', 'GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    `fld_due_date` DATETIME(3) NULL,
    `fld_max_grade` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assignments_fld_course_id_idx`(`fld_course_id`),
    PRIMARY KEY (`fld_assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignmentId` INTEGER NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` VARCHAR(191) NULL,
    `uploadedBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `fld_submission_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_assignment_id` INTEGER NOT NULL,
    `fld_student_id` INTEGER NOT NULL,
    `fld_file_path` VARCHAR(191) NULL,
    `fld_grade` INTEGER NULL,
    `fld_status` ENUM('PENDING', 'SUBMITTED', 'GRADED', 'LATE') NOT NULL DEFAULT 'PENDING',
    `fld_submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uniq_assignment_student`(`fld_assignment_id`, `fld_student_id`),
    PRIMARY KEY (`fld_submission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submissionId` INTEGER NOT NULL,
    `lecturerId` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_groups` (
    `fld_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_course_id` INTEGER NOT NULL,
    `fld_name_id` VARCHAR(191) NOT NULL,
    `fld_max_members` INTEGER NOT NULL DEFAULT 5,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `project_groups_fld_course_id_idx`(`fld_course_id`),
    PRIMARY KEY (`fld_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `fld_member_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_group_id` INTEGER NOT NULL,
    `fld_student_id` INTEGER NOT NULL,
    `fld_role` ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',

    UNIQUE INDEX `uniq_group_student`(`fld_group_id`, `fld_student_id`),
    PRIMARY KEY (`fld_member_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_content` (
    `fld_content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_course_id` INTEGER NOT NULL,
    `fld_type` ENUM('GENERAL', 'NOTES', 'ANNOUNCEMENT', 'FORUM', 'FILE') NOT NULL DEFAULT 'GENERAL',
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_content` TEXT NULL,
    `fld_file_name` VARCHAR(191) NULL,
    `fld_file_size` VARCHAR(191) NULL,
    `fld_posted_by` INTEGER NULL,
    `fld_posted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_content_fld_course_id_idx`(`fld_course_id`),
    INDEX `course_content_fld_type_idx`(`fld_type`),
    PRIMARY KEY (`fld_content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `private_messages` (
    `fld_message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_sender_id` INTEGER NOT NULL,
    `fld_receiver_id` INTEGER NOT NULL,
    `fld_content` TEXT NOT NULL,
    `fld_read` BOOLEAN NOT NULL DEFAULT false,
    `fld_timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `private_messages_fld_sender_id_idx`(`fld_sender_id`),
    INDEX `private_messages_fld_receiver_id_idx`(`fld_receiver_id`),
    PRIMARY KEY (`fld_message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friendships` (
    `fld_friendship_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_student_id1` INTEGER NOT NULL,
    `fld_student_id2` INTEGER NOT NULL,
    `fld_status` ENUM('PENDING', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `unique_friendship`(`fld_student_id1`, `fld_student_id2`),
    PRIMARY KEY (`fld_friendship_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `fld_notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_user_id` INTEGER NOT NULL,
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_message` TEXT NOT NULL,
    `fld_link` VARCHAR(191) NULL DEFAULT '',
    `fld_read` BOOLEAN NOT NULL DEFAULT false,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_fld_user_id_idx`(`fld_user_id`),
    INDEX `notifications_fld_created_at_idx`(`fld_created_at`),
    PRIMARY KEY (`fld_notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_events` (
    `fld_event_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fld_title` VARCHAR(191) NOT NULL,
    `fld_description` TEXT NULL,
    `fld_date` DATE NOT NULL,
    `fld_time` VARCHAR(191) NOT NULL DEFAULT '00:00:00',
    `fld_group_id` INTEGER NULL,
    `fld_course_id` INTEGER NULL,
    `fld_created_by` INTEGER NOT NULL,
    `fld_reminder` BOOLEAN NOT NULL DEFAULT false,
    `fld_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`fld_event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `auth_accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_verification_tokens_token_key`(`token`),
    UNIQUE INDEX `auth_verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_fld_lecturer_id_fkey` FOREIGN KEY (`fld_lecturer_id`) REFERENCES `users`(`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_attachments` ADD CONSTRAINT `assignment_attachments_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_fld_assignment_id_fkey` FOREIGN KEY (`fld_assignment_id`) REFERENCES `assignments`(`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_feedback` ADD CONSTRAINT `submission_feedback_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`fld_submission_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_feedback` ADD CONSTRAINT `submission_feedback_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `users`(`fld_user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_groups` ADD CONSTRAINT `project_groups_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups`(`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_content` ADD CONSTRAINT `course_content_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_content` ADD CONSTRAINT `course_content_fld_posted_by_fkey` FOREIGN KEY (`fld_posted_by`) REFERENCES `users`(`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `private_messages` ADD CONSTRAINT `private_messages_fld_sender_id_fkey` FOREIGN KEY (`fld_sender_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `private_messages` ADD CONSTRAINT `private_messages_fld_receiver_id_fkey` FOREIGN KEY (`fld_receiver_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `friendships_fld_student_id1_fkey` FOREIGN KEY (`fld_student_id1`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `friendships_fld_student_id2_fkey` FOREIGN KEY (`fld_student_id2`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups`(`fld_group_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses`(`fld_course_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_fld_created_by_fkey` FOREIGN KEY (`fld_created_by`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_accounts` ADD CONSTRAINT `auth_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
