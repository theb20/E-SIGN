-- ============================================================
--  E-SIGN — Migration v2 (Railway MySQL 9.4)
--  Basée sur les colonnes existantes — sûr à relancer
-- ============================================================

-- users table
CREATE TABLE IF NOT EXISTS `users` (
  `id`           VARCHAR(128) NOT NULL,
  `email`        VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL DEFAULT '',
  `photo_url`    VARCHAR(500) NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- documents: new columns
ALTER TABLE `documents`
  ADD COLUMN `user_id`       VARCHAR(128) NULL AFTER `id`,
  ADD COLUMN `file_hash`     VARCHAR(64)  NULL AFTER `message`,
  ADD COLUMN `signing_order` ENUM('parallel','sequential') NOT NULL DEFAULT 'parallel' AFTER `file_hash`,
  ADD COLUMN `expires_at`    DATETIME NULL AFTER `signing_order`;

-- documents: extend enums
ALTER TABLE `documents`
  MODIFY COLUMN `status`    ENUM('draft','pending','completed','cancelled','expired') NOT NULL DEFAULT 'draft',
  MODIFY COLUMN `file_type` ENUM('pdf','image','docx','odt') NOT NULL DEFAULT 'pdf';

-- recipients: new columns
ALTER TABLE `recipients`
  ADD COLUMN `signing_order`    INT          NOT NULL DEFAULT 0 AFTER `signing_token`,
  ADD COLUMN `refuse_reason`    TEXT NULL AFTER `status`,
  ADD COLUMN `reminder_sent_at` DATETIME NULL AFTER `email_sent`,
  ADD COLUMN `refused_at`       DATETIME NULL AFTER `completed_at`;

-- recipients: extend status enum
ALTER TABLE `recipients`
  MODIFY COLUMN `status` ENUM('pending','completed','refused') NOT NULL DEFAULT 'pending';

-- fields: new columns
ALTER TABLE `fields`
  ADD COLUMN `recipient_id` VARCHAR(36) NULL AFTER `document_id`,
  ADD COLUMN `options`      JSON NULL AFTER `label`;

-- fields: extend type enum
ALTER TABLE `fields`
  MODIFY COLUMN `type` ENUM('signature','initials','text','date','checkbox','dropdown') NOT NULL;

-- signatures: extend type enum
ALTER TABLE `signatures`
  MODIFY COLUMN `type` ENUM('draw','type','upload','text','checkbox','dropdown') NOT NULL;

-- audit_logs: new column
ALTER TABLE `audit_logs`
  ADD COLUMN `user_agent` VARCHAR(512) NULL AFTER `ip`;

-- audit_logs: extend event enum
ALTER TABLE `audit_logs`
  MODIFY COLUMN `event` ENUM('created','sent','viewed','field_signed','completed',
                             'document_completed','refused','cancelled','reminder_sent',
                             'expired') NOT NULL;

-- templates table
CREATE TABLE IF NOT EXISTS `templates` (
  `id`          VARCHAR(36)  NOT NULL,
  `user_id`     VARCHAR(128) NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT         NULL,
  `fields`      JSON         NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
