-- MariaDB dump 10.19  Distrib 10.4.18-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ukm_lms_new
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('06aad087-a711-4e99-8eaf-4080ac35949e','b583ba1f48df10662796d04afa6ab5f16eac368652da91c1a6070ff817945bb0','2026-06-04 03:58:39.719','20260605120000_add_user_last_seen',NULL,NULL,'2026-06-04 03:58:39.685',1),('0e817bba-37d0-43dd-8d90-2de81a6586df','94fd05b6ce3c42437bbab5f570f866f6171abeaec245b1ddfb21155bd3a6a87e','2026-05-14 07:39:13.168','20260514120000_add_bulletins_and_recent_access',NULL,NULL,'2026-05-14 07:39:12.632',1),('1970a90b-ebb7-4265-aa14-e6d485b5903b','67ceea278a9aa18d9ca75c201ec13a2b5a659b7bfe9778e7042b51f63cb7fdc3','2026-05-10 10:20:42.795','20260510102037_init',NULL,NULL,'2026-05-10 10:20:37.323',1),('1ccbf699-eabb-4b99-aa5a-a4db28cc0a50','62a0682e433b63b69d42014161c9852dbb26134a8f30a8dbcfaef578d32def60','2026-05-15 11:36:29.606','20260516120000_add_folio_connect',NULL,NULL,'2026-05-15 11:36:28.524',1),('20edb896-cb27-44c6-a9d1-84d1fab662f9','37c1680bb8432a36325717da446c9807a174694af1255582033fc6336f737fec','2026-05-10 19:13:11.489','20260510191310_add_group_access_requests',NULL,NULL,'2026-05-10 19:13:10.661',1),('2fe9736d-5deb-4ba4-9b0b-6b158f0fa97b','67dcbfad13674fc2ebdc26c76422f71b89e04f0c87d82f18834043a19b3ab459','2026-05-15 05:19:07.200','20260515150000_add_avatars_and_group_chat_link',NULL,NULL,'2026-05-15 05:19:06.886',1),('50693722-dd6c-48e3-88f8-9647b0fd0c00','79a51831872a830898358395186c80a12dd75d7e0ef4df1f93ca9f417dba4777','2026-06-04 03:58:40.188','20260605130000_add_message_requests',NULL,NULL,'2026-06-04 03:58:39.730',1),('8f9b229d-06c7-4464-a8ff-4b58042ef129','e65fe2a2731cfd2b83996dd2de68f18dd378d7f85c7c824a52b8eb8154a15b56','2026-05-15 12:07:03.883','20260516220000_add_message_attachments',NULL,NULL,'2026-05-15 12:07:03.824',1),('9c43eb33-d6aa-40ae-bd66-7e2c87c97123','77816621e1122d9a44da0d2f45cd43a439a2084946cc45b9072cea05828de20f','2026-05-15 11:52:09.084','20260516200000_add_folio_comments_reactions',NULL,NULL,'2026-05-15 11:52:08.150',1),('c2276151-a7e8-4af6-ba7b-fc78cdf6c36e','2ac5c6cd9f8da1ca28b6431c4674129af96dde8c57b86e2151e0a67ff4057d78','2026-05-15 04:01:11.456','20260515120000_add_submission_submitter',NULL,NULL,'2026-05-15 04:01:11.144',1),('d1cf5790-9099-4ce0-98a0-eb4008359219','f57e9f80497e01b3eaa73ae02bddae2fb0e317f42c73f6b7c7435a3c28030936','2026-05-17 17:27:33.272','20260517100000_add_user_phone',NULL,NULL,'2026-05-17 17:27:33.237',1),('fbbac3ba-83d3-44e2-9127-a6a823a74d20','d14bdbd87a5771088aef1b701605cd75d3f2c196c6082668e874a104776bd6dd','2026-05-10 18:52:16.298','20260510185215_add_chat_groups',NULL,NULL,'2026-05-10 18:52:15.259',1),('fc694542-0f28-49f6-883b-adc622146f52','3116d208552160166bcae9050d4ac7ff512db1942fde202f8ffca459795ef043','2026-05-17 03:07:33.140','20260517100000_add_monitoring_notes',NULL,NULL,'2026-05-17 03:07:32.477',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;

--
-- Table structure for table `assignment_attachments`
--

DROP TABLE IF EXISTS `assignment_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignmentId` int(11) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `fileSize` varchar(191) DEFAULT NULL,
  `uploadedBy` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `assignment_attachments_assignmentId_fkey` (`assignmentId`),
  CONSTRAINT `assignment_attachments_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments` (`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_attachments`
--

/*!40000 ALTER TABLE `assignment_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignment_attachments` ENABLE KEYS */;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignments` (
  `fld_assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_course_id` int(11) NOT NULL,
  `fld_title` varchar(191) NOT NULL,
  `fld_description` text DEFAULT NULL,
  `fld_type` enum('INDIVIDUAL','GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
  `fld_due_date` datetime(3) DEFAULT NULL,
  `fld_max_grade` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_assignment_id`),
  KEY `assignments_fld_course_id_idx` (`fld_course_id`),
  CONSTRAINT `assignments_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,1,'Tugasan 1: TTTK3000','Penerangan tugasan 1 untuk Projek Tahun Akhir.','INDIVIDUAL','2026-04-19 10:21:02.647',100,'2026-05-10 10:21:02.659'),(2,1,'Tugasan 2: TTTK3000','Penerangan tugasan 2 untuk Projek Tahun Akhir.','INDIVIDUAL','2026-05-03 10:21:02.660',100,'2026-05-10 10:21:02.671'),(3,1,'Tugasan 3: TTTK3000','Penerangan tugasan 3 untuk Projek Tahun Akhir.','GROUP','2026-05-17 10:21:02.671',100,'2026-05-10 10:21:02.682'),(4,1,'Tugasan 4: TTTK3000','Penerangan tugasan 4 untuk Projek Tahun Akhir.','INDIVIDUAL','2026-05-31 10:21:02.683',100,'2026-05-10 10:21:02.694'),(5,2,'Tugasan 1: TTTK3413','Penerangan tugasan 1 untuk Pembangunan Aplikasi Web.','INDIVIDUAL','2026-04-19 10:21:02.694',100,'2026-05-10 10:21:02.704'),(6,2,'Tugasan 2: TTTK3413','Penerangan tugasan 2 untuk Pembangunan Aplikasi Web.','INDIVIDUAL','2026-05-03 10:21:02.705',100,'2026-05-10 10:21:02.715'),(7,2,'Tugasan 3: TTTK3413','Penerangan tugasan 3 untuk Pembangunan Aplikasi Web.','GROUP','2026-05-17 10:21:02.716',100,'2026-05-10 10:21:02.726'),(8,2,'Tugasan 4: TTTK3413','Penerangan tugasan 4 untuk Pembangunan Aplikasi Web.','INDIVIDUAL','2026-05-31 10:21:02.726',100,'2026-05-10 10:21:02.737'),(9,3,'Tugasan 1: TTTK3813','Penerangan tugasan 1 untuk Realiti Maya.','INDIVIDUAL','2026-04-19 10:21:02.743',100,'2026-05-10 10:21:02.753'),(10,3,'Tugasan 2: TTTK3813','Penerangan tugasan 2 untuk Realiti Maya.','INDIVIDUAL','2026-05-03 10:21:02.755',100,'2026-05-10 10:21:02.766'),(11,3,'Tugasan 3: TTTK3813','Penerangan tugasan 3 untuk Realiti Maya.','GROUP','2026-05-17 10:21:02.766',100,'2026-05-10 10:21:02.777'),(12,3,'Tugasan 4: TTTK3813','Penerangan tugasan 4 untuk Realiti Maya.','INDIVIDUAL','2026-05-31 10:21:02.778',100,'2026-05-10 10:21:02.788'),(13,4,'Tugasan 1: TTCS3064','Penerangan tugasan 1 untuk Pentadbiran Sistem.','INDIVIDUAL','2026-04-19 10:21:02.788',100,'2026-05-10 10:21:02.798'),(14,4,'Tugasan 2: TTCS3064','Penerangan tugasan 2 untuk Pentadbiran Sistem.','INDIVIDUAL','2026-05-03 10:21:02.798',100,'2026-05-10 10:21:02.809'),(15,4,'Tugasan 3: TTCS3064','Penerangan tugasan 3 untuk Pentadbiran Sistem.','GROUP','2026-05-17 10:21:02.809',100,'2026-05-10 10:21:02.820'),(16,4,'Tugasan 4: TTCS3064','Penerangan tugasan 4 untuk Pentadbiran Sistem.','INDIVIDUAL','2026-05-31 10:21:02.820',100,'2026-05-10 10:21:02.830'),(17,5,'Tugasan 1: TTCS2043','Penerangan tugasan 1 untuk Komputer Etika dan Sosial.','INDIVIDUAL','2026-04-19 10:21:02.832',100,'2026-05-10 10:21:02.842'),(18,5,'Tugasan 2: TTCS2043','Penerangan tugasan 2 untuk Komputer Etika dan Sosial.','INDIVIDUAL','2026-05-03 10:21:02.845',100,'2026-05-10 10:21:02.855'),(19,5,'Tugasan 3: TTCS2043','Penerangan tugasan 3 untuk Komputer Etika dan Sosial.','GROUP','2026-05-17 10:21:02.856',100,'2026-05-10 10:21:02.866'),(20,5,'Tugasan 4: TTCS2043','Penerangan tugasan 4 untuk Komputer Etika dan Sosial.','INDIVIDUAL','2026-05-31 10:21:02.868',100,'2026-05-10 10:21:02.879'),(21,6,'Tugasan 1: TTTK2113','Penerangan tugasan 1 untuk Struktur Data dan Algoritma.','INDIVIDUAL','2026-04-19 10:21:02.879',100,'2026-05-10 10:21:02.889'),(22,6,'Tugasan 2: TTTK2113','Penerangan tugasan 2 untuk Struktur Data dan Algoritma.','INDIVIDUAL','2026-05-03 10:21:02.889',100,'2026-05-10 10:21:02.899'),(23,6,'Tugasan 3: TTTK2113','Penerangan tugasan 3 untuk Struktur Data dan Algoritma.','GROUP','2026-05-17 10:21:02.899',100,'2026-05-10 10:21:02.910'),(24,6,'Tugasan 4: TTTK2113','Penerangan tugasan 4 untuk Struktur Data dan Algoritma.','INDIVIDUAL','2026-05-31 10:21:02.910',100,'2026-05-10 10:21:02.920'),(25,7,'Tugasan 1: TTMK3133','Penerangan tugasan 1 untuk Pembangunan Mudah Alih.','INDIVIDUAL','2026-04-19 10:21:02.921',100,'2026-05-10 10:21:02.932'),(26,7,'Tugasan 2: TTMK3133','Penerangan tugasan 2 untuk Pembangunan Mudah Alih.','INDIVIDUAL','2026-05-03 10:21:02.933',100,'2026-05-10 10:21:02.943'),(27,7,'Tugasan 3: TTMK3133','Penerangan tugasan 3 untuk Pembangunan Mudah Alih.','GROUP','2026-05-17 10:21:02.944',100,'2026-05-10 10:21:02.954'),(28,7,'Tugasan 4: TTMK3133','Penerangan tugasan 4 untuk Pembangunan Mudah Alih.','INDIVIDUAL','2026-05-31 10:21:02.955',100,'2026-05-10 10:21:02.965'),(29,8,'Tugasan 1: TTCS3023','Penerangan tugasan 1 untuk Kecerdasan Buatan.','INDIVIDUAL','2026-04-19 10:21:02.966',100,'2026-05-10 10:21:02.976'),(30,8,'Tugasan 2: TTCS3023','Penerangan tugasan 2 untuk Kecerdasan Buatan.','INDIVIDUAL','2026-05-03 10:21:02.976',100,'2026-05-10 10:21:02.986'),(31,8,'Tugasan 3: TTCS3023','Penerangan tugasan 3 untuk Kecerdasan Buatan.','GROUP','2026-05-17 10:21:02.986',100,'2026-05-10 10:21:02.997'),(32,8,'Tugasan 4: TTCS3023','Penerangan tugasan 4 untuk Kecerdasan Buatan.','INDIVIDUAL','2026-05-31 10:21:02.997',100,'2026-05-10 10:21:03.007'),(33,9,'Tugasan 1: TTTK3163','Penerangan tugasan 1 untuk Pangkalan Data.','INDIVIDUAL','2026-04-19 10:21:03.014',100,'2026-05-10 10:21:03.024'),(34,9,'Tugasan 2: TTTK3163','Penerangan tugasan 2 untuk Pangkalan Data.','INDIVIDUAL','2026-05-03 10:21:03.026',100,'2026-05-10 10:21:03.036'),(35,9,'Tugasan 3: TTTK3163','Penerangan tugasan 3 untuk Pangkalan Data.','GROUP','2026-05-17 10:21:03.037',100,'2026-05-10 10:21:03.048'),(36,9,'Tugasan 4: TTTK3163','Penerangan tugasan 4 untuk Pangkalan Data.','INDIVIDUAL','2026-05-31 10:21:03.050',100,'2026-05-10 10:21:03.060'),(37,10,'Tugasan 1: TTCS3043','Penerangan tugasan 1 untuk Interaksi Manusia-Komputer.','INDIVIDUAL','2026-04-19 10:21:03.060',100,'2026-05-10 10:21:03.071'),(38,10,'Tugasan 2: TTCS3043','Penerangan tugasan 2 untuk Interaksi Manusia-Komputer.','INDIVIDUAL','2026-05-03 10:21:03.071',100,'2026-05-10 10:21:03.081'),(39,10,'Tugasan 3: TTCS3043','Penerangan tugasan 3 untuk Interaksi Manusia-Komputer.','GROUP','2026-05-17 10:21:03.082',100,'2026-05-10 10:21:03.092'),(40,10,'Tugasan 4: TTCS3043','Penerangan tugasan 4 untuk Interaksi Manusia-Komputer.','INDIVIDUAL','2026-05-31 10:21:03.094',100,'2026-05-10 10:21:03.104'),(41,11,'Tugasan 1: TTTK3133','Penerangan tugasan 1 untuk Keselamatan Komputer.','INDIVIDUAL','2026-04-19 10:21:03.105',100,'2026-05-10 10:21:03.115'),(42,11,'Tugasan 2: TTTK3133','Penerangan tugasan 2 untuk Keselamatan Komputer.','INDIVIDUAL','2026-05-03 10:21:03.117',100,'2026-05-10 10:21:03.127'),(43,11,'Tugasan 3: TTTK3133','Penerangan tugasan 3 untuk Keselamatan Komputer.','GROUP','2026-05-17 10:21:03.128',100,'2026-05-10 10:21:03.139'),(44,11,'Tugasan 4: TTTK3133','Penerangan tugasan 4 untuk Keselamatan Komputer.','INDIVIDUAL','2026-05-31 10:21:03.140',100,'2026-05-10 10:21:03.151'),(45,12,'Tugasan 1: TTMK3013','Penerangan tugasan 1 untuk Pembelajaran Mesin.','INDIVIDUAL','2026-04-19 10:21:03.151',100,'2026-05-10 10:21:03.161'),(46,12,'Tugasan 2: TTMK3013','Penerangan tugasan 2 untuk Pembelajaran Mesin.','INDIVIDUAL','2026-05-03 10:21:03.161',100,'2026-05-10 10:21:03.172'),(47,12,'Tugasan 3: TTMK3013','Penerangan tugasan 3 untuk Pembelajaran Mesin.','GROUP','2026-05-17 10:21:03.171',100,'2026-05-10 10:21:03.181'),(48,12,'Tugasan 4: TTMK3013','Penerangan tugasan 4 untuk Pembelajaran Mesin.','INDIVIDUAL','2026-05-31 10:21:03.181',100,'2026-05-10 10:21:03.191');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;

--
-- Table structure for table `auth_accounts`
--

DROP TABLE IF EXISTS `auth_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_accounts` (
  `id` varchar(191) NOT NULL,
  `userId` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `providerAccountId` varchar(191) NOT NULL,
  `refresh_token` text DEFAULT NULL,
  `access_token` text DEFAULT NULL,
  `expires_at` int(11) DEFAULT NULL,
  `token_type` varchar(191) DEFAULT NULL,
  `scope` varchar(191) DEFAULT NULL,
  `id_token` text DEFAULT NULL,
  `session_state` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_accounts_provider_providerAccountId_key` (`provider`,`providerAccountId`),
  KEY `auth_accounts_userId_fkey` (`userId`),
  CONSTRAINT `auth_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_accounts`
--

/*!40000 ALTER TABLE `auth_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_accounts` ENABLE KEYS */;

--
-- Table structure for table `auth_sessions`
--

DROP TABLE IF EXISTS `auth_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_sessions` (
  `id` varchar(191) NOT NULL,
  `sessionToken` varchar(191) NOT NULL,
  `userId` int(11) NOT NULL,
  `expires` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_sessions_sessionToken_key` (`sessionToken`),
  KEY `auth_sessions_userId_fkey` (`userId`),
  CONSTRAINT `auth_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_sessions`
--

/*!40000 ALTER TABLE `auth_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_sessions` ENABLE KEYS */;

--
-- Table structure for table `auth_verification_tokens`
--

DROP TABLE IF EXISTS `auth_verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_verification_tokens` (
  `identifier` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `expires` datetime(3) NOT NULL,
  UNIQUE KEY `auth_verification_tokens_token_key` (`token`),
  UNIQUE KEY `auth_verification_tokens_identifier_token_key` (`identifier`,`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_verification_tokens`
--

/*!40000 ALTER TABLE `auth_verification_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_verification_tokens` ENABLE KEYS */;

--
-- Table structure for table `bulletins`
--

DROP TABLE IF EXISTS `bulletins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bulletins` (
  `fld_bulletin_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_title` varchar(191) NOT NULL,
  `fld_body` text NOT NULL,
  `fld_image_path` varchar(191) DEFAULT NULL,
  `fld_link_url` varchar(191) DEFAULT NULL,
  `fld_link_label` varchar(191) DEFAULT NULL,
  `fld_is_active` tinyint(1) NOT NULL DEFAULT 1,
  `fld_is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `fld_created_by` int(11) NOT NULL,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`fld_bulletin_id`),
  KEY `bulletins_fld_is_active_fld_is_pinned_fld_created_at_idx` (`fld_is_active`,`fld_is_pinned`,`fld_created_at`),
  KEY `bulletins_fld_created_by_fkey` (`fld_created_by`),
  CONSTRAINT `bulletins_fld_created_by_fkey` FOREIGN KEY (`fld_created_by`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulletins`
--

/*!40000 ALTER TABLE `bulletins` DISABLE KEYS */;
INSERT INTO `bulletins` VALUES (1,'APAC Survey Invitation','Semua pelajar Universiti Kebangsaan Malaysia dijemput untuk meluangkan kira-kira 5 minit bagi mengisi AI in Higher Education APAC Survey yang dijalankan melalui kerjasama antara UKM dan Digital Education Council.\r\n\r\nKerjasama dan perhatian pihak saudara/saudari dalam perkara ini amatlah dihargai.\r\n\r\nSekian, terima kasih.','/uploads/bulletins/1778745014513-ebd222c47d7a.png',NULL,NULL,1,0,1,'2026-05-14 07:50:14.524','2026-05-14 07:50:14.524');
/*!40000 ALTER TABLE `bulletins` ENABLE KEYS */;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calendar_events` (
  `fld_event_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_title` varchar(191) NOT NULL,
  `fld_description` text DEFAULT NULL,
  `fld_date` date NOT NULL,
  `fld_time` varchar(191) NOT NULL DEFAULT '00:00:00',
  `fld_group_id` int(11) DEFAULT NULL,
  `fld_course_id` int(11) DEFAULT NULL,
  `fld_created_by` int(11) NOT NULL,
  `fld_reminder` tinyint(1) NOT NULL DEFAULT 0,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_event_id`),
  KEY `calendar_events_fld_group_id_fkey` (`fld_group_id`),
  KEY `calendar_events_fld_course_id_fkey` (`fld_course_id`),
  KEY `calendar_events_fld_created_by_fkey` (`fld_created_by`),
  CONSTRAINT `calendar_events_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `calendar_events_fld_created_by_fkey` FOREIGN KEY (`fld_created_by`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `calendar_events_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups` (`fld_group_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_events`
--

/*!40000 ALTER TABLE `calendar_events` DISABLE KEYS */;
INSERT INTO `calendar_events` VALUES (1,'Acara TTTK3000 #1','Mesyuarat / kuliah / peperiksaan untuk Projek Tahun Akhir.','2026-05-09','14:00:00',NULL,1,2,1,'2026-05-10 10:21:09.388'),(2,'Acara TTMK3013 #2','Mesyuarat / kuliah / peperiksaan untuk Pembelajaran Mesin.','2026-05-27','14:00:00',NULL,12,6,0,'2026-05-10 10:21:09.398'),(3,'Acara TTTK2113 #3','Mesyuarat / kuliah / peperiksaan untuk Struktur Data dan Algoritma.','2026-05-16','14:00:00',NULL,6,4,0,'2026-05-10 10:21:09.409'),(4,'Acara TTCS3023 #4','Mesyuarat / kuliah / peperiksaan untuk Kecerdasan Buatan.','2026-05-26','14:00:00',NULL,8,6,1,'2026-05-10 10:21:09.438'),(5,'Acara TTTK3813 #5','Mesyuarat / kuliah / peperiksaan untuk Realiti Maya.','2026-05-09','14:00:00',NULL,3,3,0,'2026-05-10 10:21:09.450'),(6,'Acara TTMK3133 #6','Mesyuarat / kuliah / peperiksaan untuk Pembangunan Mudah Alih.','2026-05-22','14:00:00',NULL,7,9,0,'2026-05-10 10:21:09.461'),(7,'Acara TTCS2043 #7','Mesyuarat / kuliah / peperiksaan untuk Komputer Etika dan Sosial.','2026-05-15','14:00:00',NULL,5,5,1,'2026-05-10 10:21:09.471'),(8,'Acara TTCS3043 #8','Mesyuarat / kuliah / peperiksaan untuk Interaksi Manusia-Komputer.','2026-05-26','14:00:00',NULL,10,8,0,'2026-05-10 10:21:09.482'),(9,'Acara TTTK3163 #9','Mesyuarat / kuliah / peperiksaan untuk Pangkalan Data.','2026-05-27','14:00:00',NULL,9,7,0,'2026-05-10 10:21:09.494'),(10,'Acara TTTK3413 #10','Mesyuarat / kuliah / peperiksaan untuk Pembangunan Aplikasi Web.','2026-05-07','14:00:00',NULL,2,2,1,'2026-05-10 10:21:09.505'),(11,'Acara TTCS3064 #11','Mesyuarat / kuliah / peperiksaan untuk Pentadbiran Sistem.','2026-05-25','14:00:00',NULL,4,3,0,'2026-05-10 10:21:09.517'),(12,'Acara TTTK3413 #12','Mesyuarat / kuliah / peperiksaan untuk Pembangunan Aplikasi Web.','2026-06-02','14:00:00',NULL,2,2,0,'2026-05-10 10:21:09.529'),(13,'Acara TTMK3013 #13','Mesyuarat / kuliah / peperiksaan untuk Pembelajaran Mesin.','2026-05-10','14:00:00',NULL,12,6,1,'2026-05-10 10:21:09.540'),(14,'Acara TTTK3000 #14','Mesyuarat / kuliah / peperiksaan untuk Projek Tahun Akhir.','2026-05-25','14:00:00',NULL,1,2,0,'2026-05-10 10:21:09.549'),(15,'Acara TTTK3000 #15','Mesyuarat / kuliah / peperiksaan untuk Projek Tahun Akhir.','2026-05-07','14:00:00',NULL,1,2,0,'2026-05-10 10:21:09.560'),(16,'Acara TTTK3163 #16','Mesyuarat / kuliah / peperiksaan untuk Pangkalan Data.','2026-05-15','14:00:00',NULL,9,7,1,'2026-05-10 10:21:09.571'),(17,'Acara TTTK3163 #17','Mesyuarat / kuliah / peperiksaan untuk Pangkalan Data.','2026-05-23','14:00:00',NULL,9,7,0,'2026-05-10 10:21:09.581'),(18,'Acara TTCS3064 #18','Mesyuarat / kuliah / peperiksaan untuk Pentadbiran Sistem.','2026-05-12','14:00:00',NULL,4,3,0,'2026-05-10 10:21:09.592'),(19,'Acara TTCS3043 #19','Mesyuarat / kuliah / peperiksaan untuk Interaksi Manusia-Komputer.','2026-05-12','14:00:00',NULL,10,8,1,'2026-05-10 10:21:09.603'),(20,'Acara TTCS3064 #20','Mesyuarat / kuliah / peperiksaan untuk Pentadbiran Sistem.','2026-06-02','14:00:00',NULL,4,3,0,'2026-05-10 10:21:09.614');
/*!40000 ALTER TABLE `calendar_events` ENABLE KEYS */;

--
-- Table structure for table `chat_group_members`
--

DROP TABLE IF EXISTS `chat_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_group_members` (
  `fld_chat_member_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_chat_group_id` int(11) NOT NULL,
  `fld_user_id` int(11) NOT NULL,
  `fld_is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `fld_last_read_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_joined_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_chat_member_id`),
  UNIQUE KEY `uniq_chat_group_member` (`fld_chat_group_id`,`fld_user_id`),
  KEY `chat_group_members_fld_user_id_idx` (`fld_user_id`),
  CONSTRAINT `chat_group_members_fld_chat_group_id_fkey` FOREIGN KEY (`fld_chat_group_id`) REFERENCES `chat_groups` (`fld_chat_group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_group_members_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_group_members`
--

/*!40000 ALTER TABLE `chat_group_members` DISABLE KEYS */;
INSERT INTO `chat_group_members` VALUES (1,1,10,1,'2026-05-15 12:02:44.956','2026-05-10 19:07:06.994'),(2,1,32,0,'2026-05-10 19:07:06.994','2026-05-10 19:07:06.994'),(3,1,2,0,'2026-05-10 19:07:28.149','2026-05-10 19:07:06.994'),(4,2,10,1,'2026-05-15 12:17:11.916','2026-05-11 16:11:11.349'),(5,2,2,0,'2026-05-15 12:17:25.199','2026-05-11 16:11:11.349'),(6,2,38,0,'2026-05-11 16:11:59.479','2026-05-11 16:11:28.040'),(7,3,3,1,'2026-05-11 16:13:53.790','2026-05-11 16:13:47.815'),(8,3,2,0,'2026-05-11 16:13:47.815','2026-05-11 16:13:47.815'),(9,3,4,0,'2026-05-11 16:13:47.815','2026-05-11 16:13:47.815'),(10,3,6,0,'2026-05-11 16:13:47.815','2026-05-11 16:13:47.815'),(11,3,8,0,'2026-05-11 16:14:08.310','2026-05-11 16:13:47.815'),(12,3,9,0,'2026-05-11 16:13:47.815','2026-05-11 16:13:47.815'),(13,4,10,1,'2026-05-17 17:47:23.123','2026-05-17 17:47:22.942'),(14,4,15,0,'2026-05-17 17:47:22.942','2026-05-17 17:47:22.942'),(15,4,20,0,'2026-05-17 17:47:22.942','2026-05-17 17:47:22.942'),(16,4,28,0,'2026-05-17 17:47:22.942','2026-05-17 17:47:22.942'),(17,4,38,0,'2026-05-17 17:47:22.942','2026-05-17 17:47:22.942'),(18,4,39,0,'2026-05-17 17:47:22.942','2026-05-17 17:47:22.942'),(19,4,6,0,'2026-05-17 17:47:22.942','2026-05-17 17:47:22.942'),(20,5,10,1,'2026-05-17 17:47:32.024','2026-05-17 17:47:31.872'),(21,5,24,0,'2026-05-17 17:47:31.872','2026-05-17 17:47:31.872'),(22,5,29,0,'2026-05-17 17:47:31.872','2026-05-17 17:47:31.872'),(23,5,32,0,'2026-05-17 17:47:31.872','2026-05-17 17:47:31.872'),(24,5,2,0,'2026-05-17 17:47:31.872','2026-05-17 17:47:31.872');
/*!40000 ALTER TABLE `chat_group_members` ENABLE KEYS */;

--
-- Table structure for table `chat_groups`
--

DROP TABLE IF EXISTS `chat_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat_groups` (
  `fld_chat_group_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_name` varchar(191) NOT NULL,
  `fld_created_by` int(11) NOT NULL,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_chat_group_id`),
  KEY `chat_groups_fld_created_by_fkey` (`fld_created_by`),
  CONSTRAINT `chat_groups_fld_created_by_fkey` FOREIGN KEY (`fld_created_by`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_groups`
--

/*!40000 ALTER TABLE `chat_groups` DISABLE KEYS */;
INSERT INTO `chat_groups` VALUES (1,'FYP Jom!',10,'2026-05-10 19:07:06.994'),(2,'Kumpulan FYP 2',10,'2026-05-11 16:11:11.349'),(3,'Kumpulan Dr',3,'2026-05-11 16:13:47.815'),(4,'TTCS3023 · Kumpulan Alpha (TTCS3023)',10,'2026-05-17 17:47:22.942'),(5,'TTTK3000 · Kumpulan Alpha (TTTK3000)',10,'2026-05-17 17:47:31.872');
/*!40000 ALTER TABLE `chat_groups` ENABLE KEYS */;

--
-- Table structure for table `class_enrollments`
--

DROP TABLE IF EXISTS `class_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_enrollments` (
  `fld_enrollment_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_course_id` int(11) NOT NULL,
  `fld_student_id` int(11) NOT NULL,
  `fld_enrolled_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_enrollment_id`),
  UNIQUE KEY `uniq_course_student` (`fld_course_id`,`fld_student_id`),
  KEY `class_enrollments_fld_student_id_idx` (`fld_student_id`),
  CONSTRAINT `class_enrollments_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `class_enrollments_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_enrollments`
--

/*!40000 ALTER TABLE `class_enrollments` DISABLE KEYS */;
INSERT INTO `class_enrollments` VALUES (1,1,10,'2026-05-10 10:20:58.520'),(2,2,10,'2026-05-10 10:20:58.533'),(3,3,10,'2026-05-10 10:20:58.545'),(4,8,10,'2026-05-10 10:20:58.574'),(5,10,11,'2026-05-10 10:20:58.585'),(6,7,11,'2026-05-10 10:20:58.596'),(7,2,11,'2026-05-10 10:20:58.606'),(8,2,12,'2026-05-10 10:20:58.618'),(9,6,12,'2026-05-10 10:20:58.630'),(10,11,12,'2026-05-10 10:20:58.641'),(11,7,12,'2026-05-10 10:20:58.653'),(12,10,13,'2026-05-10 10:20:58.664'),(13,7,13,'2026-05-10 10:20:58.675'),(14,5,13,'2026-05-10 10:20:58.685'),(15,4,13,'2026-05-10 10:20:58.695'),(16,6,14,'2026-05-10 10:20:58.706'),(17,2,14,'2026-05-10 10:20:58.718'),(18,5,14,'2026-05-10 10:20:58.730'),(19,11,14,'2026-05-10 10:20:58.743'),(20,7,14,'2026-05-10 10:20:58.755'),(21,10,15,'2026-05-10 10:20:58.765'),(22,7,15,'2026-05-10 10:20:58.777'),(23,8,15,'2026-05-10 10:20:58.788'),(24,3,16,'2026-05-10 10:20:58.800'),(25,8,16,'2026-05-10 10:20:58.812'),(26,12,16,'2026-05-10 10:20:58.824'),(27,11,16,'2026-05-10 10:20:58.836'),(28,1,16,'2026-05-10 10:20:58.847'),(29,2,17,'2026-05-10 10:20:58.857'),(30,5,17,'2026-05-10 10:20:58.868'),(31,10,17,'2026-05-10 10:20:58.879'),(32,11,18,'2026-05-10 10:20:58.889'),(33,6,18,'2026-05-10 10:20:58.902'),(34,12,18,'2026-05-10 10:20:58.918'),(35,2,18,'2026-05-10 10:20:58.930'),(36,2,19,'2026-05-10 10:20:58.942'),(37,5,19,'2026-05-10 10:20:58.952'),(38,12,19,'2026-05-10 10:20:58.963'),(39,6,20,'2026-05-10 10:20:58.973'),(40,11,20,'2026-05-10 10:20:58.984'),(41,4,20,'2026-05-10 10:20:58.995'),(42,8,20,'2026-05-10 10:20:59.006'),(43,2,21,'2026-05-10 10:20:59.018'),(44,6,21,'2026-05-10 10:20:59.029'),(45,8,21,'2026-05-10 10:20:59.040'),(46,9,21,'2026-05-10 10:20:59.051'),(47,4,21,'2026-05-10 10:20:59.063'),(48,2,22,'2026-05-10 10:20:59.073'),(49,11,22,'2026-05-10 10:20:59.086'),(50,10,22,'2026-05-10 10:20:59.098'),(51,9,22,'2026-05-10 10:20:59.109'),(52,8,22,'2026-05-10 10:20:59.122'),(53,8,23,'2026-05-10 10:20:59.132'),(54,9,23,'2026-05-10 10:20:59.143'),(55,6,23,'2026-05-10 10:20:59.155'),(56,3,24,'2026-05-10 10:20:59.171'),(57,12,24,'2026-05-10 10:20:59.186'),(58,8,24,'2026-05-10 10:20:59.197'),(59,1,24,'2026-05-10 10:20:59.209'),(60,5,24,'2026-05-10 10:20:59.220'),(61,1,25,'2026-05-10 10:20:59.231'),(62,8,25,'2026-05-10 10:20:59.241'),(63,11,25,'2026-05-10 10:20:59.251'),(64,12,25,'2026-05-10 10:20:59.263'),(65,9,25,'2026-05-10 10:20:59.275'),(66,4,26,'2026-05-10 10:20:59.288'),(67,1,26,'2026-05-10 10:20:59.300'),(68,3,26,'2026-05-10 10:20:59.311'),(69,9,26,'2026-05-10 10:20:59.321'),(70,5,26,'2026-05-10 10:20:59.332'),(71,11,27,'2026-05-10 10:20:59.342'),(72,10,27,'2026-05-10 10:20:59.354'),(73,9,27,'2026-05-10 10:20:59.365'),(74,7,27,'2026-05-10 10:20:59.376'),(75,1,27,'2026-05-10 10:20:59.388'),(76,9,28,'2026-05-10 10:20:59.399'),(77,2,28,'2026-05-10 10:20:59.421'),(78,5,28,'2026-05-10 10:20:59.440'),(79,8,28,'2026-05-10 10:20:59.452'),(80,2,29,'2026-05-10 10:20:59.464'),(81,4,29,'2026-05-10 10:20:59.480'),(82,9,29,'2026-05-10 10:20:59.491'),(83,1,29,'2026-05-10 10:20:59.502'),(84,10,30,'2026-05-10 10:20:59.514'),(85,1,30,'2026-05-10 10:20:59.527'),(86,5,30,'2026-05-10 10:20:59.540'),(87,6,31,'2026-05-10 10:20:59.550'),(88,8,31,'2026-05-10 10:20:59.561'),(89,4,31,'2026-05-10 10:20:59.571'),(90,1,31,'2026-05-10 10:20:59.582'),(91,9,32,'2026-05-10 10:20:59.594'),(92,8,32,'2026-05-10 10:20:59.606'),(93,1,32,'2026-05-10 10:20:59.617'),(94,12,32,'2026-05-10 10:20:59.629'),(95,5,32,'2026-05-10 10:20:59.639'),(96,4,33,'2026-05-10 10:20:59.650'),(97,7,33,'2026-05-10 10:20:59.661'),(98,1,33,'2026-05-10 10:20:59.671'),(99,1,34,'2026-05-10 10:20:59.683'),(100,5,34,'2026-05-10 10:20:59.695'),(101,2,34,'2026-05-10 10:20:59.706'),(102,10,34,'2026-05-10 10:20:59.718'),(103,2,35,'2026-05-10 10:20:59.729'),(104,6,35,'2026-05-10 10:20:59.739'),(105,1,35,'2026-05-10 10:20:59.750'),(106,3,35,'2026-05-10 10:20:59.760'),(107,11,35,'2026-05-10 10:20:59.772'),(108,9,36,'2026-05-10 10:20:59.784'),(109,5,36,'2026-05-10 10:20:59.796'),(110,2,36,'2026-05-10 10:20:59.807'),(111,3,36,'2026-05-10 10:20:59.818'),(112,7,36,'2026-05-10 10:20:59.828'),(113,3,37,'2026-05-10 10:20:59.840'),(114,2,37,'2026-05-10 10:20:59.852'),(115,10,37,'2026-05-10 10:20:59.864'),(116,8,37,'2026-05-10 10:20:59.876'),(117,12,37,'2026-05-10 10:20:59.888'),(118,4,38,'2026-05-10 10:20:59.900'),(119,11,38,'2026-05-10 10:20:59.911'),(120,12,38,'2026-05-10 10:20:59.922'),(121,8,38,'2026-05-10 10:20:59.932'),(122,12,39,'2026-05-10 10:20:59.943'),(123,11,39,'2026-05-10 10:20:59.954'),(124,8,39,'2026-05-10 10:20:59.966'),(125,7,40,'2026-05-10 10:20:59.978'),(126,2,40,'2026-05-10 10:20:59.989'),(127,12,40,'2026-05-10 10:21:00.000'),(128,11,41,'2026-05-10 10:21:00.010'),(129,3,41,'2026-05-10 10:21:00.022'),(130,6,41,'2026-05-10 10:21:00.032'),(131,7,42,'2026-05-10 10:21:00.043'),(132,9,42,'2026-05-10 10:21:00.055'),(133,12,42,'2026-05-10 10:21:00.066'),(134,1,43,'2026-05-10 10:21:00.077'),(135,3,43,'2026-05-10 10:21:00.088'),(136,2,43,'2026-05-10 10:21:00.099'),(137,4,43,'2026-05-10 10:21:00.110'),(138,6,44,'2026-05-10 10:21:00.121'),(139,2,44,'2026-05-10 10:21:00.132'),(140,3,44,'2026-05-10 10:21:00.143'),(141,8,45,'2026-05-10 10:21:00.155'),(142,11,45,'2026-05-10 10:21:00.167'),(143,2,45,'2026-05-10 10:21:00.178'),(144,7,45,'2026-05-10 10:21:00.188');
/*!40000 ALTER TABLE `class_enrollments` ENABLE KEYS */;

--
-- Table structure for table `course_content`
--

DROP TABLE IF EXISTS `course_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_content` (
  `fld_content_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_course_id` int(11) NOT NULL,
  `fld_type` enum('GENERAL','NOTES','ANNOUNCEMENT','FORUM','FILE') NOT NULL DEFAULT 'GENERAL',
  `fld_title` varchar(191) NOT NULL,
  `fld_content` text DEFAULT NULL,
  `fld_file_name` varchar(191) DEFAULT NULL,
  `fld_file_size` varchar(191) DEFAULT NULL,
  `fld_posted_by` int(11) DEFAULT NULL,
  `fld_posted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_content_id`),
  KEY `course_content_fld_course_id_idx` (`fld_course_id`),
  KEY `course_content_fld_type_idx` (`fld_type`),
  KEY `course_content_fld_posted_by_fkey` (`fld_posted_by`),
  CONSTRAINT `course_content_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_content_fld_posted_by_fkey` FOREIGN KEY (`fld_posted_by`) REFERENCES `users` (`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_content`
--

/*!40000 ALTER TABLE `course_content` DISABLE KEYS */;
INSERT INTO `course_content` VALUES (1,1,'GENERAL','Selamat datang ke TTTK3000','Selamat datang ke Projek Tahun Akhir. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,2,'2026-05-10 10:21:00.211'),(2,1,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','3.8 MB',2,'2026-05-10 10:21:00.222'),(3,1,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','1.8 MB',2,'2026-05-10 10:21:00.234'),(4,1,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','3.2 MB',2,'2026-05-10 10:21:00.246'),(5,1,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','4.2 MB',2,'2026-05-10 10:21:00.256'),(6,1,'ANNOUNCEMENT','Pengumuman 1: TTTK3000','Pengumuman penting berkenaan Projek Tahun Akhir.',NULL,NULL,2,'2026-05-10 10:21:00.268'),(7,1,'ANNOUNCEMENT','Pengumuman 2: TTTK3000','Pengumuman penting berkenaan Projek Tahun Akhir.',NULL,NULL,2,'2026-05-10 10:21:00.278'),(8,2,'GENERAL','Selamat datang ke TTTK3413','Selamat datang ke Pembangunan Aplikasi Web. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,2,'2026-05-10 10:21:00.288'),(9,2,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','3.3 MB',2,'2026-05-10 10:21:00.298'),(10,2,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','4.6 MB',2,'2026-05-10 10:21:00.309'),(11,2,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','1.5 MB',2,'2026-05-10 10:21:00.320'),(12,2,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','5.1 MB',2,'2026-05-10 10:21:00.332'),(13,2,'ANNOUNCEMENT','Pengumuman 1: TTTK3413','Pengumuman penting berkenaan Pembangunan Aplikasi Web.',NULL,NULL,2,'2026-05-10 10:21:00.344'),(14,2,'ANNOUNCEMENT','Pengumuman 2: TTTK3413','Pengumuman penting berkenaan Pembangunan Aplikasi Web.',NULL,NULL,2,'2026-05-10 10:21:00.355'),(15,3,'GENERAL','Selamat datang ke TTTK3813','Selamat datang ke Realiti Maya. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,3,'2026-05-10 10:21:00.365'),(16,3,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','1.8 MB',3,'2026-05-10 10:21:00.374'),(17,3,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','4.1 MB',3,'2026-05-10 10:21:00.385'),(18,3,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','3.4 MB',3,'2026-05-10 10:21:00.396'),(19,3,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','2.7 MB',3,'2026-05-10 10:21:00.407'),(20,3,'ANNOUNCEMENT','Pengumuman 1: TTTK3813','Pengumuman penting berkenaan Realiti Maya.',NULL,NULL,3,'2026-05-10 10:21:00.468'),(21,3,'ANNOUNCEMENT','Pengumuman 2: TTTK3813','Pengumuman penting berkenaan Realiti Maya.',NULL,NULL,3,'2026-05-10 10:21:00.480'),(22,4,'GENERAL','Selamat datang ke TTCS3064','Selamat datang ke Pentadbiran Sistem. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,3,'2026-05-10 10:21:00.490'),(23,4,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','2.4 MB',3,'2026-05-10 10:21:00.500'),(24,4,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','2.3 MB',3,'2026-05-10 10:21:00.510'),(25,4,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','2.6 MB',3,'2026-05-10 10:21:00.521'),(26,4,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','1.4 MB',3,'2026-05-10 10:21:00.532'),(27,4,'ANNOUNCEMENT','Pengumuman 1: TTCS3064','Pengumuman penting berkenaan Pentadbiran Sistem.',NULL,NULL,3,'2026-05-10 10:21:00.547'),(28,4,'ANNOUNCEMENT','Pengumuman 2: TTCS3064','Pengumuman penting berkenaan Pentadbiran Sistem.',NULL,NULL,3,'2026-05-10 10:21:00.558'),(29,5,'GENERAL','Selamat datang ke TTCS2043','Selamat datang ke Komputer Etika dan Sosial. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,5,'2026-05-10 10:21:00.570'),(30,5,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','5.3 MB',5,'2026-05-10 10:21:00.581'),(31,5,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','5.6 MB',5,'2026-05-10 10:21:00.591'),(32,5,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','5.5 MB',5,'2026-05-10 10:21:00.602'),(33,5,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','4.2 MB',5,'2026-05-10 10:21:00.614'),(34,5,'ANNOUNCEMENT','Pengumuman 1: TTCS2043','Pengumuman penting berkenaan Komputer Etika dan Sosial.',NULL,NULL,5,'2026-05-10 10:21:00.626'),(35,5,'ANNOUNCEMENT','Pengumuman 2: TTCS2043','Pengumuman penting berkenaan Komputer Etika dan Sosial.',NULL,NULL,5,'2026-05-10 10:21:00.637'),(36,6,'GENERAL','Selamat datang ke TTTK2113','Selamat datang ke Struktur Data dan Algoritma. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,4,'2026-05-10 10:21:00.649'),(37,6,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','2.3 MB',4,'2026-05-10 10:21:00.661'),(38,6,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','2.7 MB',4,'2026-05-10 10:21:00.672'),(39,6,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','4.5 MB',4,'2026-05-10 10:21:00.682'),(40,6,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','2.7 MB',4,'2026-05-10 10:21:00.692'),(41,6,'ANNOUNCEMENT','Pengumuman 1: TTTK2113','Pengumuman penting berkenaan Struktur Data dan Algoritma.',NULL,NULL,4,'2026-05-10 10:21:00.702'),(42,6,'ANNOUNCEMENT','Pengumuman 2: TTTK2113','Pengumuman penting berkenaan Struktur Data dan Algoritma.',NULL,NULL,4,'2026-05-10 10:21:00.714'),(43,7,'GENERAL','Selamat datang ke TTMK3133','Selamat datang ke Pembangunan Mudah Alih. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,9,'2026-05-10 10:21:00.730'),(44,7,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','3.1 MB',9,'2026-05-10 10:21:00.741'),(45,7,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','1.3 MB',9,'2026-05-10 10:21:00.753'),(46,7,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','1.1 MB',9,'2026-05-10 10:21:00.763'),(47,7,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','2.8 MB',9,'2026-05-10 10:21:00.773'),(48,7,'ANNOUNCEMENT','Pengumuman 1: TTMK3133','Pengumuman penting berkenaan Pembangunan Mudah Alih.',NULL,NULL,9,'2026-05-10 10:21:00.783'),(49,7,'ANNOUNCEMENT','Pengumuman 2: TTMK3133','Pengumuman penting berkenaan Pembangunan Mudah Alih.',NULL,NULL,9,'2026-05-10 10:21:00.793'),(50,8,'GENERAL','Selamat datang ke TTCS3023','Selamat datang ke Kecerdasan Buatan. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,6,'2026-05-10 10:21:00.805'),(51,8,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','5.3 MB',6,'2026-05-10 10:21:00.816'),(52,8,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','5.9 MB',6,'2026-05-10 10:21:00.828'),(53,8,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','5.9 MB',6,'2026-05-10 10:21:00.839'),(54,8,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','4.5 MB',6,'2026-05-10 10:21:00.849'),(55,8,'ANNOUNCEMENT','Pengumuman 1: TTCS3023','Pengumuman penting berkenaan Kecerdasan Buatan.',NULL,NULL,6,'2026-05-10 10:21:00.859'),(56,8,'ANNOUNCEMENT','Pengumuman 2: TTCS3023','Pengumuman penting berkenaan Kecerdasan Buatan.',NULL,NULL,6,'2026-05-10 10:21:00.870'),(57,9,'GENERAL','Selamat datang ke TTTK3163','Selamat datang ke Pangkalan Data. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,7,'2026-05-10 10:21:00.880'),(58,9,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','5.6 MB',7,'2026-05-10 10:21:00.891'),(59,9,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','2.3 MB',7,'2026-05-10 10:21:00.903'),(60,9,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','2.9 MB',7,'2026-05-10 10:21:00.914'),(61,9,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','5.8 MB',7,'2026-05-10 10:21:00.925'),(62,9,'ANNOUNCEMENT','Pengumuman 1: TTTK3163','Pengumuman penting berkenaan Pangkalan Data.',NULL,NULL,7,'2026-05-10 10:21:00.940'),(63,9,'ANNOUNCEMENT','Pengumuman 2: TTTK3163','Pengumuman penting berkenaan Pangkalan Data.',NULL,NULL,7,'2026-05-10 10:21:00.949'),(64,10,'GENERAL','Selamat datang ke TTCS3043','Selamat datang ke Interaksi Manusia-Komputer. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,8,'2026-05-10 10:21:00.959'),(65,10,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','1.8 MB',8,'2026-05-10 10:21:00.970'),(66,10,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','1.4 MB',8,'2026-05-10 10:21:00.981'),(67,10,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','4.9 MB',8,'2026-05-10 10:21:00.992'),(68,10,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','4.5 MB',8,'2026-05-10 10:21:01.003'),(69,10,'ANNOUNCEMENT','Pengumuman 1: TTCS3043','Pengumuman penting berkenaan Interaksi Manusia-Komputer.',NULL,NULL,8,'2026-05-10 10:21:01.015'),(70,10,'ANNOUNCEMENT','Pengumuman 2: TTCS3043','Pengumuman penting berkenaan Interaksi Manusia-Komputer.',NULL,NULL,8,'2026-05-10 10:21:01.024'),(71,11,'GENERAL','Selamat datang ke TTTK3133','Selamat datang ke Keselamatan Komputer. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,4,'2026-05-10 10:21:01.034'),(72,11,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','5.4 MB',4,'2026-05-10 10:21:01.044'),(73,11,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','1.7 MB',4,'2026-05-10 10:21:01.055'),(74,11,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','4.1 MB',4,'2026-05-10 10:21:01.066'),(75,11,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','4.1 MB',4,'2026-05-10 10:21:01.078'),(76,11,'ANNOUNCEMENT','Pengumuman 1: TTTK3133','Pengumuman penting berkenaan Keselamatan Komputer.',NULL,NULL,4,'2026-05-10 10:21:01.089'),(77,11,'ANNOUNCEMENT','Pengumuman 2: TTTK3133','Pengumuman penting berkenaan Keselamatan Komputer.',NULL,NULL,4,'2026-05-10 10:21:01.100'),(78,12,'GENERAL','Selamat datang ke TTMK3013','Selamat datang ke Pembelajaran Mesin. Semakan silibus dan jadual akan dimuat naik di sini.',NULL,NULL,6,'2026-05-10 10:21:01.111'),(79,12,'NOTES','Minggu 1: Topik 1','Nota kuliah untuk Minggu 1.','minggu-1.pdf','2.0 MB',6,'2026-05-10 10:21:01.121'),(80,12,'NOTES','Minggu 2: Topik 2','Nota kuliah untuk Minggu 2.','minggu-2.pdf','3.9 MB',6,'2026-05-10 10:21:01.132'),(81,12,'NOTES','Minggu 3: Topik 3','Nota kuliah untuk Minggu 3.','minggu-3.pdf','5.7 MB',6,'2026-05-10 10:21:01.142'),(82,12,'NOTES','Minggu 4: Topik 4','Nota kuliah untuk Minggu 4.','minggu-4.pdf','4.7 MB',6,'2026-05-10 10:21:01.153'),(83,12,'ANNOUNCEMENT','Pengumuman 1: TTMK3013','Pengumuman penting berkenaan Pembelajaran Mesin.',NULL,NULL,6,'2026-05-10 10:21:01.164'),(84,12,'ANNOUNCEMENT','Pengumuman 2: TTMK3013','Pengumuman penting berkenaan Pembelajaran Mesin.',NULL,NULL,6,'2026-05-10 10:21:01.175');
/*!40000 ALTER TABLE `course_content` ENABLE KEYS */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `fld_course_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_course_code` varchar(191) NOT NULL,
  `fld_title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `fld_lecturer_id` int(11) DEFAULT NULL,
  `fld_semester` varchar(191) DEFAULT NULL,
  `fld_credit_hour` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `fld_groups_locked` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`fld_course_id`),
  UNIQUE KEY `courses_fld_course_code_key` (`fld_course_code`),
  KEY `courses_fld_lecturer_id_idx` (`fld_lecturer_id`),
  CONSTRAINT `courses_fld_lecturer_id_fkey` FOREIGN KEY (`fld_lecturer_id`) REFERENCES `users` (`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'TTTK3000','Projek Tahun Akhir','Projek penyelidikan dan pembangunan akhir tahun bagi pelajar tahun 3.',2,'Sem 1 26/27',3,'2026-05-10 10:20:58.307','2026-05-17 17:54:43.220',1),(2,'TTTK3413','Pembangunan Aplikasi Web','Pengenalan kepada pembangunan web moden menggunakan rangka kerja terkini.',2,'Sem 1 26/27',3,'2026-05-10 10:20:58.320','2026-05-15 11:36:41.564',0),(3,'TTTK3813','Realiti Maya','Pembangunan aplikasi VR/AR dan pengalaman immersif.',3,'Sem 1 26/27',3,'2026-05-10 10:20:58.332','2026-05-15 11:36:41.577',0),(4,'TTCS3064','Pentadbiran Sistem','Pentadbiran pelayan dan rangkaian dalam persekitaran pengeluaran.',3,'Sem 2 26/27',3,'2026-05-10 10:20:58.343','2026-05-15 11:36:41.591',0),(5,'TTCS2043','Komputer Etika dan Sosial','Isu etika, sosial, dan profesional dalam bidang teknologi maklumat.',5,'Sem 2 26/27',2,'2026-05-10 10:20:58.353','2026-05-15 11:36:41.604',0),(6,'TTTK2113','Struktur Data dan Algoritma','Pengenalan kepada struktur data klasik dan analisis algoritma.',4,'Sem 1 26/27',3,'2026-05-10 10:20:58.364','2026-05-15 11:36:41.618',0),(7,'TTMK3133','Pembangunan Mudah Alih','Pembangunan aplikasi mudah alih merentas platform.',9,'Sem 2 26/27',3,'2026-05-10 10:20:58.375','2026-05-15 11:36:41.631',0),(8,'TTCS3023','Kecerdasan Buatan','Asas kecerdasan buatan, pencarian, dan pembelajaran mesin.',6,'Sem 1 26/27',3,'2026-05-10 10:20:58.388','2026-05-15 11:36:41.644',0),(9,'TTTK3163','Pangkalan Data','Reka bentuk pangkalan data hubungan dan SQL lanjutan.',7,'Sem 1 26/27',3,'2026-05-10 10:20:58.400','2026-05-15 11:36:41.658',0),(10,'TTCS3043','Interaksi Manusia-Komputer','Prinsip reka bentuk antara muka pengguna dan kebolehgunaan.',8,'Sem 2 26/27',3,'2026-05-10 10:20:58.472','2026-05-15 11:36:41.671',0),(11,'TTTK3133','Keselamatan Komputer','Asas keselamatan sistem, kriptografi, dan analisis ancaman.',4,'Sem 2 26/27',3,'2026-05-10 10:20:58.484','2026-05-15 11:36:41.684',0),(12,'TTMK3013','Pembelajaran Mesin','Algoritma pembelajaran mesin diselia dan tidak diselia.',6,'Sem 2 26/27',3,'2026-05-10 10:20:58.496','2026-05-15 11:36:41.697',0);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;

--
-- Table structure for table `folio_comments`
--

DROP TABLE IF EXISTS `folio_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folio_comments` (
  `fld_comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_post_id` int(11) NOT NULL,
  `fld_author_id` int(11) NOT NULL,
  `fld_content` text NOT NULL,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_comment_id`),
  KEY `folio_comments_fld_post_id_idx` (`fld_post_id`),
  KEY `folio_comments_fld_author_id_idx` (`fld_author_id`),
  CONSTRAINT `folio_comments_fld_author_id_fkey` FOREIGN KEY (`fld_author_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `folio_comments_fld_post_id_fkey` FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts` (`fld_post_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folio_comments`
--

/*!40000 ALTER TABLE `folio_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `folio_comments` ENABLE KEYS */;

--
-- Table structure for table `folio_post_images`
--

DROP TABLE IF EXISTS `folio_post_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folio_post_images` (
  `fld_image_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_post_id` int(11) NOT NULL,
  `fld_image_path` varchar(191) NOT NULL,
  `fld_position` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`fld_image_id`),
  KEY `folio_post_images_fld_post_id_idx` (`fld_post_id`),
  CONSTRAINT `folio_post_images_fld_post_id_fkey` FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts` (`fld_post_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folio_post_images`
--

/*!40000 ALTER TABLE `folio_post_images` DISABLE KEYS */;
INSERT INTO `folio_post_images` VALUES (1,11,'/uploads/folio/1779085019980-436d67c82519.jpg',0);
/*!40000 ALTER TABLE `folio_post_images` ENABLE KEYS */;

--
-- Table structure for table `folio_post_mentions`
--

DROP TABLE IF EXISTS `folio_post_mentions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folio_post_mentions` (
  `fld_mention_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_post_id` int(11) NOT NULL,
  `fld_user_id` int(11) NOT NULL,
  `fld_matric_num` varchar(191) NOT NULL,
  PRIMARY KEY (`fld_mention_id`),
  KEY `folio_post_mentions_fld_post_id_idx` (`fld_post_id`),
  KEY `folio_post_mentions_fld_user_id_idx` (`fld_user_id`),
  CONSTRAINT `folio_post_mentions_fld_post_id_fkey` FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts` (`fld_post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `folio_post_mentions_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folio_post_mentions`
--

/*!40000 ALTER TABLE `folio_post_mentions` DISABLE KEYS */;
/*!40000 ALTER TABLE `folio_post_mentions` ENABLE KEYS */;

--
-- Table structure for table `folio_posts`
--

DROP TABLE IF EXISTS `folio_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folio_posts` (
  `fld_post_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_author_id` int(11) NOT NULL,
  `fld_content` text NOT NULL,
  `fld_visibility` enum('PUBLIC','FACULTY','FRIENDS') NOT NULL DEFAULT 'PUBLIC',
  `fld_parent_id` int(11) DEFAULT NULL,
  `fld_is_repost` tinyint(1) NOT NULL DEFAULT 0,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_post_id`),
  KEY `folio_posts_fld_author_id_idx` (`fld_author_id`),
  KEY `folio_posts_fld_parent_id_idx` (`fld_parent_id`),
  KEY `folio_posts_fld_created_at_idx` (`fld_created_at`),
  CONSTRAINT `folio_posts_fld_author_id_fkey` FOREIGN KEY (`fld_author_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `folio_posts_fld_parent_id_fkey` FOREIGN KEY (`fld_parent_id`) REFERENCES `folio_posts` (`fld_post_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folio_posts`
--

/*!40000 ALTER TABLE `folio_posts` DISABLE KEYS */;
INSERT INTO `folio_posts` VALUES (1,10,'Selamat datang ke Folio Connect! Drop your matric kalau dah jumpa feature ni 👋','PUBLIC',NULL,0,'2026-05-15 11:36:44.972'),(2,46,'Hari ni kelas struktur konkrit. Doakan tutorial saya tak runtuh.','PUBLIC',NULL,0,'2026-05-15 11:36:44.982'),(3,47,'Lab transmission lines dah siap. Next stop: kopi.','PUBLIC',NULL,0,'2026-05-15 11:36:44.992'),(4,56,'Reading week mood: 80% notes, 20% mental breakdown.','PUBLIC',NULL,0,'2026-05-15 11:36:45.025'),(5,61,'Behind the mic in studio 2. Catch our morning show next week 📻','PUBLIC',NULL,0,'2026-05-15 11:36:45.035'),(6,66,'Lautan tak pernah penat. Hari ke-3 sampling di Pulau Tioman.','PUBLIC',NULL,0,'2026-05-15 11:36:45.046'),(7,71,'Recycling drive @ Kolej Tun Dr Ismail esok. Jom turun!','PUBLIC',NULL,0,'2026-05-15 11:36:45.056'),(8,51,'Project final EE: mini-grid solar. Test run berjaya 🌞','PUBLIC',NULL,0,'2026-05-15 11:36:45.068'),(9,10,'','PUBLIC',2,1,'2026-05-15 11:36:45.080'),(10,10,'','PUBLIC',3,1,'2026-05-15 11:36:45.092'),(11,10,'Test','PUBLIC',NULL,0,'2026-05-18 06:16:59.983'),(12,2,'','PUBLIC',11,1,'2026-05-18 06:17:21.623');
/*!40000 ALTER TABLE `folio_posts` ENABLE KEYS */;

--
-- Table structure for table `folio_reactions`
--

DROP TABLE IF EXISTS `folio_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folio_reactions` (
  `fld_reaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_post_id` int(11) NOT NULL,
  `fld_user_id` int(11) NOT NULL,
  `fld_emoji` varchar(16) NOT NULL,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_reaction_id`),
  UNIQUE KEY `uniq_post_user_emoji` (`fld_post_id`,`fld_user_id`,`fld_emoji`),
  KEY `folio_reactions_fld_post_id_idx` (`fld_post_id`),
  KEY `folio_reactions_fld_user_id_fkey` (`fld_user_id`),
  CONSTRAINT `folio_reactions_fld_post_id_fkey` FOREIGN KEY (`fld_post_id`) REFERENCES `folio_posts` (`fld_post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `folio_reactions_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folio_reactions`
--

/*!40000 ALTER TABLE `folio_reactions` DISABLE KEYS */;
INSERT INTO `folio_reactions` VALUES (1,3,10,'😂','2026-05-15 12:02:07.486');
/*!40000 ALTER TABLE `folio_reactions` ENABLE KEYS */;

--
-- Table structure for table `friendships`
--

DROP TABLE IF EXISTS `friendships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `friendships` (
  `fld_friendship_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_student_id1` int(11) NOT NULL,
  `fld_student_id2` int(11) NOT NULL,
  `fld_status` enum('PENDING','ACCEPTED') NOT NULL DEFAULT 'PENDING',
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_friendship_id`),
  UNIQUE KEY `unique_friendship` (`fld_student_id1`,`fld_student_id2`),
  KEY `friendships_fld_student_id2_fkey` (`fld_student_id2`),
  CONSTRAINT `friendships_fld_student_id1_fkey` FOREIGN KEY (`fld_student_id1`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `friendships_fld_student_id2_fkey` FOREIGN KEY (`fld_student_id2`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friendships`
--

/*!40000 ALTER TABLE `friendships` DISABLE KEYS */;
INSERT INTO `friendships` VALUES (1,10,13,'ACCEPTED','2026-05-10 10:21:08.381'),(2,32,10,'ACCEPTED','2026-05-10 10:21:08.394'),(3,10,37,'ACCEPTED','2026-05-10 10:21:08.405'),(4,12,10,'ACCEPTED','2026-05-10 10:21:08.434'),(5,10,18,'ACCEPTED','2026-05-10 10:21:08.448'),(6,29,10,'ACCEPTED','2026-05-10 10:21:08.457'),(7,10,23,'PENDING','2026-05-10 10:21:08.468'),(8,31,10,'ACCEPTED','2026-05-10 10:21:08.479'),(9,39,41,'ACCEPTED','2026-05-10 10:21:08.489'),(10,11,17,'ACCEPTED','2026-05-10 10:21:08.501'),(11,11,21,'ACCEPTED','2026-05-10 10:21:08.513'),(12,28,32,'ACCEPTED','2026-05-10 10:21:08.525'),(13,29,26,'ACCEPTED','2026-05-10 10:21:08.538'),(14,34,45,'ACCEPTED','2026-05-10 10:21:08.548'),(15,44,36,'ACCEPTED','2026-05-10 10:21:08.558'),(16,19,35,'ACCEPTED','2026-05-10 10:21:08.570'),(17,38,31,'ACCEPTED','2026-05-10 10:21:08.580'),(18,14,36,'ACCEPTED','2026-05-10 10:21:08.592'),(19,23,27,'ACCEPTED','2026-05-10 10:21:08.604'),(20,25,36,'ACCEPTED','2026-05-10 10:21:08.624'),(21,14,25,'ACCEPTED','2026-05-10 10:21:08.635'),(22,36,12,'ACCEPTED','2026-05-10 10:21:08.646'),(23,37,14,'ACCEPTED','2026-05-10 10:21:08.656'),(24,14,28,'ACCEPTED','2026-05-10 10:21:08.666'),(25,13,20,'ACCEPTED','2026-05-10 10:21:08.677'),(26,13,35,'ACCEPTED','2026-05-10 10:21:08.688'),(27,33,27,'ACCEPTED','2026-05-10 10:21:08.700'),(28,29,17,'ACCEPTED','2026-05-10 10:21:08.712'),(29,22,18,'ACCEPTED','2026-05-10 10:21:08.723'),(30,22,29,'ACCEPTED','2026-05-10 10:21:08.733'),(31,12,17,'ACCEPTED','2026-05-10 10:21:08.743'),(32,32,16,'ACCEPTED','2026-05-10 10:21:08.754'),(33,21,29,'ACCEPTED','2026-05-10 10:21:08.787'),(35,38,14,'PENDING','2026-05-11 16:12:08.546'),(36,38,10,'ACCEPTED','2026-05-11 16:12:12.721'),(37,10,36,'ACCEPTED','2026-05-15 11:36:44.605'),(38,24,10,'ACCEPTED','2026-05-15 11:36:44.619'),(39,10,29,'ACCEPTED','2026-05-15 11:36:44.630'),(40,14,10,'ACCEPTED','2026-05-15 11:36:44.640'),(41,10,26,'ACCEPTED','2026-05-15 11:36:44.651'),(42,19,10,'ACCEPTED','2026-05-15 11:36:44.662'),(43,10,17,'PENDING','2026-05-15 11:36:44.674'),(44,18,10,'ACCEPTED','2026-05-15 11:36:44.685'),(45,43,35,'ACCEPTED','2026-05-15 11:36:44.695'),(46,15,39,'ACCEPTED','2026-05-15 11:36:44.705'),(47,22,33,'ACCEPTED','2026-05-15 11:36:44.715'),(48,13,30,'ACCEPTED','2026-05-15 11:36:44.726'),(49,42,14,'ACCEPTED','2026-05-15 11:36:44.737'),(50,22,15,'ACCEPTED','2026-05-15 11:36:44.749'),(51,44,42,'ACCEPTED','2026-05-15 11:36:44.760'),(52,36,24,'ACCEPTED','2026-05-15 11:36:44.770'),(53,21,30,'ACCEPTED','2026-05-15 11:36:44.782'),(54,37,31,'ACCEPTED','2026-05-15 11:36:44.793'),(55,39,35,'ACCEPTED','2026-05-15 11:36:44.804'),(56,32,45,'ACCEPTED','2026-05-15 11:36:44.814'),(57,17,25,'ACCEPTED','2026-05-15 11:36:44.826'),(58,11,15,'ACCEPTED','2026-05-15 11:36:44.837'),(59,26,39,'ACCEPTED','2026-05-15 11:36:44.848'),(60,17,30,'ACCEPTED','2026-05-15 11:36:44.858'),(61,14,20,'ACCEPTED','2026-05-15 11:36:44.869'),(62,27,43,'ACCEPTED','2026-05-15 11:36:44.880'),(63,17,34,'ACCEPTED','2026-05-15 11:36:44.891'),(64,38,19,'ACCEPTED','2026-05-15 11:36:44.903'),(65,43,23,'ACCEPTED','2026-05-15 11:36:44.913'),(66,31,24,'ACCEPTED','2026-05-15 11:36:44.926'),(67,40,18,'ACCEPTED','2026-05-15 11:36:44.937'),(68,21,41,'ACCEPTED','2026-05-15 11:36:44.948'),(69,2,32,'PENDING','2026-05-17 07:25:06.822'),(70,2,10,'ACCEPTED','2026-05-18 06:17:34.778');
/*!40000 ALTER TABLE `friendships` ENABLE KEYS */;

--
-- Table structure for table `group_access_requests`
--

DROP TABLE IF EXISTS `group_access_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_access_requests` (
  `fld_access_req_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_type` enum('JOIN','LEAVE') NOT NULL,
  `fld_status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `fld_course_id` int(11) NOT NULL,
  `fld_group_id` int(11) NOT NULL,
  `fld_student_id` int(11) NOT NULL,
  `fld_reason` text DEFAULT NULL,
  `fld_responded_by` int(11) DEFAULT NULL,
  `fld_responded_at` datetime(3) DEFAULT NULL,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_access_req_id`),
  KEY `group_access_requests_fld_course_id_fld_status_idx` (`fld_course_id`,`fld_status`),
  KEY `group_access_requests_fld_student_id_idx` (`fld_student_id`),
  KEY `group_access_requests_fld_group_id_fkey` (`fld_group_id`),
  KEY `group_access_requests_fld_responded_by_fkey` (`fld_responded_by`),
  CONSTRAINT `group_access_requests_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_access_requests_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups` (`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_access_requests_fld_responded_by_fkey` FOREIGN KEY (`fld_responded_by`) REFERENCES `users` (`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `group_access_requests_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_access_requests`
--

/*!40000 ALTER TABLE `group_access_requests` DISABLE KEYS */;
INSERT INTO `group_access_requests` VALUES (1,'LEAVE','REJECTED',1,1,10,'Saya tak suka hakim',2,'2026-05-17 17:55:54.620','2026-05-17 17:55:33.686');
/*!40000 ALTER TABLE `group_access_requests` ENABLE KEYS */;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_members` (
  `fld_member_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_group_id` int(11) NOT NULL,
  `fld_student_id` int(11) NOT NULL,
  `fld_role` enum('LEADER','MEMBER') NOT NULL DEFAULT 'MEMBER',
  PRIMARY KEY (`fld_member_id`),
  UNIQUE KEY `uniq_group_student` (`fld_group_id`,`fld_student_id`),
  KEY `group_members_fld_student_id_fkey` (`fld_student_id`),
  CONSTRAINT `group_members_fld_group_id_fkey` FOREIGN KEY (`fld_group_id`) REFERENCES `project_groups` (`fld_group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_members_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_members`
--

/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
INSERT INTO `group_members` VALUES (1,1,10,'LEADER'),(2,1,24,'MEMBER'),(3,2,32,'LEADER'),(4,2,30,'MEMBER'),(5,2,29,'MEMBER'),(6,3,26,'LEADER'),(7,3,16,'MEMBER'),(8,4,21,'LEADER'),(9,4,34,'MEMBER'),(10,4,17,'MEMBER'),(11,5,19,'LEADER'),(12,5,22,'MEMBER'),(13,5,40,'MEMBER'),(14,6,10,'LEADER'),(15,6,44,'MEMBER'),(16,7,43,'LEADER'),(17,7,41,'MEMBER'),(18,7,36,'MEMBER'),(19,7,10,'MEMBER'),(20,8,44,'LEADER'),(21,8,35,'MEMBER'),(22,9,16,'LEADER'),(23,9,36,'MEMBER'),(24,9,10,'MEMBER'),(25,10,38,'LEADER'),(26,10,21,'MEMBER'),(27,11,33,'LEADER'),(28,11,29,'MEMBER'),(29,11,13,'MEMBER'),(30,12,38,'LEADER'),(31,12,20,'MEMBER'),(32,12,43,'MEMBER'),(33,12,31,'MEMBER'),(34,13,19,'LEADER'),(35,13,36,'MEMBER'),(36,13,13,'MEMBER'),(37,14,34,'LEADER'),(38,14,30,'MEMBER'),(39,14,19,'MEMBER'),(40,15,13,'LEADER'),(41,15,30,'MEMBER'),(42,15,36,'MEMBER'),(43,16,18,'LEADER'),(44,16,23,'MEMBER'),(45,17,12,'LEADER'),(46,17,21,'MEMBER'),(47,17,41,'MEMBER'),(48,18,21,'LEADER'),(49,18,14,'MEMBER'),(50,18,31,'MEMBER'),(51,18,12,'MEMBER'),(52,19,11,'LEADER'),(53,19,15,'MEMBER'),(54,19,45,'MEMBER'),(55,20,15,'LEADER'),(56,20,33,'MEMBER'),(57,21,33,'LEADER'),(58,21,15,'MEMBER'),(59,21,40,'MEMBER'),(60,22,38,'LEADER'),(61,22,15,'MEMBER'),(62,22,20,'MEMBER'),(63,23,38,'LEADER'),(64,23,39,'MEMBER'),(65,24,32,'LEADER'),(66,24,39,'MEMBER'),(67,24,28,'MEMBER'),(68,25,25,'LEADER'),(69,25,28,'MEMBER'),(70,26,42,'LEADER'),(71,26,22,'MEMBER'),(72,27,32,'LEADER'),(73,27,27,'MEMBER'),(74,28,11,'LEADER'),(75,28,22,'MEMBER'),(76,28,30,'MEMBER'),(77,29,30,'LEADER'),(78,29,37,'MEMBER'),(79,29,27,'MEMBER'),(80,29,13,'MEMBER'),(81,30,11,'LEADER'),(82,30,13,'MEMBER'),(83,30,37,'MEMBER'),(84,30,15,'MEMBER'),(86,8,26,'MEMBER'),(87,9,24,'MEMBER'),(88,7,37,'MEMBER'),(89,1,29,'MEMBER'),(90,1,32,'MEMBER'),(91,2,16,'MEMBER'),(92,2,34,'MEMBER'),(93,3,31,'LEADER'),(94,3,29,'MEMBER'),(95,4,18,'LEADER'),(96,5,43,'LEADER'),(97,5,44,'MEMBER'),(98,6,35,'LEADER'),(99,6,17,'MEMBER'),(100,6,19,'MEMBER'),(101,7,26,'LEADER'),(102,7,35,'MEMBER'),(103,7,16,'MEMBER'),(104,8,43,'LEADER'),(105,8,41,'MEMBER'),(106,9,44,'LEADER'),(107,9,35,'MEMBER'),(108,9,43,'MEMBER'),(109,10,13,'LEADER'),(110,11,38,'LEADER'),(111,11,20,'MEMBER'),(112,11,31,'MEMBER'),(113,13,14,'LEADER'),(114,13,24,'MEMBER'),(115,13,30,'MEMBER'),(116,14,36,'LEADER'),(117,14,14,'MEMBER'),(118,15,34,'MEMBER'),(119,16,14,'LEADER'),(120,16,31,'MEMBER'),(121,16,41,'MEMBER'),(122,17,44,'LEADER'),(123,18,20,'LEADER'),(124,18,18,'MEMBER'),(125,19,27,'LEADER'),(126,19,42,'MEMBER'),(127,19,13,'MEMBER'),(128,20,40,'LEADER'),(129,20,14,'MEMBER'),(130,21,42,'LEADER'),(131,21,13,'MEMBER'),(132,21,11,'MEMBER'),(133,22,39,'LEADER'),(134,22,28,'MEMBER'),(135,23,28,'LEADER'),(136,23,15,'MEMBER'),(137,23,22,'MEMBER'),(138,24,45,'LEADER'),(139,24,22,'MEMBER'),(140,25,26,'MEMBER'),(141,26,32,'LEADER'),(142,26,21,'MEMBER'),(143,27,36,'LEADER'),(144,27,29,'MEMBER'),(145,28,15,'LEADER'),(146,28,37,'MEMBER'),(147,29,22,'LEADER'),(148,30,34,'MEMBER'),(149,31,36,'LEADER'),(150,31,14,'MEMBER'),(151,31,28,'MEMBER'),(152,31,12,'MEMBER'),(153,31,11,'MEMBER'),(154,32,29,'LEADER'),(155,32,37,'MEMBER'),(156,32,45,'MEMBER'),(158,33,31,'LEADER'),(159,33,23,'MEMBER'),(160,33,10,'MEMBER'),(161,33,21,'MEMBER'),(162,33,25,'MEMBER'),(163,34,24,'LEADER'),(164,34,37,'MEMBER'),(165,34,16,'MEMBER');
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;

--
-- Table structure for table `message_requests`
--

DROP TABLE IF EXISTS `message_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message_requests` (
  `fld_msg_req_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_sender_id` int(11) NOT NULL,
  `fld_receiver_id` int(11) NOT NULL,
  `fld_status` enum('PENDING','ACCEPTED') NOT NULL DEFAULT 'PENDING',
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_msg_req_id`),
  UNIQUE KEY `uniq_msg_request` (`fld_sender_id`,`fld_receiver_id`),
  KEY `message_requests_fld_receiver_id_idx` (`fld_receiver_id`),
  CONSTRAINT `message_requests_fld_receiver_id_fkey` FOREIGN KEY (`fld_receiver_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `message_requests_fld_sender_id_fkey` FOREIGN KEY (`fld_sender_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_requests`
--

/*!40000 ALTER TABLE `message_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_requests` ENABLE KEYS */;

--
-- Table structure for table `monitoring_notes`
--

DROP TABLE IF EXISTS `monitoring_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `monitoring_notes` (
  `fld_note_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_course_id` int(11) NOT NULL,
  `fld_lecturer_id` int(11) NOT NULL,
  `fld_student_id` int(11) NOT NULL,
  `fld_note` text NOT NULL,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`fld_note_id`),
  UNIQUE KEY `uniq_monitoring_note` (`fld_course_id`,`fld_lecturer_id`,`fld_student_id`),
  KEY `monitoring_notes_fld_course_id_fld_lecturer_id_idx` (`fld_course_id`,`fld_lecturer_id`),
  KEY `monitoring_notes_fld_lecturer_id_fkey` (`fld_lecturer_id`),
  KEY `monitoring_notes_fld_student_id_fkey` (`fld_student_id`),
  CONSTRAINT `monitoring_notes_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `monitoring_notes_fld_lecturer_id_fkey` FOREIGN KEY (`fld_lecturer_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `monitoring_notes_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `monitoring_notes`
--

/*!40000 ALTER TABLE `monitoring_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `monitoring_notes` ENABLE KEYS */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `fld_notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_user_id` int(11) NOT NULL,
  `fld_title` varchar(191) NOT NULL,
  `fld_message` text NOT NULL,
  `fld_link` varchar(191) DEFAULT '',
  `fld_read` tinyint(1) NOT NULL DEFAULT 0,
  `fld_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_notification_id`),
  KEY `notifications_fld_user_id_idx` (`fld_user_id`),
  KEY `notifications_fld_created_at_idx` (`fld_created_at`),
  CONSTRAINT `notifications_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,10,'Pengumuman Baharu (TTTK3413)','Pensyarah anda telah memuat naik pengumuman baharu.','course',0,'2026-05-10 10:21:09.624'),(2,10,'Tugasan Baharu (TTTK3000)','Tugasan baharu telah ditambah ke kursus anda.','course',0,'2026-05-10 06:21:09.639'),(3,10,'Markah Diterima','Anda telah menerima markah untuk tugasan terbaru.','submissions',0,'2026-05-10 02:21:09.649'),(4,10,'Mesej Baharu','Anda mempunyai mesej peribadi baharu.','chat',0,'2026-05-09 22:21:09.677'),(5,10,'Permintaan Rakan Diterima','Permintaan rakan anda telah diterima.','chat',0,'2026-05-09 18:21:09.689'),(6,10,'Sertai Kumpulan','Anda kini ahli Kumpulan Alpha (TTTK3000).','groups',0,'2026-05-09 14:21:09.702'),(7,10,'Peringatan Acara','Mesyuarat kumpulan esok jam 2 petang.','calendar',0,'2026-05-09 10:21:09.712'),(8,10,'⚠️ AMARAN','Sila hantar tugasan anda sebelum tarikh akhir.','submissions',0,'2026-05-09 06:21:09.722'),(9,10,'Pengumuman Baharu (TTTK3413)','Pensyarah anda telah memuat naik pengumuman baharu.','course',0,'2026-05-09 02:21:09.733'),(10,10,'Tugasan Baharu (TTTK3000)','Tugasan baharu telah ditambah ke kursus anda.','course',0,'2026-05-08 22:21:09.743'),(11,10,'Markah Diterima','Anda telah menerima markah untuk tugasan terbaru.','submissions',0,'2026-05-08 18:21:09.754'),(12,10,'Mesej Baharu','Anda mempunyai mesej peribadi baharu.','chat',0,'2026-05-08 14:21:09.765'),(13,10,'Permintaan Rakan Diterima','Permintaan rakan anda telah diterima.','chat',0,'2026-05-08 10:21:09.776'),(14,10,'Sertai Kumpulan','Anda kini ahli Kumpulan Alpha (TTTK3000).','groups',0,'2026-05-08 06:21:09.834'),(15,10,'Peringatan Acara','Mesyuarat kumpulan esok jam 2 petang.','calendar',0,'2026-05-08 02:21:09.879'),(16,10,'⚠️ AMARAN','Sila hantar tugasan anda sebelum tarikh akhir.','submissions',1,'2026-05-07 22:21:09.908'),(17,10,'Pengumuman Baharu (TTTK3413)','Pensyarah anda telah memuat naik pengumuman baharu.','course',1,'2026-05-07 18:21:09.921'),(18,10,'Tugasan Baharu (TTTK3000)','Tugasan baharu telah ditambah ke kursus anda.','course',1,'2026-05-07 14:21:09.932'),(19,10,'Markah Diterima','Anda telah menerima markah untuk tugasan terbaru.','submissions',1,'2026-05-07 10:21:09.944'),(20,10,'Mesej Baharu','Anda mempunyai mesej peribadi baharu.','chat',1,'2026-05-07 06:21:09.956'),(21,31,'Permintaan Rakan Diterima','Siti Sarah telah menerima permintaan rakan anda.','chat',0,'2026-05-10 10:23:47.606'),(22,29,'Permintaan Rakan Diterima','Siti Sarah telah menerima permintaan rakan anda.','chat',0,'2026-05-10 10:23:48.500'),(23,2,'Mesej Baharu','Siti Sarah: Assalamualaikum dr,','chat',0,'2026-05-10 10:52:29.417'),(24,10,'Sertai Kumpulan','Anda kini ahli Kumpulan Alpha (TTCS3023).','groups',0,'2026-05-10 11:06:27.871'),(25,32,'Kumpulan Chat Baharu','Siti Sarah menambah anda ke \"FYP Jom!\".','chat',0,'2026-05-10 19:07:07.039'),(26,2,'Kumpulan Chat Baharu','Siti Sarah menambah anda ke \"FYP Jom!\".','chat',0,'2026-05-10 19:07:07.039'),(27,10,'Mesej Baharu','Dr. Azman Abdullah: Waalaiakumussalam','chat',1,'2026-05-11 16:10:19.285'),(28,2,'Mesej Baharu','Siti Sarah: Dr sihat?, saya nak tanya tentang FYP boleh?','chat',0,'2026-05-11 16:10:49.350'),(29,2,'Permintaan Rakan Baharu','Siti Sarah menghantar permintaan rakan kepada anda.','chat',0,'2026-05-11 16:10:55.709'),(30,2,'Kumpulan Chat Baharu','Siti Sarah menambah anda ke \"Kumpulan FYP 2\".','chat',0,'2026-05-11 16:11:11.382'),(31,38,'Ditambah ke Kumpulan Chat','Siti Sarah menambah anda ke \"Kumpulan FYP 2\".','chat',0,'2026-05-11 16:11:28.073'),(32,14,'Permintaan Rakan Baharu','Zaim Iskandar menghantar permintaan rakan kepada anda.','chat',0,'2026-05-11 16:12:08.560'),(33,10,'Permintaan Rakan Baharu','Zaim Iskandar menghantar permintaan rakan kepada anda.','chat',0,'2026-05-11 16:12:12.732'),(34,38,'Permintaan Rakan Diterima','Siti Sarah telah menerima permintaan rakan anda.','chat',0,'2026-05-11 16:12:25.423'),(35,38,'Mesej Baharu','Siti Sarah: Hello zaim','chat',0,'2026-05-11 16:12:31.439'),(36,26,'Ditambah ke Kumpulan Beta (TTTK3813)','Pensyarah telah meletakkan anda dalam Kumpulan Beta (TTTK3813) (TTTK3813).','groups',0,'2026-05-11 16:13:00.088'),(37,24,'Ditambah ke Kumpulan Gamma (TTTK3813)','Pensyarah telah meletakkan anda dalam Kumpulan Gamma (TTTK3813) (TTTK3813).','groups',0,'2026-05-11 16:13:01.337'),(38,37,'Ditambah ke Kumpulan Alpha (TTTK3813)','Pensyarah telah meletakkan anda dalam Kumpulan Alpha (TTTK3813) (TTTK3813).','groups',0,'2026-05-11 16:13:02.184'),(39,2,'Kumpulan Chat Baharu','Dr. Faridah Mohd Saman menambah anda ke \"Kumpulan Dr\".','chat',0,'2026-05-11 16:13:47.864'),(40,4,'Kumpulan Chat Baharu','Dr. Faridah Mohd Saman menambah anda ke \"Kumpulan Dr\".','chat',0,'2026-05-11 16:13:47.864'),(41,6,'Kumpulan Chat Baharu','Dr. Faridah Mohd Saman menambah anda ke \"Kumpulan Dr\".','chat',0,'2026-05-11 16:13:47.864'),(42,8,'Kumpulan Chat Baharu','Dr. Faridah Mohd Saman menambah anda ke \"Kumpulan Dr\".','chat',0,'2026-05-11 16:13:47.864'),(43,9,'Kumpulan Chat Baharu','Dr. Faridah Mohd Saman menambah anda ke \"Kumpulan Dr\".','chat',0,'2026-05-11 16:13:47.864'),(44,10,'Permintaan Rakan Diterima','Dr. Azman Abdullah telah menerima permintaan rakan anda.','chat',0,'2026-05-15 04:20:19.707'),(45,40,'⚠️ Amaran (TTTK3413): Dr. Azman Abdullah','Anda telah dikesan tidak aktif dalam TTTK3000. Sila hubungi pensyarah dan kemaskini penghantaran anda secepat mungkin.','warning',0,'2026-05-15 08:13:49.377'),(46,18,'Permintaan Rakan Diterima','Siti Sarah telah menerima permintaan rakan anda.','chat',0,'2026-05-15 12:02:27.840'),(47,19,'Permintaan Rakan Diterima','Siti Sarah telah menerima permintaan rakan anda.','chat',0,'2026-05-15 12:02:29.590'),(48,36,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(49,14,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(50,28,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(51,12,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(52,11,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(53,29,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(54,37,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(55,45,'Anda telah dikumpulkan','Pensyarah TTTK3413 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-17 03:47:00.587'),(56,32,'Permintaan Rakan Baharu','Dr. Azman Abdullah menghantar permintaan rakan kepada anda.','chat',0,'2026-05-17 07:25:06.833'),(57,43,'Ditambah ke Kumpulan Gamma (TTTK3000)','Pensyarah telah meletakkan anda dalam Kumpulan Gamma (TTTK3000) (TTTK3000).','groups',0,'2026-05-17 17:48:38.633'),(58,2,'Permohonan Keluar Kumpulan — TTTK3000','Siti Sarah memohon untuk keluar dari Kumpulan Alpha (TTTK3000).','groups',0,'2026-05-17 17:55:33.703'),(59,10,'Permohonan Keluar Kumpulan Ditolak','Permohonan untuk Kumpulan Alpha (TTTK3000) (TTTK3000) telah ditolak.','groups',0,'2026-05-17 17:55:54.655'),(60,10,'Dr. Azman Abdullah berkongsi pos anda','Test','/folio/pos/11',0,'2026-05-18 06:17:21.635'),(61,10,'Permintaan Rakan Baharu','Dr. Azman Abdullah menghantar permintaan rakan kepada anda.','chat',0,'2026-05-18 06:17:34.791'),(62,2,'Permintaan Rakan Diterima','Siti Sarah telah menerima permintaan rakan anda.','chat',0,'2026-05-18 06:17:49.264'),(63,6,'Mesej Baharu','Siti Sarah: salam dr, untuk kursus kecerdasan buatan saya tak ada group lagi, semua dah full','chat',0,'2026-05-30 03:20:36.366'),(64,10,'Mesej Baharu','Dr. Maya Sofea: wasalam, kejap ya saya buat group lagi','chat',0,'2026-05-30 03:21:13.661'),(65,31,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(66,23,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(67,10,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(68,21,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(69,25,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(70,24,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(71,37,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(72,16,'Anda telah dikumpulkan','Pensyarah TTCS3023 telah meletakkan anda dalam kumpulan secara automatik.','groups',0,'2026-05-30 03:21:35.232'),(73,20,'Permintaan Rakan Baharu','Siti Sarah menghantar permintaan rakan kepada anda.','chat',0,'2026-05-30 03:40:51.363');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;

--
-- Table structure for table `private_messages`
--

DROP TABLE IF EXISTS `private_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `private_messages` (
  `fld_message_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_sender_id` int(11) NOT NULL,
  `fld_receiver_id` int(11) DEFAULT NULL,
  `fld_content` text NOT NULL,
  `fld_read` tinyint(1) NOT NULL DEFAULT 0,
  `fld_timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_chat_group_id` int(11) DEFAULT NULL,
  `fld_attachment_path` varchar(191) DEFAULT NULL,
  `fld_attachment_type` varchar(16) DEFAULT NULL,
  `fld_attachment_name` varchar(191) DEFAULT NULL,
  `fld_attachment_size` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`fld_message_id`),
  KEY `private_messages_fld_sender_id_idx` (`fld_sender_id`),
  KEY `private_messages_fld_receiver_id_idx` (`fld_receiver_id`),
  KEY `private_messages_fld_chat_group_id_idx` (`fld_chat_group_id`),
  CONSTRAINT `private_messages_fld_chat_group_id_fkey` FOREIGN KEY (`fld_chat_group_id`) REFERENCES `chat_groups` (`fld_chat_group_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `private_messages_fld_receiver_id_fkey` FOREIGN KEY (`fld_receiver_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `private_messages_fld_sender_id_fkey` FOREIGN KEY (`fld_sender_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `private_messages`
--

/*!40000 ALTER TABLE `private_messages` DISABLE KEYS */;
INSERT INTO `private_messages` VALUES (1,10,13,'Hai, awak buat tugasan TTTK3413 dah?',1,'2026-05-09 09:21:08.798',NULL,NULL,NULL,NULL,NULL),(2,32,10,'Boleh tolong saya semak laporan?',1,'2026-05-09 09:51:08.810',NULL,NULL,NULL,NULL,NULL),(3,10,37,'Jumpa di perpustakaan jam 3?',1,'2026-05-09 10:21:08.821',NULL,NULL,NULL,NULL,NULL),(4,12,10,'Terima kasih banyak!',1,'2026-05-09 10:51:08.854',NULL,NULL,NULL,NULL,NULL),(5,10,18,'Saya tak faham bahagian ni, awak ada masa?',1,'2026-05-09 11:21:08.865',NULL,NULL,NULL,NULL,NULL),(6,13,10,'Ok, saya hantar fail tu nanti.',1,'2026-05-09 11:51:08.877',NULL,NULL,NULL,NULL,NULL),(7,10,32,'Class esok dibatalkan.',1,'2026-05-09 12:21:08.889',NULL,NULL,NULL,NULL,NULL),(8,37,10,'Selamat hari raya!',1,'2026-05-09 12:51:08.901',NULL,NULL,NULL,NULL,NULL),(9,10,12,'Ada quiz minggu depan, jangan lupa.',1,'2026-05-09 13:21:08.912',NULL,NULL,NULL,NULL,NULL),(10,18,10,'Saya dah hantar tugasan kumpulan kita.',1,'2026-05-09 13:51:08.923',NULL,NULL,NULL,NULL,NULL),(11,10,13,'Hai, awak buat tugasan TTTK3413 dah?',1,'2026-05-09 14:21:08.934',NULL,NULL,NULL,NULL,NULL),(12,32,10,'Boleh tolong saya semak laporan?',1,'2026-05-09 14:51:08.944',NULL,NULL,NULL,NULL,NULL),(13,10,37,'Jumpa di perpustakaan jam 3?',1,'2026-05-09 15:21:08.955',NULL,NULL,NULL,NULL,NULL),(14,12,10,'Terima kasih banyak!',1,'2026-05-09 15:51:08.966',NULL,NULL,NULL,NULL,NULL),(15,10,18,'Saya tak faham bahagian ni, awak ada masa?',1,'2026-05-09 16:21:08.977',NULL,NULL,NULL,NULL,NULL),(16,13,10,'Ok, saya hantar fail tu nanti.',1,'2026-05-09 16:51:08.988',NULL,NULL,NULL,NULL,NULL),(17,10,32,'Class esok dibatalkan.',1,'2026-05-09 17:21:08.999',NULL,NULL,NULL,NULL,NULL),(18,37,10,'Selamat hari raya!',1,'2026-05-09 17:51:09.009',NULL,NULL,NULL,NULL,NULL),(19,10,12,'Ada quiz minggu depan, jangan lupa.',1,'2026-05-09 18:21:09.019',NULL,NULL,NULL,NULL,NULL),(20,18,10,'Saya dah hantar tugasan kumpulan kita.',1,'2026-05-09 18:51:09.029',NULL,NULL,NULL,NULL,NULL),(21,10,13,'Hai, awak buat tugasan TTTK3413 dah?',1,'2026-05-09 19:21:09.038',NULL,NULL,NULL,NULL,NULL),(22,32,10,'Boleh tolong saya semak laporan?',1,'2026-05-09 19:51:09.053',NULL,NULL,NULL,NULL,NULL),(23,10,37,'Jumpa di perpustakaan jam 3?',1,'2026-05-09 20:21:09.065',NULL,NULL,NULL,NULL,NULL),(24,12,10,'Terima kasih banyak!',1,'2026-05-09 20:51:09.076',NULL,NULL,NULL,NULL,NULL),(25,10,18,'Saya tak faham bahagian ni, awak ada masa?',1,'2026-05-09 21:21:09.087',NULL,NULL,NULL,NULL,NULL),(26,13,10,'Ok, saya hantar fail tu nanti.',1,'2026-05-09 21:51:09.099',NULL,NULL,NULL,NULL,NULL),(27,10,32,'Class esok dibatalkan.',1,'2026-05-09 22:21:09.109',NULL,NULL,NULL,NULL,NULL),(28,37,10,'Selamat hari raya!',1,'2026-05-09 22:51:09.118',NULL,NULL,NULL,NULL,NULL),(29,10,12,'Ada quiz minggu depan, jangan lupa.',1,'2026-05-09 23:21:09.129',NULL,NULL,NULL,NULL,NULL),(30,18,10,'Saya dah hantar tugasan kumpulan kita.',1,'2026-05-09 23:51:09.139',NULL,NULL,NULL,NULL,NULL),(31,10,13,'Hai, awak buat tugasan TTTK3413 dah?',1,'2026-05-10 00:21:09.149',NULL,NULL,NULL,NULL,NULL),(32,32,10,'Boleh tolong saya semak laporan?',1,'2026-05-10 00:51:09.161',NULL,NULL,NULL,NULL,NULL),(33,10,37,'Jumpa di perpustakaan jam 3?',1,'2026-05-10 01:21:09.173',NULL,NULL,NULL,NULL,NULL),(34,12,10,'Terima kasih banyak!',1,'2026-05-10 01:51:09.184',NULL,NULL,NULL,NULL,NULL),(35,10,18,'Saya tak faham bahagian ni, awak ada masa?',1,'2026-05-10 02:21:09.194',NULL,NULL,NULL,NULL,NULL),(36,13,10,'Ok, saya hantar fail tu nanti.',1,'2026-05-10 02:51:09.204',NULL,NULL,NULL,NULL,NULL),(37,10,32,'Class esok dibatalkan.',1,'2026-05-10 03:21:09.214',NULL,NULL,NULL,NULL,NULL),(38,37,10,'Selamat hari raya!',1,'2026-05-10 03:51:09.225',NULL,NULL,NULL,NULL,NULL),(39,10,12,'Ada quiz minggu depan, jangan lupa.',1,'2026-05-10 04:21:09.236',NULL,NULL,NULL,NULL,NULL),(40,18,10,'Saya dah hantar tugasan kumpulan kita.',1,'2026-05-10 04:51:09.247',NULL,NULL,NULL,NULL,NULL),(41,10,13,'Hai, awak buat tugasan TTTK3413 dah?',0,'2026-05-10 05:21:09.260',NULL,NULL,NULL,NULL,NULL),(42,32,10,'Boleh tolong saya semak laporan?',1,'2026-05-10 05:51:09.271',NULL,NULL,NULL,NULL,NULL),(43,10,37,'Jumpa di perpustakaan jam 3?',0,'2026-05-10 06:21:09.281',NULL,NULL,NULL,NULL,NULL),(44,12,10,'Terima kasih banyak!',1,'2026-05-10 06:51:09.291',NULL,NULL,NULL,NULL,NULL),(45,10,18,'Saya tak faham bahagian ni, awak ada masa?',0,'2026-05-10 07:21:09.301',NULL,NULL,NULL,NULL,NULL),(46,13,10,'Ok, saya hantar fail tu nanti.',1,'2026-05-10 07:51:09.313',NULL,NULL,NULL,NULL,NULL),(47,10,32,'Class esok dibatalkan.',0,'2026-05-10 08:21:09.330',NULL,NULL,NULL,NULL,NULL),(48,37,10,'Selamat hari raya!',1,'2026-05-10 08:51:09.342',NULL,NULL,NULL,NULL,NULL),(49,10,12,'Ada quiz minggu depan, jangan lupa.',0,'2026-05-10 09:21:09.354',NULL,NULL,NULL,NULL,NULL),(50,18,10,'Saya dah hantar tugasan kumpulan kita.',1,'2026-05-10 09:51:09.363',NULL,NULL,NULL,NULL,NULL),(51,10,2,'Assalamualaikum dr,',1,'2026-05-10 10:52:29.405',NULL,NULL,NULL,NULL,NULL),(52,10,NULL,'Salam dr',0,'2026-05-10 19:07:12.255',1,NULL,NULL,NULL,NULL),(53,2,NULL,'Wasalam sarah, awal nau awak bangun',0,'2026-05-10 19:07:28.138',1,NULL,NULL,NULL,NULL),(54,2,10,'Waalaiakumussalam',1,'2026-05-11 16:10:19.259',NULL,NULL,NULL,NULL,NULL),(55,10,2,'Dr sihat?, saya nak tanya tentang FYP boleh?',1,'2026-05-11 16:10:49.332',NULL,NULL,NULL,NULL,NULL),(56,10,NULL,'Assalamualaikum',0,'2026-05-11 16:11:37.850',2,NULL,NULL,NULL,NULL),(57,10,38,'Hello zaim',0,'2026-05-11 16:12:31.423',NULL,NULL,NULL,NULL,NULL),(58,3,NULL,'Assalamualaikum dr',0,'2026-05-11 16:13:53.779',3,NULL,NULL,NULL,NULL),(59,8,NULL,'Waalaiakumussalam',0,'2026-05-11 16:14:08.294',3,NULL,NULL,NULL,NULL),(60,10,NULL,'',0,'2026-05-15 12:17:05.194',2,'/uploads/chat/1778847425181-76882478f5ba.gif','image','giphy.gif','1.3 MB'),(61,10,6,'salam dr, untuk kursus kecerdasan buatan saya tak ada group lagi, semua dah full',1,'2026-05-30 03:20:36.347',NULL,NULL,NULL,NULL,NULL),(62,6,10,'wasalam, kejap ya saya buat group lagi',0,'2026-05-30 03:21:13.648',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `private_messages` ENABLE KEYS */;

--
-- Table structure for table `project_groups`
--

DROP TABLE IF EXISTS `project_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_groups` (
  `fld_group_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_course_id` int(11) NOT NULL,
  `fld_name_id` varchar(191) NOT NULL,
  `fld_max_members` int(11) NOT NULL DEFAULT 5,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_chat_group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`fld_group_id`),
  UNIQUE KEY `project_groups_fld_chat_group_id_key` (`fld_chat_group_id`),
  KEY `project_groups_fld_course_id_idx` (`fld_course_id`),
  CONSTRAINT `project_groups_fld_chat_group_id_fkey` FOREIGN KEY (`fld_chat_group_id`) REFERENCES `chat_groups` (`fld_chat_group_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `project_groups_fld_course_id_fkey` FOREIGN KEY (`fld_course_id`) REFERENCES `courses` (`fld_course_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_groups`
--

/*!40000 ALTER TABLE `project_groups` DISABLE KEYS */;
INSERT INTO `project_groups` VALUES (1,1,'Kumpulan Alpha (TTTK3000)',4,'2026-05-10 10:21:01.195',5),(2,1,'Kumpulan Beta (TTTK3000)',4,'2026-05-10 10:21:01.207',NULL),(3,1,'Kumpulan Gamma (TTTK3000)',5,'2026-05-10 10:21:01.233',NULL),(4,2,'Kumpulan Alpha (TTTK3413)',4,'2026-05-10 10:21:01.246',NULL),(5,2,'Kumpulan Beta (TTTK3413)',5,'2026-05-10 10:21:01.258',NULL),(6,2,'Kumpulan Gamma (TTTK3413)',4,'2026-05-10 10:21:01.271',NULL),(7,3,'Kumpulan Alpha (TTTK3813)',5,'2026-05-10 10:21:01.282',NULL),(8,3,'Kumpulan Beta (TTTK3813)',4,'2026-05-10 10:21:01.293',NULL),(9,3,'Kumpulan Gamma (TTTK3813)',5,'2026-05-10 10:21:01.305',NULL),(10,4,'Kumpulan Alpha (TTCS3064)',5,'2026-05-10 10:21:01.317',NULL),(11,4,'Kumpulan Beta (TTCS3064)',4,'2026-05-10 10:21:01.328',NULL),(12,4,'Kumpulan Gamma (TTCS3064)',5,'2026-05-10 10:21:01.340',NULL),(13,5,'Kumpulan Alpha (TTCS2043)',4,'2026-05-10 10:21:01.353',NULL),(14,5,'Kumpulan Beta (TTCS2043)',5,'2026-05-10 10:21:01.366',NULL),(15,5,'Kumpulan Gamma (TTCS2043)',5,'2026-05-10 10:21:01.379',NULL),(16,6,'Kumpulan Alpha (TTTK2113)',4,'2026-05-10 10:21:01.391',NULL),(17,6,'Kumpulan Beta (TTTK2113)',5,'2026-05-10 10:21:01.402',NULL),(18,6,'Kumpulan Gamma (TTTK2113)',5,'2026-05-10 10:21:01.414',NULL),(19,7,'Kumpulan Alpha (TTMK3133)',4,'2026-05-10 10:21:01.425',NULL),(20,7,'Kumpulan Beta (TTMK3133)',4,'2026-05-10 10:21:01.437',NULL),(21,7,'Kumpulan Gamma (TTMK3133)',4,'2026-05-10 10:21:01.450',NULL),(22,8,'Kumpulan Alpha (TTCS3023)',4,'2026-05-10 10:21:01.463',4),(23,8,'Kumpulan Beta (TTCS3023)',5,'2026-05-10 10:21:01.500',NULL),(24,8,'Kumpulan Gamma (TTCS3023)',5,'2026-05-10 10:21:01.512',NULL),(25,9,'Kumpulan Alpha (TTTK3163)',4,'2026-05-10 10:21:01.525',NULL),(26,9,'Kumpulan Beta (TTTK3163)',4,'2026-05-10 10:21:01.536',NULL),(27,9,'Kumpulan Gamma (TTTK3163)',5,'2026-05-10 10:21:01.553',NULL),(28,10,'Kumpulan Alpha (TTCS3043)',4,'2026-05-10 10:21:01.564',NULL),(29,10,'Kumpulan Beta (TTCS3043)',5,'2026-05-10 10:21:01.575',NULL),(30,10,'Kumpulan Gamma (TTCS3043)',5,'2026-05-10 10:21:01.588',NULL),(31,2,'Kumpulan Delta (TTTK3413)',5,'2026-05-17 03:47:00.536',NULL),(32,2,'Kumpulan Epsilon (TTTK3413)',5,'2026-05-17 03:47:00.550',NULL),(33,8,'Kumpulan Delta (TTCS3023)',5,'2026-05-30 03:21:35.182',NULL),(34,8,'Kumpulan Epsilon (TTCS3023)',5,'2026-05-30 03:21:35.194',NULL);
/*!40000 ALTER TABLE `project_groups` ENABLE KEYS */;

--
-- Table structure for table `recent_access`
--

DROP TABLE IF EXISTS `recent_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recent_access` (
  `fld_recent_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_user_id` int(11) NOT NULL,
  `fld_type` enum('COURSE','ASSIGNMENT','GROUP','CONTENT','SUBMISSION') NOT NULL,
  `fld_ref_id` int(11) DEFAULT NULL,
  `fld_title` varchar(191) NOT NULL,
  `fld_link` varchar(191) NOT NULL,
  `fld_accessed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`fld_recent_id`),
  UNIQUE KEY `uniq_user_type_ref` (`fld_user_id`,`fld_type`,`fld_ref_id`),
  KEY `recent_access_fld_user_id_fld_accessed_at_idx` (`fld_user_id`,`fld_accessed_at`),
  CONSTRAINT `recent_access_fld_user_id_fkey` FOREIGN KEY (`fld_user_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recent_access`
--

/*!40000 ALTER TABLE `recent_access` DISABLE KEYS */;
INSERT INTO `recent_access` VALUES (1,10,'COURSE',8,'TTCS3023 — Kecerdasan Buatan','/student/kursus/TTCS3023','2026-05-30 03:20:16.780'),(2,10,'ASSIGNMENT',11,'TTTK3813: Tugasan 3: TTTK3813','/student/tugasan/11','2026-05-15 03:58:03.255'),(3,10,'ASSIGNMENT',31,'TTCS3023: Tugasan 3: TTCS3023','/student/tugasan/31','2026-05-15 04:15:51.525'),(4,2,'COURSE',1,'TTTK3000 — Projek Tahun Akhir','/lecturer/kursus/TTTK3000','2026-05-15 04:23:02.691'),(5,40,'COURSE',2,'TTTK3413 — Pembangunan Aplikasi Web','/student/kursus/TTTK3413','2026-05-15 10:52:17.957'),(6,40,'COURSE',12,'TTMK3013 — Pembelajaran Mesin','/student/kursus/TTMK3013','2026-05-15 11:02:46.847'),(7,10,'COURSE',1,'TTTK3000 — Projek Tahun Akhir','/student/kursus/TTTK3000','2026-05-15 11:03:41.335');
/*!40000 ALTER TABLE `recent_access` ENABLE KEYS */;

--
-- Table structure for table `submission_feedback`
--

DROP TABLE IF EXISTS `submission_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `submission_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `submissionId` int(11) NOT NULL,
  `lecturerId` int(11) NOT NULL,
  `comment` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `submission_feedback_submissionId_fkey` (`submissionId`),
  KEY `submission_feedback_lecturerId_fkey` (`lecturerId`),
  CONSTRAINT `submission_feedback_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `users` (`fld_user_id`) ON UPDATE CASCADE,
  CONSTRAINT `submission_feedback_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `submissions` (`fld_submission_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submission_feedback`
--

/*!40000 ALTER TABLE `submission_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `submission_feedback` ENABLE KEYS */;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `submissions` (
  `fld_submission_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_assignment_id` int(11) NOT NULL,
  `fld_student_id` int(11) NOT NULL,
  `fld_file_path` varchar(191) DEFAULT NULL,
  `fld_grade` int(11) DEFAULT NULL,
  `fld_status` enum('PENDING','SUBMITTED','GRADED','LATE') NOT NULL DEFAULT 'PENDING',
  `fld_submitted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_submitted_by_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`fld_submission_id`),
  UNIQUE KEY `uniq_assignment_student` (`fld_assignment_id`,`fld_student_id`),
  KEY `submissions_fld_student_id_fkey` (`fld_student_id`),
  KEY `submissions_fld_submitted_by_id_idx` (`fld_submitted_by_id`),
  CONSTRAINT `submissions_fld_assignment_id_fkey` FOREIGN KEY (`fld_assignment_id`) REFERENCES `assignments` (`fld_assignment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `submissions_fld_student_id_fkey` FOREIGN KEY (`fld_student_id`) REFERENCES `users` (`fld_user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `submissions_fld_submitted_by_id_fkey` FOREIGN KEY (`fld_submitted_by_id`) REFERENCES `users` (`fld_user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=533 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
INSERT INTO `submissions` VALUES (1,1,29,'/uploads/sub-1-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.204',29),(2,1,34,'/uploads/sub-1-34.pdf',91,'GRADED','2026-05-10 10:21:03.219',34),(3,1,16,'/uploads/sub-1-16.pdf',NULL,'LATE','2026-05-10 10:21:03.235',16),(4,1,27,'/uploads/sub-1-27.pdf',NULL,'LATE','2026-05-10 10:21:03.264',27),(5,1,25,'/uploads/sub-1-25.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.274',25),(6,1,35,'/uploads/sub-1-35.pdf',NULL,'LATE','2026-05-10 10:21:03.284',35),(7,1,33,'/uploads/sub-1-33.pdf',88,'GRADED','2026-05-10 10:21:03.296',33),(8,1,10,'/uploads/sub-1-10.pdf',99,'GRADED','2026-05-10 10:21:03.307',10),(9,1,24,'/uploads/sub-1-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.320',24),(10,1,32,'/uploads/sub-1-32.pdf',98,'GRADED','2026-05-10 10:21:03.332',32),(11,2,29,'/uploads/sub-2-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.345',29),(12,2,16,'/uploads/sub-2-16.pdf',68,'GRADED','2026-05-10 10:21:03.356',16),(13,2,43,'/uploads/sub-2-43.pdf',NULL,'LATE','2026-05-10 10:21:03.368',43),(14,2,32,'/uploads/sub-2-32.pdf',NULL,'LATE','2026-05-10 10:21:03.380',32),(15,2,10,'/uploads/sub-2-10.pdf',85,'GRADED','2026-05-10 10:21:03.391',10),(16,2,27,'/uploads/sub-2-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.407',27),(17,2,33,'/uploads/sub-2-33.pdf',NULL,'LATE','2026-05-10 10:21:03.419',33),(18,2,31,'/uploads/sub-2-31.pdf',95,'GRADED','2026-05-10 10:21:03.431',31),(19,2,26,'/uploads/sub-2-26.pdf',60,'GRADED','2026-05-10 10:21:03.442',26),(20,2,24,'/uploads/sub-2-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.452',24),(21,3,30,'/uploads/sub-3-30.pdf',66,'GRADED','2026-05-10 10:21:03.463',30),(22,3,16,'/uploads/sub-3-16.pdf',88,'GRADED','2026-05-10 10:21:03.474',16),(23,3,43,'/uploads/sub-3-43.pdf',95,'GRADED','2026-05-10 10:21:03.487',43),(24,3,24,'/uploads/sub-3-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.499',24),(25,3,32,'/uploads/sub-3-32.pdf',NULL,'LATE','2026-05-10 10:21:03.519',32),(26,3,26,'/uploads/sub-3-26.pdf',96,'GRADED','2026-05-10 10:21:03.529',26),(27,3,33,'/uploads/sub-3-33.pdf',89,'GRADED','2026-05-10 10:21:03.540',33),(28,3,29,'/uploads/sub-3-29.pdf',NULL,'LATE','2026-05-10 10:21:03.551',29),(29,3,31,'/uploads/sub-3-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.579',31),(30,3,25,'/uploads/sub-3-25.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.600',25),(31,4,35,'/uploads/sub-4-35.pdf',NULL,'LATE','2026-05-10 10:21:03.614',35),(32,4,43,'/uploads/sub-4-43.pdf',95,'GRADED','2026-05-10 10:21:03.627',43),(33,4,25,'/uploads/sub-4-25.pdf',NULL,'LATE','2026-05-10 10:21:03.639',25),(34,4,31,'/uploads/sub-4-31.pdf',NULL,'LATE','2026-05-10 10:21:03.652',31),(35,4,24,'/uploads/sub-4-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.663',24),(36,4,16,'/uploads/sub-4-16.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.674',16),(37,4,27,'/uploads/sub-4-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.684',27),(38,4,29,'/uploads/sub-4-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.700',29),(39,4,30,'/uploads/sub-4-30.pdf',62,'GRADED','2026-05-10 10:21:03.712',30),(40,4,34,'/uploads/sub-4-34.pdf',73,'GRADED','2026-05-10 10:21:03.722',34),(41,5,12,'/uploads/sub-5-12.pdf',71,'GRADED','2026-05-10 10:21:03.735',12),(42,5,34,'/uploads/sub-5-34.pdf',NULL,'LATE','2026-05-10 10:21:03.747',34),(43,5,28,'/uploads/sub-5-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.757',28),(44,5,22,'/uploads/sub-5-22.pdf',84,'GRADED','2026-05-10 10:21:03.768',22),(45,5,11,'/uploads/sub-5-11.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.779',11),(46,5,37,'/uploads/sub-5-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.790',37),(47,5,43,'/uploads/sub-5-43.pdf',NULL,'LATE','2026-05-10 10:21:03.803',43),(48,5,21,'/uploads/sub-5-21.pdf',NULL,'LATE','2026-05-10 10:21:03.815',21),(49,5,10,'/uploads/sub-5-10.pdf',78,'GRADED','2026-05-10 10:21:03.827',10),(50,5,35,'/uploads/sub-5-35.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.839',35),(51,5,36,'/uploads/sub-5-36.pdf',80,'GRADED','2026-05-10 10:21:03.851',36),(52,5,18,'/uploads/sub-5-18.pdf',60,'GRADED','2026-05-10 10:21:03.863',18),(53,5,44,'/uploads/sub-5-44.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.874',44),(54,5,14,'/uploads/sub-5-14.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.885',14),(55,6,21,'/uploads/sub-6-21.pdf',NULL,'LATE','2026-05-10 10:21:03.898',21),(56,6,34,'/uploads/sub-6-34.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.910',34),(57,6,36,'/uploads/sub-6-36.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.922',36),(58,6,37,'/uploads/sub-6-37.pdf',NULL,'LATE','2026-05-10 10:21:03.935',37),(59,6,19,'/uploads/sub-6-19.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.946',19),(60,6,18,'/uploads/sub-6-18.pdf',NULL,'LATE','2026-05-10 10:21:03.957',18),(61,6,43,'/uploads/sub-6-43.pdf',NULL,'SUBMITTED','2026-05-10 10:21:03.968',43),(62,6,35,'/uploads/sub-6-35.pdf',98,'GRADED','2026-05-10 10:21:03.979',35),(63,6,44,'/uploads/sub-6-44.pdf',NULL,'LATE','2026-05-10 10:21:03.991',44),(64,6,29,'/uploads/sub-6-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.003',29),(65,6,14,'/uploads/sub-6-14.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.014',14),(66,6,12,'/uploads/sub-6-12.pdf',79,'GRADED','2026-05-10 10:21:04.027',12),(67,6,10,'/uploads/sub-6-10.pdf',96,'GRADED','2026-05-10 10:21:04.038',10),(68,6,22,'/uploads/sub-6-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.048',22),(69,7,19,'/uploads/sub-7-19.pdf',84,'GRADED','2026-05-10 10:21:04.060',19),(70,7,18,'/uploads/sub-7-18.pdf',NULL,'LATE','2026-05-10 10:21:04.071',18),(71,7,29,'/uploads/sub-7-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.083',29),(72,7,43,'/uploads/sub-7-43.pdf',85,'GRADED','2026-05-10 10:21:04.095',43),(73,7,11,'/uploads/sub-7-11.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.107',11),(74,7,12,'/uploads/sub-7-12.pdf',84,'GRADED','2026-05-10 10:21:04.119',12),(75,7,44,'/uploads/sub-7-44.pdf',NULL,'LATE','2026-05-10 10:21:04.130',44),(76,7,37,'/uploads/sub-7-37.pdf',75,'GRADED','2026-05-10 10:21:04.141',37),(77,7,45,'/uploads/sub-7-45.pdf',62,'GRADED','2026-05-10 10:21:04.152',45),(78,7,22,'/uploads/sub-7-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.163',22),(79,7,28,'/uploads/sub-7-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.175',28),(80,7,34,'/uploads/sub-7-34.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.186',34),(81,7,36,'/uploads/sub-7-36.pdf',84,'GRADED','2026-05-10 10:21:04.197',36),(82,7,21,'/uploads/sub-7-21.pdf',88,'GRADED','2026-05-10 10:21:04.209',21),(83,8,45,'/uploads/sub-8-45.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.221',45),(84,8,44,'/uploads/sub-8-44.pdf',84,'GRADED','2026-05-10 10:21:04.231',44),(85,8,14,'/uploads/sub-8-14.pdf',92,'GRADED','2026-05-10 10:21:04.247',14),(86,8,21,'/uploads/sub-8-21.pdf',NULL,'LATE','2026-05-10 10:21:04.258',21),(87,8,22,'/uploads/sub-8-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.270',22),(88,8,34,'/uploads/sub-8-34.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.282',34),(89,8,18,'/uploads/sub-8-18.pdf',84,'GRADED','2026-05-10 10:21:04.294',18),(90,8,19,'/uploads/sub-8-19.pdf',87,'GRADED','2026-05-10 10:21:04.308',19),(91,8,12,'/uploads/sub-8-12.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.318',12),(92,8,28,'/uploads/sub-8-28.pdf',61,'GRADED','2026-05-10 10:21:04.329',28),(93,8,11,'/uploads/sub-8-11.pdf',84,'GRADED','2026-05-10 10:21:04.341',11),(94,8,17,'/uploads/sub-8-17.pdf',94,'GRADED','2026-05-10 10:21:04.353',17),(95,8,43,'/uploads/sub-8-43.pdf',NULL,'LATE','2026-05-10 10:21:04.365',43),(96,8,36,'/uploads/sub-8-36.pdf',67,'GRADED','2026-05-10 10:21:04.377',36),(97,9,36,'/uploads/sub-9-36.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.390',36),(98,9,41,'/uploads/sub-9-41.pdf',NULL,'LATE','2026-05-10 10:21:04.402',41),(99,9,16,'/uploads/sub-9-16.pdf',83,'GRADED','2026-05-10 10:21:04.413',16),(100,9,24,'/uploads/sub-9-24.pdf',81,'GRADED','2026-05-10 10:21:04.425',24),(101,9,44,'/uploads/sub-9-44.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.436',44),(102,9,26,'/uploads/sub-9-26.pdf',NULL,'LATE','2026-05-10 10:21:04.447',26),(103,9,43,'/uploads/sub-9-43.pdf',81,'GRADED','2026-05-10 10:21:04.464',43),(104,10,36,'/uploads/sub-10-36.pdf',77,'GRADED','2026-05-10 10:21:04.479',36),(105,10,37,'/uploads/sub-10-37.pdf',62,'GRADED','2026-05-10 10:21:04.492',37),(106,10,44,'/uploads/sub-10-44.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.505',44),(107,10,43,'/uploads/sub-10-43.pdf',86,'GRADED','2026-05-10 10:21:04.516',43),(108,10,16,'/uploads/sub-10-16.pdf',65,'GRADED','2026-05-10 10:21:04.547',16),(109,10,26,'/uploads/sub-10-26.pdf',74,'GRADED','2026-05-10 10:21:04.559',26),(110,10,41,'/uploads/sub-10-41.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.571',41),(111,11,26,'/uploads/sub-11-26.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.584',26),(112,11,35,'/uploads/sub-11-35.pdf',61,'GRADED','2026-05-10 10:21:04.595',35),(113,11,10,'/uploads/sub-11-10.pdf',NULL,'LATE','2026-05-10 10:21:04.679',10),(114,11,16,'/uploads/sub-11-16.pdf',NULL,'LATE','2026-05-10 10:21:04.693',16),(115,11,43,'/uploads/sub-11-43.pdf',77,'GRADED','2026-05-10 10:21:04.705',43),(116,11,41,'/uploads/sub-11-41.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.716',41),(117,11,37,'/uploads/sub-11-37.pdf',81,'GRADED','2026-05-10 10:21:04.728',37),(118,12,36,'/uploads/sub-12-36.pdf',NULL,'LATE','2026-05-10 10:21:04.741',36),(119,12,44,'/uploads/sub-12-44.pdf',97,'GRADED','2026-05-10 10:21:04.752',44),(120,12,10,'/uploads/sub-12-10.pdf',65,'GRADED','2026-05-10 10:21:04.763',10),(121,12,35,'/uploads/sub-12-35.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.774',35),(122,12,24,'/uploads/sub-12-24.pdf',NULL,'LATE','2026-05-10 10:21:04.787',24),(123,12,41,'/uploads/sub-12-41.pdf',86,'GRADED','2026-05-10 10:21:04.798',41),(124,12,26,'/uploads/sub-12-26.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.810',26),(125,13,38,'/uploads/sub-13-38.pdf',85,'GRADED','2026-05-10 10:21:04.823',38),(126,13,43,'/uploads/sub-13-43.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.833',43),(127,13,21,'/uploads/sub-13-21.pdf',64,'GRADED','2026-05-10 10:21:04.848',21),(128,13,31,'/uploads/sub-13-31.pdf',NULL,'LATE','2026-05-10 10:21:04.859',31),(129,13,29,'/uploads/sub-13-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.871',29),(130,13,20,'/uploads/sub-13-20.pdf',NULL,'LATE','2026-05-10 10:21:04.883',20),(131,13,33,'/uploads/sub-13-33.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.895',33),(132,14,33,'/uploads/sub-14-33.pdf',80,'GRADED','2026-05-10 10:21:04.909',33),(133,14,20,'/uploads/sub-14-20.pdf',80,'GRADED','2026-05-10 10:21:04.921',20),(134,14,31,'/uploads/sub-14-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.931',31),(135,14,43,'/uploads/sub-14-43.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.943',43),(136,14,21,'/uploads/sub-14-21.pdf',69,'GRADED','2026-05-10 10:21:04.954',21),(137,14,13,'/uploads/sub-14-13.pdf',62,'GRADED','2026-05-10 10:21:04.966',13),(138,14,29,'/uploads/sub-14-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:04.978',29),(139,15,31,'/uploads/sub-15-31.pdf',78,'GRADED','2026-05-10 10:21:04.991',31),(140,15,33,'/uploads/sub-15-33.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.004',33),(141,15,26,'/uploads/sub-15-26.pdf',NULL,'LATE','2026-05-10 10:21:05.014',26),(142,15,29,'/uploads/sub-15-29.pdf',83,'GRADED','2026-05-10 10:21:05.026',29),(143,15,43,'/uploads/sub-15-43.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.037',43),(144,15,21,'/uploads/sub-15-21.pdf',NULL,'LATE','2026-05-10 10:21:05.048',21),(145,15,38,'/uploads/sub-15-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.060',38),(146,16,38,'/uploads/sub-16-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.073',38),(147,16,31,'/uploads/sub-16-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.084',31),(148,16,26,'/uploads/sub-16-26.pdf',93,'GRADED','2026-05-10 10:21:05.097',26),(149,16,43,'/uploads/sub-16-43.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.107',43),(150,16,33,'/uploads/sub-16-33.pdf',97,'GRADED','2026-05-10 10:21:05.118',33),(151,16,20,'/uploads/sub-16-20.pdf',79,'GRADED','2026-05-10 10:21:05.130',20),(152,16,29,'/uploads/sub-16-29.pdf',NULL,'LATE','2026-05-10 10:21:05.140',29),(153,17,34,'/uploads/sub-17-34.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.153',34),(154,17,28,'/uploads/sub-17-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.165',28),(155,17,17,'/uploads/sub-17-17.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.177',17),(156,17,19,'/uploads/sub-17-19.pdf',NULL,'LATE','2026-05-10 10:21:05.188',19),(157,17,32,'/uploads/sub-17-32.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.198',32),(158,17,14,'/uploads/sub-17-14.pdf',83,'GRADED','2026-05-10 10:21:05.209',14),(159,17,13,'/uploads/sub-17-13.pdf',90,'GRADED','2026-05-10 10:21:05.221',13),(160,17,26,'/uploads/sub-17-26.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.232',26),(161,18,14,'/uploads/sub-18-14.pdf',97,'GRADED','2026-05-10 10:21:05.244',14),(162,18,28,'/uploads/sub-18-28.pdf',75,'GRADED','2026-05-10 10:21:05.255',28),(163,18,17,'/uploads/sub-18-17.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.267',17),(164,18,34,'/uploads/sub-18-34.pdf',93,'GRADED','2026-05-10 10:21:05.279',34),(165,18,19,'/uploads/sub-18-19.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.289',19),(166,18,24,'/uploads/sub-18-24.pdf',77,'GRADED','2026-05-10 10:21:05.300',24),(167,18,36,'/uploads/sub-18-36.pdf',NULL,'LATE','2026-05-10 10:21:05.310',36),(168,18,30,'/uploads/sub-18-30.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.321',30),(169,19,30,'/uploads/sub-19-30.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.334',30),(170,19,13,'/uploads/sub-19-13.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.350',13),(171,19,24,'/uploads/sub-19-24.pdf',NULL,'LATE','2026-05-10 10:21:05.363',24),(172,19,14,'/uploads/sub-19-14.pdf',71,'GRADED','2026-05-10 10:21:05.375',14),(173,19,34,'/uploads/sub-19-34.pdf',NULL,'LATE','2026-05-10 10:21:05.386',34),(174,19,28,'/uploads/sub-19-28.pdf',NULL,'LATE','2026-05-10 10:21:05.397',28),(175,19,17,'/uploads/sub-19-17.pdf',90,'GRADED','2026-05-10 10:21:05.407',17),(176,19,32,'/uploads/sub-19-32.pdf',81,'GRADED','2026-05-10 10:21:05.417',32),(177,20,34,'/uploads/sub-20-34.pdf',NULL,'LATE','2026-05-10 10:21:05.431',34),(178,20,26,'/uploads/sub-20-26.pdf',67,'GRADED','2026-05-10 10:21:05.442',26),(179,20,13,'/uploads/sub-20-13.pdf',78,'GRADED','2026-05-10 10:21:05.455',13),(180,20,32,'/uploads/sub-20-32.pdf',65,'GRADED','2026-05-10 10:21:05.468',32),(181,20,30,'/uploads/sub-20-30.pdf',99,'GRADED','2026-05-10 10:21:05.479',30),(182,20,28,'/uploads/sub-20-28.pdf',NULL,'LATE','2026-05-10 10:21:05.490',28),(183,20,36,'/uploads/sub-20-36.pdf',80,'GRADED','2026-05-10 10:21:05.500',36),(184,20,14,'/uploads/sub-20-14.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.510',14),(185,21,21,'/uploads/sub-21-21.pdf',NULL,'LATE','2026-05-10 10:21:05.523',21),(186,21,41,'/uploads/sub-21-41.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.534',41),(187,21,23,'/uploads/sub-21-23.pdf',62,'GRADED','2026-05-10 10:21:05.545',23),(188,21,14,'/uploads/sub-21-14.pdf',NULL,'LATE','2026-05-10 10:21:05.562',14),(189,21,18,'/uploads/sub-21-18.pdf',80,'GRADED','2026-05-10 10:21:05.580',18),(190,21,44,'/uploads/sub-21-44.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.591',44),(191,21,12,'/uploads/sub-21-12.pdf',79,'GRADED','2026-05-10 10:21:05.603',12),(192,22,41,'/uploads/sub-22-41.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.616',41),(193,22,31,'/uploads/sub-22-31.pdf',89,'GRADED','2026-05-10 10:21:05.628',31),(194,22,14,'/uploads/sub-22-14.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.640',14),(195,22,20,'/uploads/sub-22-20.pdf',NULL,'LATE','2026-05-10 10:21:05.653',20),(196,22,21,'/uploads/sub-22-21.pdf',73,'GRADED','2026-05-10 10:21:05.664',21),(197,22,12,'/uploads/sub-22-12.pdf',93,'GRADED','2026-05-10 10:21:05.674',12),(198,22,18,'/uploads/sub-22-18.pdf',68,'GRADED','2026-05-10 10:21:05.686',18),(199,23,20,'/uploads/sub-23-20.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.699',20),(200,23,12,'/uploads/sub-23-12.pdf',NULL,'LATE','2026-05-10 10:21:05.711',12),(201,23,44,'/uploads/sub-23-44.pdf',NULL,'LATE','2026-05-10 10:21:05.723',44),(202,23,35,'/uploads/sub-23-35.pdf',NULL,'LATE','2026-05-10 10:21:05.733',35),(203,23,23,'/uploads/sub-23-23.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.745',23),(204,23,31,'/uploads/sub-23-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.756',31),(205,23,21,'/uploads/sub-23-21.pdf',65,'GRADED','2026-05-10 10:21:05.766',21),(206,24,23,'/uploads/sub-24-23.pdf',NULL,'LATE','2026-05-10 10:21:05.780',23),(207,24,14,'/uploads/sub-24-14.pdf',NULL,'LATE','2026-05-10 10:21:05.791',14),(208,24,20,'/uploads/sub-24-20.pdf',94,'GRADED','2026-05-10 10:21:05.803',20),(209,24,35,'/uploads/sub-24-35.pdf',NULL,'LATE','2026-05-10 10:21:05.815',35),(210,24,18,'/uploads/sub-24-18.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.826',18),(211,24,21,'/uploads/sub-24-21.pdf',95,'GRADED','2026-05-10 10:21:05.838',21),(212,24,31,'/uploads/sub-24-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.848',31),(213,25,33,'/uploads/sub-25-33.pdf',NULL,'LATE','2026-05-10 10:21:05.860',33),(214,25,40,'/uploads/sub-25-40.pdf',68,'GRADED','2026-05-10 10:21:05.872',40),(215,25,14,'/uploads/sub-25-14.pdf',99,'GRADED','2026-05-10 10:21:05.884',14),(216,25,13,'/uploads/sub-25-13.pdf',90,'GRADED','2026-05-10 10:21:05.895',13),(217,25,27,'/uploads/sub-25-27.pdf',70,'GRADED','2026-05-10 10:21:05.907',27),(218,25,11,'/uploads/sub-25-11.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.917',11),(219,25,45,'/uploads/sub-25-45.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.927',45),(220,25,15,'/uploads/sub-25-15.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.938',15),(221,26,13,'/uploads/sub-26-13.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.950',13),(222,26,14,'/uploads/sub-26-14.pdf',NULL,'LATE','2026-05-10 10:21:05.962',14),(223,26,15,'/uploads/sub-26-15.pdf',NULL,'LATE','2026-05-10 10:21:05.973',15),(224,26,27,'/uploads/sub-26-27.pdf',78,'GRADED','2026-05-10 10:21:05.985',27),(225,26,45,'/uploads/sub-26-45.pdf',NULL,'SUBMITTED','2026-05-10 10:21:05.997',45),(226,26,33,'/uploads/sub-26-33.pdf',NULL,'LATE','2026-05-10 10:21:06.008',33),(227,26,36,'/uploads/sub-26-36.pdf',64,'GRADED','2026-05-10 10:21:06.018',36),(228,26,11,'/uploads/sub-26-11.pdf',97,'GRADED','2026-05-10 10:21:06.029',11),(229,27,27,'/uploads/sub-27-27.pdf',98,'GRADED','2026-05-10 10:21:06.041',27),(230,27,12,'/uploads/sub-27-12.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.052',12),(231,27,45,'/uploads/sub-27-45.pdf',NULL,'LATE','2026-05-10 10:21:06.064',45),(232,27,36,'/uploads/sub-27-36.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.075',36),(233,27,11,'/uploads/sub-27-11.pdf',92,'GRADED','2026-05-10 10:21:06.087',11),(234,27,33,'/uploads/sub-27-33.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.097',33),(235,27,14,'/uploads/sub-27-14.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.107',14),(236,27,15,'/uploads/sub-27-15.pdf',NULL,'LATE','2026-05-10 10:21:06.118',15),(237,28,15,'/uploads/sub-28-15.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.130',15),(238,28,42,'/uploads/sub-28-42.pdf',NULL,'LATE','2026-05-10 10:21:06.142',42),(239,28,45,'/uploads/sub-28-45.pdf',NULL,'LATE','2026-05-10 10:21:06.155',45),(240,28,27,'/uploads/sub-28-27.pdf',NULL,'LATE','2026-05-10 10:21:06.166',27),(241,28,14,'/uploads/sub-28-14.pdf',97,'GRADED','2026-05-10 10:21:06.179',14),(242,28,40,'/uploads/sub-28-40.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.189',40),(243,28,11,'/uploads/sub-28-11.pdf',63,'GRADED','2026-05-10 10:21:06.200',11),(244,28,12,'/uploads/sub-28-12.pdf',NULL,'LATE','2026-05-10 10:21:06.211',12),(245,29,22,'/uploads/sub-29-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.224',22),(246,29,24,'/uploads/sub-29-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.235',24),(247,29,21,'/uploads/sub-29-21.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.248',21),(248,29,31,'/uploads/sub-29-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.261',31),(249,29,10,'/uploads/sub-29-10.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.271',10),(250,29,32,'/uploads/sub-29-32.pdf',64,'GRADED','2026-05-10 10:21:06.282',32),(251,29,38,'/uploads/sub-29-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.293',38),(252,29,15,'/uploads/sub-29-15.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.304',15),(253,29,28,'/uploads/sub-29-28.pdf',82,'GRADED','2026-05-10 10:21:06.316',28),(254,29,39,'/uploads/sub-29-39.pdf',84,'GRADED','2026-05-10 10:21:06.328',39),(255,29,16,'/uploads/sub-29-16.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.339',16),(256,29,45,'/uploads/sub-29-45.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.350',45),(257,30,10,'/uploads/sub-30-10.pdf',93,'GRADED','2026-05-10 10:21:06.362',10),(258,30,39,'/uploads/sub-30-39.pdf',NULL,'LATE','2026-05-10 10:21:06.372',39),(259,30,22,'/uploads/sub-30-22.pdf',77,'GRADED','2026-05-10 10:21:06.383',22),(260,30,28,'/uploads/sub-30-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.393',28),(261,30,23,'/uploads/sub-30-23.pdf',100,'GRADED','2026-05-10 10:21:06.405',23),(262,30,15,'/uploads/sub-30-15.pdf',90,'GRADED','2026-05-10 10:21:06.417',15),(263,30,25,'/uploads/sub-30-25.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.429',25),(264,30,37,'/uploads/sub-30-37.pdf',91,'GRADED','2026-05-10 10:21:06.441',37),(265,30,31,'/uploads/sub-30-31.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.452',31),(266,30,21,'/uploads/sub-30-21.pdf',92,'GRADED','2026-05-10 10:21:06.463',21),(267,30,38,'/uploads/sub-30-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.474',38),(268,30,32,'/uploads/sub-30-32.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.485',32),(269,31,24,'/uploads/sub-31-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.497',24),(270,31,15,'/uploads/sub-31-15.pdf',NULL,'LATE','2026-05-10 10:21:06.509',15),(271,31,23,'/uploads/sub-31-23.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.521',23),(272,31,22,'/uploads/sub-31-22.pdf',79,'GRADED','2026-05-10 10:21:06.533',22),(273,31,28,'/uploads/sub-31-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.544',28),(274,31,32,'/uploads/sub-31-32.pdf',75,'GRADED','2026-05-10 10:21:06.554',32),(275,31,20,'/uploads/sub-31-20.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.566',20),(276,31,10,'/uploads/sub-31-10.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.576',10),(277,31,16,'/uploads/sub-31-16.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.594',16),(278,31,25,'/uploads/sub-31-25.pdf',76,'GRADED','2026-05-10 10:21:06.607',25),(279,31,38,'/uploads/sub-31-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.618',38),(280,31,37,'/uploads/sub-31-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.629',37),(281,32,20,'/uploads/sub-32-20.pdf',NULL,'LATE','2026-05-10 10:21:06.640',20),(282,32,25,'/uploads/sub-32-25.pdf',NULL,'LATE','2026-05-10 10:21:06.651',25),(283,32,24,'/uploads/sub-32-24.pdf',70,'GRADED','2026-05-10 10:21:06.664',24),(284,32,32,'/uploads/sub-32-32.pdf',NULL,'LATE','2026-05-10 10:21:06.677',32),(285,32,10,'/uploads/sub-32-10.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.693',10),(286,32,21,'/uploads/sub-32-21.pdf',94,'GRADED','2026-05-10 10:21:06.707',21),(287,32,39,'/uploads/sub-32-39.pdf',80,'GRADED','2026-05-10 10:21:06.722',39),(288,32,28,'/uploads/sub-32-28.pdf',82,'GRADED','2026-05-10 10:21:06.734',28),(289,32,37,'/uploads/sub-32-37.pdf',NULL,'LATE','2026-05-10 10:21:06.746',37),(290,32,38,'/uploads/sub-32-38.pdf',NULL,'LATE','2026-05-10 10:21:06.756',38),(291,32,23,'/uploads/sub-32-23.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.767',23),(292,32,15,'/uploads/sub-32-15.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.778',15),(293,33,26,'/uploads/sub-33-26.pdf',68,'GRADED','2026-05-10 10:21:06.790',26),(294,33,28,'/uploads/sub-33-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.802',28),(295,33,21,'/uploads/sub-33-21.pdf',72,'GRADED','2026-05-10 10:21:06.814',21),(296,33,23,'/uploads/sub-33-23.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.825',23),(297,33,22,'/uploads/sub-33-22.pdf',NULL,'LATE','2026-05-10 10:21:06.837',22),(298,33,36,'/uploads/sub-33-36.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.848',36),(299,33,25,'/uploads/sub-33-25.pdf',NULL,'LATE','2026-05-10 10:21:06.859',25),(300,33,29,'/uploads/sub-33-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.870',29),(301,34,32,'/uploads/sub-34-32.pdf',78,'GRADED','2026-05-10 10:21:06.882',32),(302,34,29,'/uploads/sub-34-29.pdf',72,'GRADED','2026-05-10 10:21:06.893',29),(303,34,26,'/uploads/sub-34-26.pdf',NULL,'LATE','2026-05-10 10:21:06.909',26),(304,34,23,'/uploads/sub-34-23.pdf',NULL,'LATE','2026-05-10 10:21:06.921',23),(305,34,21,'/uploads/sub-34-21.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.934',21),(306,34,27,'/uploads/sub-34-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.943',27),(307,34,42,'/uploads/sub-34-42.pdf',61,'GRADED','2026-05-10 10:21:06.955',42),(308,34,22,'/uploads/sub-34-22.pdf',NULL,'LATE','2026-05-10 10:21:06.965',22),(309,35,21,'/uploads/sub-35-21.pdf',88,'GRADED','2026-05-10 10:21:06.977',21),(310,35,23,'/uploads/sub-35-23.pdf',NULL,'SUBMITTED','2026-05-10 10:21:06.989',23),(311,35,26,'/uploads/sub-35-26.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.001',26),(312,35,22,'/uploads/sub-35-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.014',22),(313,35,28,'/uploads/sub-35-28.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.026',28),(314,35,42,'/uploads/sub-35-42.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.035',42),(315,35,27,'/uploads/sub-35-27.pdf',NULL,'LATE','2026-05-10 10:21:07.045',27),(316,35,25,'/uploads/sub-35-25.pdf',96,'GRADED','2026-05-10 10:21:07.056',25),(317,36,26,'/uploads/sub-36-26.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.069',26),(318,36,27,'/uploads/sub-36-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.080',27),(319,36,36,'/uploads/sub-36-36.pdf',NULL,'LATE','2026-05-10 10:21:07.092',36),(320,36,23,'/uploads/sub-36-23.pdf',NULL,'LATE','2026-05-10 10:21:07.104',23),(321,36,42,'/uploads/sub-36-42.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.116',42),(322,36,21,'/uploads/sub-36-21.pdf',95,'GRADED','2026-05-10 10:21:07.127',21),(323,36,32,'/uploads/sub-36-32.pdf',77,'GRADED','2026-05-10 10:21:07.137',32),(324,36,29,'/uploads/sub-36-29.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.148',29),(325,37,22,'/uploads/sub-37-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.160',22),(326,37,37,'/uploads/sub-37-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.171',37),(327,37,11,'/uploads/sub-37-11.pdf',NULL,'LATE','2026-05-10 10:21:07.182',11),(328,37,27,'/uploads/sub-37-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.195',27),(329,37,15,'/uploads/sub-37-15.pdf',NULL,'LATE','2026-05-10 10:21:07.206',15),(330,37,17,'/uploads/sub-37-17.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.218',17),(331,37,30,'/uploads/sub-37-30.pdf',87,'GRADED','2026-05-10 10:21:07.229',30),(332,38,27,'/uploads/sub-38-27.pdf',95,'GRADED','2026-05-10 10:21:07.240',27),(333,38,15,'/uploads/sub-38-15.pdf',75,'GRADED','2026-05-10 10:21:07.251',15),(334,38,22,'/uploads/sub-38-22.pdf',100,'GRADED','2026-05-10 10:21:07.264',22),(335,38,34,'/uploads/sub-38-34.pdf',95,'GRADED','2026-05-10 10:21:07.276',34),(336,38,30,'/uploads/sub-38-30.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.288',30),(337,38,37,'/uploads/sub-38-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.300',37),(338,38,17,'/uploads/sub-38-17.pdf',61,'GRADED','2026-05-10 10:21:07.311',17),(339,39,27,'/uploads/sub-39-27.pdf',87,'GRADED','2026-05-10 10:21:07.323',27),(340,39,22,'/uploads/sub-39-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.334',22),(341,39,37,'/uploads/sub-39-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.345',37),(342,39,13,'/uploads/sub-39-13.pdf',68,'GRADED','2026-05-10 10:21:07.357',13),(343,39,15,'/uploads/sub-39-15.pdf',89,'GRADED','2026-05-10 10:21:07.371',15),(344,39,34,'/uploads/sub-39-34.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.383',34),(345,39,11,'/uploads/sub-39-11.pdf',NULL,'LATE','2026-05-10 10:21:07.395',11),(346,40,15,'/uploads/sub-40-15.pdf',61,'GRADED','2026-05-10 10:21:07.407',15),(347,40,34,'/uploads/sub-40-34.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.417',34),(348,40,22,'/uploads/sub-40-22.pdf',81,'GRADED','2026-05-10 10:21:07.427',22),(349,40,17,'/uploads/sub-40-17.pdf',NULL,'LATE','2026-05-10 10:21:07.438',17),(350,40,11,'/uploads/sub-40-11.pdf',NULL,'LATE','2026-05-10 10:21:07.451',11),(351,40,13,'/uploads/sub-40-13.pdf',86,'GRADED','2026-05-10 10:21:07.463',13),(352,40,37,'/uploads/sub-40-37.pdf',79,'GRADED','2026-05-10 10:21:07.474',37),(353,41,12,'/uploads/sub-41-12.pdf',NULL,'LATE','2026-05-10 10:21:07.487',12),(354,41,41,'/uploads/sub-41-41.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.497',41),(355,41,27,'/uploads/sub-41-27.pdf',NULL,'LATE','2026-05-10 10:21:07.508',27),(356,41,22,'/uploads/sub-41-22.pdf',86,'GRADED','2026-05-10 10:21:07.519',22),(357,41,35,'/uploads/sub-41-35.pdf',72,'GRADED','2026-05-10 10:21:07.530',35),(358,41,25,'/uploads/sub-41-25.pdf',NULL,'LATE','2026-05-10 10:21:07.543',25),(359,41,38,'/uploads/sub-41-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.560',38),(360,41,45,'/uploads/sub-41-45.pdf',68,'GRADED','2026-05-10 10:21:07.573',45),(361,41,39,'/uploads/sub-41-39.pdf',96,'GRADED','2026-05-10 10:21:07.583',39),(362,41,18,'/uploads/sub-41-18.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.595',18),(363,42,20,'/uploads/sub-42-20.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.613',20),(364,42,22,'/uploads/sub-42-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.625',22),(365,42,18,'/uploads/sub-42-18.pdf',71,'GRADED','2026-05-10 10:21:07.637',18),(366,42,39,'/uploads/sub-42-39.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.649',39),(367,42,14,'/uploads/sub-42-14.pdf',83,'GRADED','2026-05-10 10:21:07.660',14),(368,42,41,'/uploads/sub-42-41.pdf',62,'GRADED','2026-05-10 10:21:07.670',41),(369,42,35,'/uploads/sub-42-35.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.681',35),(370,42,12,'/uploads/sub-42-12.pdf',NULL,'LATE','2026-05-10 10:21:07.692',12),(371,42,27,'/uploads/sub-42-27.pdf',98,'GRADED','2026-05-10 10:21:07.703',27),(372,42,38,'/uploads/sub-42-38.pdf',63,'GRADED','2026-05-10 10:21:07.724',38),(373,43,22,'/uploads/sub-43-22.pdf',98,'GRADED','2026-05-10 10:21:07.762',22),(374,43,20,'/uploads/sub-43-20.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.773',20),(375,43,12,'/uploads/sub-43-12.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.786',12),(376,43,18,'/uploads/sub-43-18.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.797',18),(377,43,45,'/uploads/sub-43-45.pdf',80,'GRADED','2026-05-10 10:21:07.808',45),(378,43,16,'/uploads/sub-43-16.pdf',NULL,'LATE','2026-05-10 10:21:07.820',16),(379,43,25,'/uploads/sub-43-25.pdf',66,'GRADED','2026-05-10 10:21:07.831',25),(380,43,41,'/uploads/sub-43-41.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.843',41),(381,43,27,'/uploads/sub-43-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.855',27),(382,43,14,'/uploads/sub-43-14.pdf',90,'GRADED','2026-05-10 10:21:07.868',14),(383,44,20,'/uploads/sub-44-20.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.882',20),(384,44,14,'/uploads/sub-44-14.pdf',NULL,'LATE','2026-05-10 10:21:07.893',14),(385,44,22,'/uploads/sub-44-22.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.904',22),(386,44,35,'/uploads/sub-44-35.pdf',NULL,'LATE','2026-05-10 10:21:07.915',35),(387,44,45,'/uploads/sub-44-45.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.926',45),(388,44,12,'/uploads/sub-44-12.pdf',99,'GRADED','2026-05-10 10:21:07.937',12),(389,44,27,'/uploads/sub-44-27.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.948',27),(390,44,41,'/uploads/sub-44-41.pdf',76,'GRADED','2026-05-10 10:21:07.961',41),(391,44,18,'/uploads/sub-44-18.pdf',64,'GRADED','2026-05-10 10:21:07.972',18),(392,44,25,'/uploads/sub-44-25.pdf',69,'GRADED','2026-05-10 10:21:07.983',25),(393,45,19,'/uploads/sub-45-19.pdf',NULL,'SUBMITTED','2026-05-10 10:21:07.995',19),(394,45,18,'/uploads/sub-45-18.pdf',97,'GRADED','2026-05-10 10:21:08.006',18),(395,45,42,'/uploads/sub-45-42.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.018',42),(396,45,38,'/uploads/sub-45-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.031',38),(397,45,16,'/uploads/sub-45-16.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.045',16),(398,45,39,'/uploads/sub-45-39.pdf',NULL,'LATE','2026-05-10 10:21:08.059',39),(399,45,25,'/uploads/sub-45-25.pdf',NULL,'LATE','2026-05-10 10:21:08.073',25),(400,45,37,'/uploads/sub-45-37.pdf',76,'GRADED','2026-05-10 10:21:08.083',37),(401,46,24,'/uploads/sub-46-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.095',24),(402,46,37,'/uploads/sub-46-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.106',37),(403,46,39,'/uploads/sub-46-39.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.117',39),(404,46,32,'/uploads/sub-46-32.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.130',32),(405,46,40,'/uploads/sub-46-40.pdf',93,'GRADED','2026-05-10 10:21:08.142',40),(406,46,38,'/uploads/sub-46-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.155',38),(407,46,25,'/uploads/sub-46-25.pdf',64,'GRADED','2026-05-10 10:21:08.168',25),(408,46,42,'/uploads/sub-46-42.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.179',42),(409,47,32,'/uploads/sub-47-32.pdf',64,'GRADED','2026-05-10 10:21:08.191',32),(410,47,42,'/uploads/sub-47-42.pdf',75,'GRADED','2026-05-10 10:21:08.203',42),(411,47,18,'/uploads/sub-47-18.pdf',NULL,'LATE','2026-05-10 10:21:08.214',18),(412,47,38,'/uploads/sub-47-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.226',38),(413,47,39,'/uploads/sub-47-39.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.239',39),(414,47,19,'/uploads/sub-47-19.pdf',NULL,'LATE','2026-05-10 10:21:08.251',19),(415,47,40,'/uploads/sub-47-40.pdf',80,'GRADED','2026-05-10 10:21:08.264',40),(416,47,24,'/uploads/sub-47-24.pdf',75,'GRADED','2026-05-10 10:21:08.275',24),(417,48,32,'/uploads/sub-48-32.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.288',32),(418,48,25,'/uploads/sub-48-25.pdf',NULL,'LATE','2026-05-10 10:21:08.299',25),(419,48,19,'/uploads/sub-48-19.pdf',74,'GRADED','2026-05-10 10:21:08.310',19),(420,48,18,'/uploads/sub-48-18.pdf',68,'GRADED','2026-05-10 10:21:08.322',18),(421,48,39,'/uploads/sub-48-39.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.334',39),(422,48,24,'/uploads/sub-48-24.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.346',24),(423,48,37,'/uploads/sub-48-37.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.359',37),(424,48,38,'/uploads/sub-48-38.pdf',NULL,'SUBMITTED','2026-05-10 10:21:08.370',38),(425,1,26,'/uploads/sub-1-26.pdf',74,'GRADED','2026-05-15 11:36:42.731',NULL),(426,1,43,'/uploads/sub-1-43.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.758',NULL),(427,1,31,'/uploads/sub-1-31.pdf',84,'GRADED','2026-05-15 11:36:42.770',NULL),(428,2,34,'/uploads/sub-2-34.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.785',NULL),(429,2,30,'/uploads/sub-2-30.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.804',NULL),(430,2,25,'/uploads/sub-2-25.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.814',NULL),(431,3,34,'/uploads/sub-3-34.pdf',NULL,'LATE','2026-05-15 11:36:42.827',NULL),(432,3,35,'/uploads/sub-3-35.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.837',NULL),(433,3,27,'/uploads/sub-3-27.pdf',NULL,'LATE','2026-05-15 11:36:42.859',NULL),(434,4,33,'/uploads/sub-4-33.pdf',NULL,'LATE','2026-05-15 11:36:42.872',NULL),(435,4,10,'/uploads/sub-4-10.pdf',91,'GRADED','2026-05-15 11:36:42.888',NULL),(436,4,26,'/uploads/sub-4-26.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.902',NULL),(437,5,45,'/uploads/sub-5-45.pdf',68,'GRADED','2026-05-15 11:36:42.922',NULL),(438,5,19,'/uploads/sub-5-19.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.938',NULL),(439,5,29,'/uploads/sub-5-29.pdf',60,'GRADED','2026-05-15 11:36:42.952',NULL),(440,6,17,'/uploads/sub-6-17.pdf',89,'GRADED','2026-05-15 11:36:42.973',NULL),(441,6,28,'/uploads/sub-6-28.pdf',NULL,'SUBMITTED','2026-05-15 11:36:42.985',NULL),(442,6,11,'/uploads/sub-6-11.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.000',NULL),(443,6,40,'/uploads/sub-6-40.pdf',69,'GRADED','2026-05-15 11:36:43.011',NULL),(444,7,40,'/uploads/sub-7-40.pdf',84,'GRADED','2026-05-15 11:36:43.036',NULL),(445,7,10,'/uploads/sub-7-10.pdf',66,'GRADED','2026-05-15 11:36:43.048',NULL),(446,7,14,'/uploads/sub-7-14.pdf',71,'GRADED','2026-05-15 11:36:43.059',NULL),(447,8,40,'/uploads/sub-8-40.pdf',92,'GRADED','2026-05-15 11:36:43.080',NULL),(448,8,29,'/uploads/sub-8-29.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.097',NULL),(449,8,10,'/uploads/sub-8-10.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.123',NULL),(450,8,35,'/uploads/sub-8-35.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.136',NULL),(451,9,35,'/uploads/sub-9-35.pdf',96,'GRADED','2026-05-15 11:36:43.152',NULL),(452,10,24,'/uploads/sub-10-24.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.188',NULL),(453,10,35,'/uploads/sub-10-35.pdf',84,'GRADED','2026-05-15 11:36:43.199',NULL),(454,11,36,'/uploads/sub-11-36.pdf',NULL,'LATE','2026-05-15 11:36:43.215',NULL),(455,11,24,'/uploads/sub-11-24.pdf',76,'GRADED','2026-05-15 11:36:43.231',NULL),(456,13,26,'/uploads/sub-13-26.pdf',94,'GRADED','2026-05-15 11:36:43.264',NULL),(457,13,13,'/uploads/sub-13-13.pdf',67,'GRADED','2026-05-15 11:36:43.276',NULL),(458,14,38,'/uploads/sub-14-38.pdf',85,'GRADED','2026-05-15 11:36:43.300',NULL),(459,15,13,'/uploads/sub-15-13.pdf',63,'GRADED','2026-05-15 11:36:43.325',NULL),(460,15,20,'/uploads/sub-15-20.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.334',NULL),(461,16,13,'/uploads/sub-16-13.pdf',81,'GRADED','2026-05-15 11:36:43.353',NULL),(462,17,36,'/uploads/sub-17-36.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.372',NULL),(463,18,26,'/uploads/sub-18-26.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.394',NULL),(464,18,13,'/uploads/sub-18-13.pdf',98,'GRADED','2026-05-15 11:36:43.405',NULL),(465,19,26,'/uploads/sub-19-26.pdf',88,'GRADED','2026-05-15 11:36:43.424',NULL),(466,19,19,'/uploads/sub-19-19.pdf',83,'GRADED','2026-05-15 11:36:43.434',NULL),(467,20,19,'/uploads/sub-20-19.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.458',NULL),(468,20,24,'/uploads/sub-20-24.pdf',97,'GRADED','2026-05-15 11:36:43.473',NULL),(469,21,31,'/uploads/sub-21-31.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.490',NULL),(470,21,20,'/uploads/sub-21-20.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.503',NULL),(471,21,35,'/uploads/sub-21-35.pdf',NULL,'LATE','2026-05-15 11:36:43.514',NULL),(472,22,35,'/uploads/sub-22-35.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.531',NULL),(473,22,44,'/uploads/sub-22-44.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.548',NULL),(474,23,41,'/uploads/sub-23-41.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.579',NULL),(475,23,14,'/uploads/sub-23-14.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.590',NULL),(476,23,18,'/uploads/sub-23-18.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.607',NULL),(477,24,41,'/uploads/sub-24-41.pdf',81,'GRADED','2026-05-15 11:36:43.620',NULL),(478,24,44,'/uploads/sub-24-44.pdf',NULL,'LATE','2026-05-15 11:36:43.633',NULL),(479,25,12,'/uploads/sub-25-12.pdf',NULL,'LATE','2026-05-15 11:36:43.660',NULL),(480,26,42,'/uploads/sub-26-42.pdf',79,'GRADED','2026-05-15 11:36:43.674',NULL),(481,26,12,'/uploads/sub-26-12.pdf',75,'GRADED','2026-05-15 11:36:43.689',NULL),(482,27,40,'/uploads/sub-27-40.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.709',NULL),(483,27,42,'/uploads/sub-27-42.pdf',NULL,'LATE','2026-05-15 11:36:43.729',NULL),(484,28,13,'/uploads/sub-28-13.pdf',NULL,'LATE','2026-05-15 11:36:43.749',NULL),(485,28,33,'/uploads/sub-28-33.pdf',94,'GRADED','2026-05-15 11:36:43.760',NULL),(486,29,20,'/uploads/sub-29-20.pdf',NULL,'LATE','2026-05-15 11:36:43.774',NULL),(487,29,37,'/uploads/sub-29-37.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.793',NULL),(488,29,23,'/uploads/sub-29-23.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.803',NULL),(489,30,24,'/uploads/sub-30-24.pdf',97,'GRADED','2026-05-15 11:36:43.826',NULL),(490,30,20,'/uploads/sub-30-20.pdf',NULL,'LATE','2026-05-15 11:36:43.839',NULL),(491,30,45,'/uploads/sub-30-45.pdf',83,'GRADED','2026-05-15 11:36:43.854',NULL),(492,31,45,'/uploads/sub-31-45.pdf',NULL,'LATE','2026-05-15 11:36:43.878',NULL),(493,31,39,'/uploads/sub-31-39.pdf',63,'GRADED','2026-05-15 11:36:43.892',NULL),(494,31,21,'/uploads/sub-31-21.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.904',NULL),(495,32,16,'/uploads/sub-32-16.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.930',NULL),(496,32,22,'/uploads/sub-32-22.pdf',74,'GRADED','2026-05-15 11:36:43.944',NULL),(497,32,31,'/uploads/sub-32-31.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.955',NULL),(498,33,27,'/uploads/sub-33-27.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.974',NULL),(499,33,32,'/uploads/sub-33-32.pdf',91,'GRADED','2026-05-15 11:36:43.985',NULL),(500,33,42,'/uploads/sub-33-42.pdf',NULL,'SUBMITTED','2026-05-15 11:36:43.995',NULL),(501,34,25,'/uploads/sub-34-25.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.017',NULL),(502,35,29,'/uploads/sub-35-29.pdf',NULL,'LATE','2026-05-15 11:36:44.042',NULL),(503,35,32,'/uploads/sub-35-32.pdf',82,'GRADED','2026-05-15 11:36:44.055',NULL),(504,36,28,'/uploads/sub-36-28.pdf',NULL,'LATE','2026-05-15 11:36:44.072',NULL),(505,36,25,'/uploads/sub-36-25.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.088',NULL),(506,37,13,'/uploads/sub-37-13.pdf',72,'GRADED','2026-05-15 11:36:44.105',NULL),(507,37,34,'/uploads/sub-37-34.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.115',NULL),(508,38,13,'/uploads/sub-38-13.pdf',NULL,'LATE','2026-05-15 11:36:44.149',NULL),(509,38,11,'/uploads/sub-38-11.pdf',NULL,'LATE','2026-05-15 11:36:44.225',NULL),(510,39,30,'/uploads/sub-39-30.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.239',NULL),(511,39,17,'/uploads/sub-39-17.pdf',88,'GRADED','2026-05-15 11:36:44.256',NULL),(512,40,30,'/uploads/sub-40-30.pdf',NULL,'LATE','2026-05-15 11:36:44.277',NULL),(513,41,16,'/uploads/sub-41-16.pdf',97,'GRADED','2026-05-15 11:36:44.289',NULL),(514,41,20,'/uploads/sub-41-20.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.300',NULL),(515,41,14,'/uploads/sub-41-14.pdf',68,'GRADED','2026-05-15 11:36:44.314',NULL),(516,42,16,'/uploads/sub-42-16.pdf',95,'GRADED','2026-05-15 11:36:44.338',NULL),(517,42,25,'/uploads/sub-42-25.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.347',NULL),(518,42,45,'/uploads/sub-42-45.pdf',NULL,'LATE','2026-05-15 11:36:44.362',NULL),(519,43,35,'/uploads/sub-43-35.pdf',NULL,'LATE','2026-05-15 11:36:44.382',NULL),(520,43,38,'/uploads/sub-43-38.pdf',77,'GRADED','2026-05-15 11:36:44.393',NULL),(521,44,16,'/uploads/sub-44-16.pdf',86,'GRADED','2026-05-15 11:36:44.425',NULL),(522,44,39,'/uploads/sub-44-39.pdf',NULL,'LATE','2026-05-15 11:36:44.438',NULL),(523,45,32,'/uploads/sub-45-32.pdf',65,'GRADED','2026-05-15 11:36:44.454',NULL),(524,45,24,'/uploads/sub-45-24.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.466',NULL),(525,46,16,'/uploads/sub-46-16.pdf',NULL,'LATE','2026-05-15 11:36:44.481',NULL),(526,46,18,'/uploads/sub-46-18.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.498',NULL),(527,47,37,'/uploads/sub-47-37.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.522',NULL),(528,47,16,'/uploads/sub-47-16.pdf',90,'GRADED','2026-05-15 11:36:44.535',NULL),(529,47,25,'/uploads/sub-47-25.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.549',NULL),(530,48,42,'/uploads/sub-48-42.pdf',NULL,'SUBMITTED','2026-05-15 11:36:44.567',NULL),(531,48,16,'/uploads/sub-48-16.pdf',NULL,'LATE','2026-05-15 11:36:44.578',NULL),(532,48,40,'/uploads/sub-48-40.pdf',99,'GRADED','2026-05-15 11:36:44.591',NULL);
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `fld_user_id` int(11) NOT NULL AUTO_INCREMENT,
  `fld_name` varchar(191) NOT NULL,
  `fld_email` varchar(191) DEFAULT NULL,
  `fld_password` varchar(191) NOT NULL,
  `fld_role` enum('STUDENT','LECTURER','ADMIN') NOT NULL,
  `fld_matric_num` varchar(191) DEFAULT NULL,
  `fld_faculty` varchar(191) DEFAULT 'FTSM',
  `fld_is_active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fld_avatar_path` varchar(191) DEFAULT NULL,
  `fld_program` varchar(191) DEFAULT NULL,
  `fld_bio` text DEFAULT NULL,
  `fld_phone` varchar(32) DEFAULT NULL,
  `fld_last_seen_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`fld_user_id`),
  UNIQUE KEY `users_fld_email_key` (`fld_email`),
  UNIQUE KEY `users_fld_matric_num_key` (`fld_matric_num`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'System Admin','admin@ukm.edu.my','$2a$12$iFNJkJgKDZmaomhU3cDKPuQgaAUeZj9Uh.dnoeAK8WY6t9zP.4Jyy','ADMIN','admin','FTSM',1,'2026-05-10 10:20:57.707',NULL,NULL,NULL,NULL,NULL),(2,'Dr. Azman Abdullah','azman@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K012345','FTSM',1,'2026-05-10 10:20:57.743','/uploads/avatars/u2-1778843001935-2c96ab60.jpg',NULL,NULL,'0125681916','2026-06-04 03:59:41.477'),(3,'Dr. Faridah Mohd Saman','faridah@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K234567','FTSM',1,'2026-05-10 10:20:57.762',NULL,NULL,NULL,NULL,NULL),(4,'Dr. Farid Hassan','farid.hassan@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K345678','FTSM',1,'2026-05-10 10:20:57.780',NULL,NULL,NULL,NULL,NULL),(5,'Pn. Nurul Huda','nurul.huda@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K456789','FTSM',1,'2026-05-10 10:20:57.792',NULL,NULL,NULL,NULL,NULL),(6,'Dr. Maya Sofea','maya.sofea@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K567890','FTSM',1,'2026-05-10 10:20:57.805',NULL,NULL,NULL,NULL,NULL),(7,'En. Azlan Rahman','azlan.rahman@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K678901','FTSM',1,'2026-05-10 10:20:57.816',NULL,NULL,NULL,NULL,NULL),(8,'Dr. Liyana Ismail','liyana.ismail@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K789012','FTSM',1,'2026-05-10 10:20:57.828',NULL,NULL,NULL,NULL,NULL),(9,'Dr. Hisham Othman','hisham.othman@ukm.edu.my','$2a$12$WIh1EeziuGYUvTj/E3Z6XuYMPFeCvs5fNapJQwFPCRwZxLUxXTjSG','LECTURER','K890123','FTSM',1,'2026-05-10 10:20:57.839',NULL,NULL,NULL,NULL,NULL),(10,'Siti Sarah','a201762@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A201762','FTSM',1,'2026-05-10 10:20:57.850',NULL,'Sains Komputer',NULL,NULL,NULL),(11,'Aiman Hakimi','a221001@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221001','FTSM',1,'2026-05-10 10:20:57.861',NULL,'Sains Komputer',NULL,NULL,NULL),(12,'Nur Alya','a221002@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221002','FTSM',1,'2026-05-10 10:20:57.872',NULL,'Sains Komputer',NULL,NULL,NULL),(13,'Danish Iqbal','a221003@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221003','FTSM',1,'2026-05-10 10:20:57.884',NULL,'Sains Komputer',NULL,NULL,NULL),(14,'Siti Maisarah','a221004@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221004','FTSM',1,'2026-05-10 10:20:57.896',NULL,'Sains Komputer',NULL,NULL,NULL),(15,'Farhan Zikri','a221005@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221005','FTSM',1,'2026-05-10 10:20:57.907',NULL,'Sains Komputer',NULL,NULL,NULL),(16,'Nurin Batrisya','a221006@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221006','FTSM',1,'2026-05-10 10:20:57.920',NULL,'Sains Komputer',NULL,NULL,NULL),(17,'Adam Rayyan','a221007@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221007','FTSM',1,'2026-05-10 10:20:57.931',NULL,'Sains Komputer',NULL,NULL,NULL),(18,'Sofia Iman','a221008@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221008','FTSM',1,'2026-05-10 10:20:57.941',NULL,'Sains Komputer',NULL,NULL,NULL),(19,'Wong Wei Ming','a221009@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221009','FTSM',1,'2026-05-10 10:20:57.952',NULL,'Sains Komputer',NULL,NULL,NULL),(20,'Ahmad Faiz','a221010@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221010','FTSM',1,'2026-05-10 10:20:57.963',NULL,'Sains Komputer',NULL,NULL,NULL),(21,'Amirah Zulkifli','a221011@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221011','FTSM',1,'2026-05-10 10:20:57.975',NULL,'Sains Komputer',NULL,NULL,NULL),(22,'Razif Mohd Noor','a221012@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221012','FTSM',1,'2026-05-10 10:20:57.986',NULL,'Sains Komputer',NULL,NULL,NULL),(23,'Hafiz Hakim','a221013@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221013','FTSM',1,'2026-05-10 10:20:57.998',NULL,'Sains Komputer',NULL,NULL,NULL),(24,'Nurul Aisyah','a221014@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221014','FTSM',1,'2026-05-10 10:20:58.009',NULL,'Sains Komputer',NULL,NULL,NULL),(25,'Iman Aqil','a221015@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221015','FTSM',1,'2026-05-10 10:20:58.020',NULL,'Sains Komputer',NULL,NULL,NULL),(26,'Lisa Tan','a221016@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221016','FTSM',1,'2026-05-10 10:20:58.030',NULL,'Sains Komputer',NULL,NULL,NULL),(27,'Priya Devi','a221017@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221017','FTSM',1,'2026-05-10 10:20:58.041',NULL,'Sains Komputer',NULL,NULL,NULL),(28,'Ravinder Singh','a221018@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221018','FTSM',1,'2026-05-10 10:20:58.052',NULL,'Sains Komputer',NULL,NULL,NULL),(29,'Muhammad Hakim','a221019@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221019','FTSM',1,'2026-05-10 10:20:58.064',NULL,'Sains Komputer',NULL,NULL,NULL),(30,'Nor Liyana','a221020@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221020','FTSM',1,'2026-05-10 10:20:58.076',NULL,'Sains Komputer',NULL,NULL,NULL),(31,'Daniel Lim','a221021@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221021','FTSM',1,'2026-05-10 10:20:58.088',NULL,'Sains Komputer',NULL,NULL,NULL),(32,'Aaron Tan','a221022@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221022','FTSM',1,'2026-05-10 10:20:58.100',NULL,'Sains Komputer',NULL,NULL,NULL),(33,'Khairul Anwar','a221023@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221023','FTSM',1,'2026-05-10 10:20:58.110',NULL,'Sains Komputer',NULL,NULL,NULL),(34,'Aminah Yusof','a221024@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221024','FTSM',1,'2026-05-10 10:20:58.122',NULL,'Sains Komputer',NULL,NULL,NULL),(35,'Rohaizad Salleh','a221025@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221025','FTSM',1,'2026-05-10 10:20:58.132',NULL,'Sains Komputer',NULL,NULL,NULL),(36,'Tasya Rahman','a221026@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221026','FTSM',1,'2026-05-10 10:20:58.144',NULL,'Sains Komputer',NULL,NULL,NULL),(37,'Yusuf Ismail','a221027@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221027','FTSM',1,'2026-05-10 10:20:58.156',NULL,'Sains Komputer',NULL,NULL,NULL),(38,'Zaim Iskandar','a221028@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221028','FTSM',1,'2026-05-10 10:20:58.168',NULL,'Sains Komputer',NULL,NULL,NULL),(39,'Lim Wei Jie','a221029@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221029','FTSM',1,'2026-05-10 10:20:58.180',NULL,'Sains Komputer',NULL,NULL,NULL),(40,'Tan Mei Ling','a221030@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221030','FTSM',1,'2026-05-10 10:20:58.192',NULL,'Sains Komputer',NULL,NULL,NULL),(41,'Suresh Kumar','a221031@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221031','FTSM',1,'2026-05-10 10:20:58.204',NULL,'Sains Komputer',NULL,NULL,NULL),(42,'Kamala Devi','a221032@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221032','FTSM',1,'2026-05-10 10:20:58.216',NULL,'Sains Komputer',NULL,NULL,NULL),(43,'Faridah Yusop','a221033@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221033','FTSM',1,'2026-05-10 10:20:58.231',NULL,'Sains Komputer',NULL,NULL,NULL),(44,'Iskandar Zulkarnain','a221034@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221034','FTSM',1,'2026-05-10 10:20:58.241',NULL,'Sains Komputer',NULL,NULL,NULL),(45,'Hakimi Idris','a221035@siswa.ukm.edu.my','$2a$12$Bg7LM9zakC80j/rCx8d2EOcZ6BLp0LnpMVIpzSR8zGz545AlrVV6K','STUDENT','A221035','FTSM',1,'2026-05-10 10:20:58.253',NULL,'Sains Komputer',NULL,NULL,NULL),(46,'Aisyah Najwa Rahmat','a230001@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230001','FKAB',1,'2026-05-15 11:36:41.020',NULL,'Kejuruteraan Awam','Cinta concrete & coffee.',NULL,NULL),(47,'Iqbal Hakim Rosli','a230002@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230002','FKAB',1,'2026-05-15 11:36:41.032',NULL,'Kejuruteraan Awam','Tahun 2 — sedang sayang AutoCAD.',NULL,NULL),(48,'Tan Kar Mun','a230003@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230003','FKAB',1,'2026-05-15 11:36:41.063',NULL,'Kejuruteraan Awam','Pelajar Civil yang suka outdoor.',NULL,NULL),(49,'Nur Hidayah Suhaimi','a230004@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230004','FKAB',1,'2026-05-15 11:36:41.076',NULL,'Kejuruteraan Awam','Cinta concrete & coffee.',NULL,NULL),(50,'Arvinder Singh','a230005@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230005','FKAB',1,'2026-05-15 11:36:41.088',NULL,'Kejuruteraan Awam','Tahun 2 — sedang sayang AutoCAD.',NULL,NULL),(51,'Hafiz Danial Zulkifli','a230101@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230101','FKAB',1,'2026-05-15 11:36:41.101',NULL,'Kejuruteraan Elektrik','Volt out loud ⚡',NULL,NULL),(52,'Lim Jia Hao','a230102@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230102','FKAB',1,'2026-05-15 11:36:41.160',NULL,'Kejuruteraan Elektrik','Antara litar & solder, ada saya.',NULL,NULL),(53,'Nurin Damia Azhar','a230103@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230103','FKAB',1,'2026-05-15 11:36:41.174',NULL,'Kejuruteraan Elektrik','Power systems > everything.',NULL,NULL),(54,'Muhammad Daniel Faiz','a230104@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230104','FKAB',1,'2026-05-15 11:36:41.187',NULL,'Kejuruteraan Elektrik','Volt out loud ⚡',NULL,NULL),(55,'Sharvin Raj','a230105@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230105','FKAB',1,'2026-05-15 11:36:41.200',NULL,'Kejuruteraan Elektrik','Antara litar & solder, ada saya.',NULL,NULL),(56,'Nur Qaisara Aiman','a230201@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230201','FSSK',1,'2026-05-15 11:36:41.212',NULL,'Psikologi','Self-care is research.',NULL,NULL),(57,'Adam Mikhail Suhaimi','a230202@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230202','FSSK',1,'2026-05-15 11:36:41.225',NULL,'Psikologi','Belajar mind, satu pengalaman pada satu masa.',NULL,NULL),(58,'Chong Wei Xin','a230203@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230203','FSSK',1,'2026-05-15 11:36:41.239',NULL,'Psikologi','INFJ. Cuba bertenang.',NULL,NULL),(59,'Farah Adriana Roslan','a230204@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230204','FSSK',1,'2026-05-15 11:36:41.252',NULL,'Psikologi','Self-care is research.',NULL,NULL),(60,'Iman Syafiqah Aziz','a230205@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230205','FSSK',1,'2026-05-15 11:36:41.265',NULL,'Psikologi','Belajar mind, satu pengalaman pada satu masa.',NULL,NULL),(61,'Danish Hakimi Rahman','a230301@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230301','FSSK',1,'2026-05-15 11:36:41.278',NULL,'MASSCOMM','Future broadcaster.',NULL,NULL),(62,'Tasha Maisarah Idris','a230302@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230302','FSSK',1,'2026-05-15 11:36:41.288',NULL,'MASSCOMM','Cerita orang lain, gaya kita.',NULL,NULL),(63,'Lee Wei Sheng','a230303@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230303','FSSK',1,'2026-05-15 11:36:41.301',NULL,'MASSCOMM','Mic check 1, 2.',NULL,NULL),(64,'Nadhirah Khairina Yusof','a230304@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230304','FSSK',1,'2026-05-15 11:36:41.313',NULL,'MASSCOMM','Future broadcaster.',NULL,NULL),(65,'Khairul Imran Hassan','a230305@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230305','FSSK',1,'2026-05-15 11:36:41.326',NULL,'MASSCOMM','Cerita orang lain, gaya kita.',NULL,NULL),(66,'Nur Liyana Marissa','a230401@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230401','FST',1,'2026-05-15 11:36:41.338',NULL,'Sains Laut','Saltwater in my veins.',NULL,NULL),(67,'Brandon Tan Chee Kit','a230402@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230402','FST',1,'2026-05-15 11:36:41.351',NULL,'Sains Laut','Coral over everything.',NULL,NULL),(68,'Aiman Haziq Salleh','a230403@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230403','FST',1,'2026-05-15 11:36:41.364',NULL,'Sains Laut','Marine bio nerd, weekend kayaker.',NULL,NULL),(69,'Priya Maheswari','a230404@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230404','FST',1,'2026-05-15 11:36:41.377',NULL,'Sains Laut','Saltwater in my veins.',NULL,NULL),(70,'Zaim Aniq Razali','a230405@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230405','FST',1,'2026-05-15 11:36:41.390',NULL,'Sains Laut','Coral over everything.',NULL,NULL),(71,'Aleeya Sofea Hakim','a230501@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230501','FST',1,'2026-05-15 11:36:41.408',NULL,'Sains Persekitaran','For a greener UKM.',NULL,NULL),(72,'Ravi Kumaran','a230502@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230502','FST',1,'2026-05-15 11:36:41.421',NULL,'Sains Persekitaran','Climate first, slides later.',NULL,NULL),(73,'Wong Jia Yi','a230503@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230503','FST',1,'2026-05-15 11:36:41.434',NULL,'Sains Persekitaran','Recycle, reuse, repost.',NULL,NULL),(74,'Muhammad Aqil Iskandar','a230504@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230504','FST',1,'2026-05-15 11:36:41.447',NULL,'Sains Persekitaran','For a greener UKM.',NULL,NULL),(75,'Nur Alesya Damia','a230505@siswa.ukm.edu.my','$2a$12$xFKakTwtPquUjQIl85zE1OyZQmzhOkHtigSFpRPeUhM0etvYewqtK','STUDENT','A230505','FST',1,'2026-05-15 11:36:41.459',NULL,'Sains Persekitaran','Climate first, slides later.',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 13:44:58
