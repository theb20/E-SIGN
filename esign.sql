-- ============================================================
--  E-SIGN — Schéma MySQL complet v2
--  Import : mysql -h HOST -P PORT -u USER -p DB < esign.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `esign`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `esign`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `signatures`;
DROP TABLE IF EXISTS `fields`;
DROP TABLE IF EXISTS `recipients`;
DROP TABLE IF EXISTS `documents`;
DROP TABLE IF EXISTS `templates`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
--  users  (Firebase UID → profil local)
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id`           VARCHAR(128) NOT NULL,   -- Firebase UID
  `email`        VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(255) NOT NULL DEFAULT '',
  `photo_url`    VARCHAR(500) NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  documents
-- ------------------------------------------------------------
CREATE TABLE `documents` (
  `id`            VARCHAR(36)  NOT NULL,
  `user_id`       VARCHAR(128) NULL,
  `title`         VARCHAR(255) NOT NULL DEFAULT 'Sans titre',
  `file_name`     VARCHAR(255) NOT NULL,
  `file_path`     VARCHAR(500) NOT NULL,
  `file_type`     ENUM('pdf','image','docx','odt') NOT NULL DEFAULT 'pdf',
  `status`        ENUM('draft','pending','completed','cancelled','expired') NOT NULL DEFAULT 'draft',
  `sender_name`   VARCHAR(255) NOT NULL DEFAULT '',
  `sender_email`  VARCHAR(255) NOT NULL DEFAULT '',
  `message`       TEXT,
  `file_hash`     VARCHAR(64)  NULL,
  `signing_order` ENUM('parallel','sequential') NOT NULL DEFAULT 'parallel',
  `expires_at`    DATETIME NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at`  DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_doc_user` (`user_id`),
  CONSTRAINT `fk_doc_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  recipients
-- ------------------------------------------------------------
CREATE TABLE `recipients` (
  `id`             VARCHAR(36)  NOT NULL,
  `document_id`    VARCHAR(36)  NOT NULL,
  `name`           VARCHAR(255) NOT NULL DEFAULT '',
  `email`          VARCHAR(255) NOT NULL,
  `signing_token`  VARCHAR(64)  NOT NULL UNIQUE,
  `signing_order`  INT          NOT NULL DEFAULT 0,
  `status`         ENUM('pending','completed','refused') NOT NULL DEFAULT 'pending',
  `refuse_reason`  TEXT NULL,
  `email_sent`     TINYINT(1)   NOT NULL DEFAULT 0,
  `reminder_sent_at` DATETIME NULL,
  `completed_at`   DATETIME NULL,
  `refused_at`     DATETIME NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_recipients_doc`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  fields
-- ------------------------------------------------------------
CREATE TABLE `fields` (
  `id`           VARCHAR(36)  NOT NULL,
  `document_id`  VARCHAR(36)  NOT NULL,
  `recipient_id` VARCHAR(36)  NULL,
  `type`         ENUM('signature','initials','text','date','checkbox','dropdown') NOT NULL,
  `label`        VARCHAR(255) NOT NULL DEFAULT '',
  `options`      JSON         NULL,
  `x`            FLOAT NOT NULL DEFAULT 0,
  `y`            FLOAT NOT NULL DEFAULT 0,
  `width`        FLOAT NOT NULL DEFAULT 150,
  `height`       FLOAT NOT NULL DEFAULT 50,
  `required`     TINYINT(1) NOT NULL DEFAULT 1,
  `page`         INT NOT NULL DEFAULT 1,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_fields_doc`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  signatures
-- ------------------------------------------------------------
CREATE TABLE `signatures` (
  `id`            VARCHAR(36)  NOT NULL,
  `document_id`   VARCHAR(36)  NOT NULL,
  `recipient_id`  VARCHAR(36)  NOT NULL,
  `field_id`      VARCHAR(36)  NOT NULL,
  `type`          ENUM('draw','type','upload','text','checkbox','dropdown') NOT NULL,
  `data`          MEDIUMTEXT   NOT NULL,
  `signed_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sig` (`recipient_id`, `field_id`),
  CONSTRAINT `fk_sig_doc`
    FOREIGN KEY (`document_id`)  REFERENCES `documents`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_sig_recipient`
    FOREIGN KEY (`recipient_id`) REFERENCES `recipients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sig_field`
    FOREIGN KEY (`field_id`)     REFERENCES `fields`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  audit_logs
-- ------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id`           VARCHAR(36)  NOT NULL,
  `document_id`  VARCHAR(36)  NOT NULL,
  `recipient_id` VARCHAR(36)  NULL,
  `event`        ENUM('created','sent','viewed','field_signed','completed',
                      'document_completed','refused','cancelled','reminder_sent',
                      'expired') NOT NULL,
  `metadata`     JSON         NULL,
  `ip`           VARCHAR(45)  NULL,
  `user_agent`   VARCHAR(512) NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_doc` (`document_id`),
  CONSTRAINT `fk_audit_doc`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  templates  (modèles de champs réutilisables)
-- ------------------------------------------------------------
CREATE TABLE `templates` (
  `id`          VARCHAR(36)  NOT NULL,
  `user_id`     VARCHAR(128) NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT         NULL,
  `fields`      JSON         NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
