-- Migration: multilingual announcements system.
-- Tables: announcement_categories, announcements, announcement_translations, announcement_attachments.

CREATE TABLE IF NOT EXISTS announcement_categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  slug       VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id         INT UNSIGNED DEFAULT NULL,
  cover_image         VARCHAR(500) DEFAULT NULL,
  image_alt           VARCHAR(255) DEFAULT NULL,
  status              ENUM('draft','published','scheduled','archived') NOT NULL DEFAULT 'draft',
  is_featured         TINYINT(1) NOT NULL DEFAULT 0,
  is_important        TINYINT(1) NOT NULL DEFAULT 0,
  show_on_homepage    TINYINT(1) NOT NULL DEFAULT 0,
  allow_social_sharing TINYINT(1) NOT NULL DEFAULT 1,
  published_at        DATETIME DEFAULT NULL,
  expires_at          DATETIME DEFAULT NULL,
  created_by          INT UNSIGNED DEFAULT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_ann_status (status),
  INDEX idx_ann_homepage (status, show_on_homepage, published_at),
  INDEX idx_ann_published (published_at),
  CONSTRAINT fk_ann_category FOREIGN KEY (category_id) REFERENCES announcement_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcement_translations (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id  INT UNSIGNED NOT NULL,
  language_code    CHAR(2) NOT NULL,
  title            VARCHAR(255) DEFAULT NULL,
  short_description VARCHAR(500) DEFAULT NULL,
  content          LONGTEXT DEFAULT NULL,
  image_caption    VARCHAR(255) DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ann_trans (announcement_id, language_code),
  CONSTRAINT fk_ann_trans FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcement_attachments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT UNSIGNED NOT NULL,
  file_path       VARCHAR(500) NOT NULL,
  file_type       VARCHAR(50) DEFAULT NULL,
  file_name       VARCHAR(255) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ann_attach FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default categories (trilingual names stored per language where needed).
INSERT INTO announcement_categories (name, slug) VALUES
  ('Official Announcements', 'official-announcements'),
  ('Press Releases', 'press-releases'),
  ('Party Statements', 'party-statements'),
  ('Public Notices', 'public-notices'),
  ('Events & Meetings', 'events-meetings'),
  ('Important Updates', 'important-updates')
ON DUPLICATE KEY UPDATE name = VALUES(name);
