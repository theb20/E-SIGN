-- ============================================================
--  E-SIGN — Migration vers le schéma multi-destinataires
--  Compatible MySQL 5.7 / 8.0 (MAMP)
-- ============================================================

USE `esign`;

SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer les tables dans l'ordre inverse des FK
DROP TABLE IF EXISTS `signatures`;
DROP TABLE IF EXISTS `recipients`;
DROP TABLE IF EXISTS `fields`;
DROP TABLE IF EXISTS `documents`;

SET FOREIGN_KEY_CHECKS = 1;

-- ── documents ────────────────────────────────────────────────
CREATE TABLE `documents` (
  `id`            VARCHAR(36)  NOT NULL,
  `title`         VARCHAR(255) NOT NULL DEFAULT 'Sans titre',
  `file_name`     VARCHAR(255) NOT NULL,
  `file_path`     VARCHAR(500) NOT NULL,
  `file_type`     ENUM('pdf','image') NOT NULL DEFAULT 'pdf',
  `status`        ENUM('draft','pending','completed') NOT NULL DEFAULT 'draft',
  `sender_name`   VARCHAR(255) NOT NULL DEFAULT '',
  `sender_email`  VARCHAR(255) NOT NULL DEFAULT '',
  `message`       TEXT,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at`  DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── recipients ───────────────────────────────────────────────
CREATE TABLE `recipients` (
  `id`            VARCHAR(36)  NOT NULL,
  `document_id`   VARCHAR(36)  NOT NULL,
  `name`          VARCHAR(255) NOT NULL DEFAULT '',
  `email`         VARCHAR(255) NOT NULL,
  `signing_token` VARCHAR(64)  NOT NULL UNIQUE,
  `status`        ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  `email_sent`    TINYINT(1)   NOT NULL DEFAULT 0,
  `completed_at`  DATETIME NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_recipients_doc`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── fields ───────────────────────────────────────────────────
CREATE TABLE `fields` (
  `id`           VARCHAR(36)  NOT NULL,
  `document_id`  VARCHAR(36)  NOT NULL,
  `type`         ENUM('signature','initials','text','date','checkbox') NOT NULL,
  `label`        VARCHAR(255) NOT NULL DEFAULT '',
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

-- ── signatures ───────────────────────────────────────────────
CREATE TABLE `signatures` (
  `id`            VARCHAR(36)  NOT NULL,
  `document_id`   VARCHAR(36)  NOT NULL,
  `recipient_id`  VARCHAR(36)  NOT NULL,
  `field_id`      VARCHAR(36)  NOT NULL,
  `type`          ENUM('draw','type','text','checkbox') NOT NULL,
  `data`          MEDIUMTEXT   NOT NULL,
  `signed_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sig` (`recipient_id`, `field_id`),
  CONSTRAINT `fk_sig_doc`       FOREIGN KEY (`document_id`)  REFERENCES `documents`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_sig_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `recipients`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sig_field`     FOREIGN KEY (`field_id`)     REFERENCES `fields`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── audit_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`           VARCHAR(36)  NOT NULL,
  `document_id`  VARCHAR(36)  NOT NULL,
  `recipient_id` VARCHAR(36)  NULL,
  `event`        ENUM('created','sent','viewed','field_signed','completed','document_completed') NOT NULL,
  `metadata`     JSON         NULL,
  `ip`           VARCHAR(45)  NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_doc` (`document_id`),
  CONSTRAINT `fk_audit_doc`
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration terminée.' AS status;
