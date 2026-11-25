-- ============================================================
-- political_party_db â€” Sri Lankan Political Party Website
-- MySQL 8.x / utf8mb4
-- Import via phpMyAdmin or: mysql -u root political_party_db < political_party_db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS political_party_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE political_party_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Languages
-- ------------------------------------------------------------
CREATE TABLE languages (
  code        CHAR(2)      NOT NULL PRIMARY KEY,   -- en, si, ta
  name_en     VARCHAR(50)  NOT NULL,
  name_native VARCHAR(50)  NOT NULL,
  enabled     TINYINT(1)   NOT NULL DEFAULT 1,
  is_default  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Roles & Permissions
-- ------------------------------------------------------------
CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(100) NOT NULL UNIQUE,   -- e.g. news.create
  name        VARCHAR(150) NOT NULL,
  module      VARCHAR(50)  NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  status          ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  last_login_at   DATETIME DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  token_hash CHAR(64)     NOT NULL,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pr_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Settings (key/value CMS config)
-- ------------------------------------------------------------
CREATE TABLE settings (
  setting_key   VARCHAR(100) NOT NULL PRIMARY KEY,
  setting_value TEXT         DEFAULT NULL,
  `group`       VARCHAR(50)  NOT NULL DEFAULT 'general',
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Pages (CMS pages, trilingual)
-- ------------------------------------------------------------
CREATE TABLE pages (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug_base      VARCHAR(150) NOT NULL,
  banner_image   VARCHAR(255) DEFAULT NULL,
  status         ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  display_order  INT NOT NULL DEFAULT 0,
  is_homepage    TINYINT(1) NOT NULL DEFAULT 0,
  created_by     INT UNSIGNED DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pages_status (status),
  CONSTRAINT fk_pages_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE page_translations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_id      INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(150) NOT NULL,
  content      LONGTEXT,
  seo_title    VARCHAR(255) DEFAULT NULL,
  seo_desc     VARCHAR(500) DEFAULT NULL,
  UNIQUE KEY uq_pt_page_lang (page_id, language_code),
  UNIQUE KEY uq_pt_lang_slug (language_code, slug),
  CONSTRAINT fk_pt_page FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  CONSTRAINT fk_pt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Categories (type: news, gallery, video, policy)
-- ------------------------------------------------------------
CREATE TABLE categories (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type           ENUM('news','gallery','video','policy') NOT NULL DEFAULT 'news',
  image          VARCHAR(255) DEFAULT NULL,
  status         ENUM('active','disabled') NOT NULL DEFAULT 'active',
  display_order  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cat_type (type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE category_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id   INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  slug          VARCHAR(150) NOT NULL,
  description   TEXT,
  UNIQUE KEY uq_ct_cat_lang (category_id, language_code),
  UNIQUE KEY uq_ct_type_lang_slug (category_id, language_code, slug),
  CONSTRAINT fk_ct_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- News
-- ------------------------------------------------------------
CREATE TABLE news (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED DEFAULT NULL,
  author_id        INT UNSIGNED DEFAULT NULL,
  author_name      VARCHAR(150) DEFAULT NULL,
  featured_image   VARCHAR(255) DEFAULT NULL,
  image_caption_en VARCHAR(255) DEFAULT NULL,
  image_caption_si VARCHAR(255) DEFAULT NULL,
  image_caption_ta VARCHAR(255) DEFAULT NULL,
  tags             TEXT DEFAULT NULL,               -- JSON array
  publish_at       DATETIME DEFAULT NULL,
  status           ENUM('draft','published','scheduled','archived') NOT NULL DEFAULT 'draft',
  is_featured      TINYINT(1) NOT NULL DEFAULT 0,
  is_breaking      TINYINT(1) NOT NULL DEFAULT 0,
  views_count      INT UNSIGNED NOT NULL DEFAULT 0,
  created_by       INT UNSIGNED DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_news_status_pub (status, publish_at),
  INDEX idx_news_featured (is_featured),
  CONSTRAINT fk_news_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_news_created FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news_translations (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  news_id        INT UNSIGNED NOT NULL,
  language_code  CHAR(2) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  slug           VARCHAR(180) NOT NULL,
  excerpt        TEXT,
  content        LONGTEXT,
  seo_title      VARCHAR(255) DEFAULT NULL,
  seo_desc       VARCHAR(500) DEFAULT NULL,
  UNIQUE KEY uq_nt_news_lang (news_id, language_code),
  UNIQUE KEY uq_nt_lang_slug (language_code, slug),
  FULLTEXT KEY ft_nt_content (title, content),
  CONSTRAINT fk_nt_news FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  CONSTRAINT fk_nt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Leadership
-- ------------------------------------------------------------
CREATE TABLE leadership (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  position_order INT NOT NULL DEFAULT 0,   -- role sort: 1=Leader, 2=Deputy...
  position_key   VARCHAR(50) DEFAULT NULL, -- leader|deputy|general_secretary|organizer|mp|provincial|district|member
  image          VARCHAR(255) DEFAULT NULL,
  district       VARCHAR(100) DEFAULT NULL,
  email          VARCHAR(150) DEFAULT NULL,
  phone          VARCHAR(30)  DEFAULT NULL,
  facebook       VARCHAR(255) DEFAULT NULL,
  twitter        VARCHAR(255) DEFAULT NULL,
  instagram      VARCHAR(255) DEFAULT NULL,
  youtube        VARCHAR(255) DEFAULT NULL,
  display_order  INT NOT NULL DEFAULT 0,
  status         ENUM('published','unpublished') NOT NULL DEFAULT 'published',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lead_pos (position_key, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leadership_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leadership_id INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  name          VARCHAR(150) NOT NULL,
  position      VARCHAR(150) NOT NULL,
  bio           TEXT,
  UNIQUE KEY uq_lt_lead_lang (leadership_id, language_code),
  CONSTRAINT fk_lt_lead FOREIGN KEY (leadership_id) REFERENCES leadership(id) ON DELETE CASCADE,
  CONSTRAINT fk_lt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Policy categories + policies
-- ------------------------------------------------------------
CREATE TABLE policy_categories (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  icon           VARCHAR(50) DEFAULT NULL,
  display_order  INT NOT NULL DEFAULT 0,
  status         ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE policy_category_translations (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED NOT NULL,
  language_code    CHAR(2) NOT NULL,
  name             VARCHAR(150) NOT NULL,
  slug             VARCHAR(150) NOT NULL,
  description      TEXT,
  UNIQUE KEY uq_pct_cat_lang (category_id, language_code),
  CONSTRAINT fk_pct_cat FOREIGN KEY (category_id) REFERENCES policy_categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_pct_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE policies (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED DEFAULT NULL,
  image            VARCHAR(255) DEFAULT NULL,
  is_featured      TINYINT(1) NOT NULL DEFAULT 0,
  display_order    INT NOT NULL DEFAULT 0,
  status           ENUM('published','unpublished','draft') NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pol_cat FOREIGN KEY (category_id) REFERENCES policy_categories(id) ON DELETE SET NULL,
  INDEX idx_pol_status (status, is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE policy_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  policy_id     INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(180) NOT NULL,
  summary       TEXT,
  content       LONGTEXT,
  UNIQUE KEY uq_polt_pol_lang (policy_id, language_code),
  UNIQUE KEY uq_polt_lang_slug (language_code, slug),
  CONSTRAINT fk_polt_pol FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE,
  CONSTRAINT fk_polt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Manifesto documents
-- ------------------------------------------------------------
CREATE TABLE manifesto_documents (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id    INT UNSIGNED DEFAULT NULL,   -- FK to categories(type='policy') optional
  file_path      VARCHAR(255) NOT NULL,
  file_name      VARCHAR(255) DEFAULT NULL,
  file_size      INT UNSIGNED DEFAULT NULL,
  display_order  INT NOT NULL DEFAULT 0,
  status         ENUM('published','unpublished') NOT NULL DEFAULT 'published',
  published_at   DATE DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mf_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE manifesto_translations (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id      INT UNSIGNED NOT NULL,
  language_code    CHAR(2) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  UNIQUE KEY uq_mt_doc_lang (document_id, language_code),
  CONSTRAINT fk_mt_doc FOREIGN KEY (document_id) REFERENCES manifesto_documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_mt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Events
-- ------------------------------------------------------------
CREATE TABLE events (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      INT UNSIGNED DEFAULT NULL,
  image            VARCHAR(255) DEFAULT NULL,
  event_date       DATE NOT NULL,
  start_time       TIME DEFAULT NULL,
  end_time         TIME DEFAULT NULL,
  venue            VARCHAR(255) DEFAULT NULL,
  address          VARCHAR(255) DEFAULT NULL,
  map_url          VARCHAR(500) DEFAULT NULL,
  map_embed        VARCHAR(500) DEFAULT NULL,
  stream_url       VARCHAR(500) DEFAULT NULL,
  stream_platform  VARCHAR(30) DEFAULT NULL,
  stream_embed_url VARCHAR(500) DEFAULT NULL,
  enable_live_streaming TINYINT(1) NOT NULL DEFAULT 1,
  show_live_badge  TINYINT(1) NOT NULL DEFAULT 1,
  show_viewer_count TINYINT(1) NOT NULL DEFAULT 0,
  contact_email    VARCHAR(150) DEFAULT NULL,
  -- Completed event fields
  event_highlights TEXT DEFAULT NULL,
  event_summary TEXT DEFAULT NULL,
  event_achievements VARCHAR(500) DEFAULT NULL,
  event_video_url VARCHAR(500) DEFAULT NULL,
  -- Cancelled event fields
  cancellation_date DATE DEFAULT NULL,
  cancellation_reason ENUM('organisational_decision','unavoidable_circumstances','weather_conditions','venue_unavailability','speaker_unavailability','insufficient_registrations','other') DEFAULT NULL,
  cancellation_details TEXT DEFAULT NULL,
  cancellation_announcement TEXT DEFAULT NULL,
  cancellation_image VARCHAR(255) DEFAULT NULL,
  organizer_name VARCHAR(255) DEFAULT NULL,
  is_rescheduled TINYINT(1) NOT NULL DEFAULT 0,
  rescheduled_event_date DATE DEFAULT NULL,
  refund_information TEXT DEFAULT NULL,
  show_cancellation_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
  send_cancellation_notification TINYINT(1) NOT NULL DEFAULT 0,
  external_url     VARCHAR(500) DEFAULT NULL,
  registration_url VARCHAR(500) DEFAULT NULL,
  gallery_json     LONGTEXT DEFAULT NULL,
  city             VARCHAR(150) DEFAULT NULL,
  contact_person   VARCHAR(150) DEFAULT NULL,
  contact_phone    VARCHAR(30) DEFAULT NULL,
  is_featured      TINYINT(1) NOT NULL DEFAULT 0,
  show_on_homepage TINYINT(1) NOT NULL DEFAULT 1,
  event_status     ENUM('upcoming','live','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  registration_limit INT UNSIGNED DEFAULT NULL,
  registration_count INT UNSIGNED NOT NULL DEFAULT 0,
  registration_open TINYINT(1) NOT NULL DEFAULT 1,
  registration_opens_at DATETIME DEFAULT NULL,
  registration_closes_at DATETIME DEFAULT NULL,
  registration_open_mode ENUM('auto','manual') NOT NULL DEFAULT 'auto',
  display_order    INT NOT NULL DEFAULT 0,
  status           ENUM('published','unpublished','draft','cancelled') NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ev_date (event_date, status),
  CONSTRAINT fk_ev_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id      INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(180) NOT NULL,
  short_description VARCHAR(500) DEFAULT NULL,
  description   LONGTEXT,
  UNIQUE KEY uq_evt_event_lang (event_id, language_code),
  UNIQUE KEY uq_evt_lang_slug (language_code, slug),
  CONSTRAINT fk_evt_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_evt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE event_registrations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id   INT UNSIGNED NOT NULL,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(30)  DEFAULT NULL,
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reg_event_email (event_id, email),
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Gallery
-- ------------------------------------------------------------
CREATE TABLE gallery_albums (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id   INT UNSIGNED DEFAULT NULL,
  cover_image   VARCHAR(255) DEFAULT NULL,
  is_featured   TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  status        ENUM('published','unpublished') NOT NULL DEFAULT 'published',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alb_status (status),
  CONSTRAINT fk_alb_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gallery_album_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id      INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  UNIQUE KEY uq_gat_album_lang (album_id, language_code),
  CONSTRAINT fk_gat_album FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE,
  CONSTRAINT fk_gat_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gallery_images (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id      INT UNSIGNED NOT NULL,
  image_path    VARCHAR(255) NOT NULL,
  thumbnail_path VARCHAR(255) DEFAULT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status        ENUM('published','unpublished') NOT NULL DEFAULT 'published',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gi_album FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE,
  INDEX idx_gi_album (album_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gallery_image_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image_id      INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  caption       VARCHAR(500) DEFAULT NULL,
  alt_text      VARCHAR(255) DEFAULT NULL,
  UNIQUE KEY uq_git_image_lang (image_id, language_code),
  CONSTRAINT fk_git_image FOREIGN KEY (image_id) REFERENCES gallery_images(id) ON DELETE CASCADE,
  CONSTRAINT fk_git_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Videos (YouTube)
-- ------------------------------------------------------------
CREATE TABLE videos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id    INT UNSIGNED DEFAULT NULL,
  youtube_id     VARCHAR(20) NOT NULL,
  youtube_url    VARCHAR(255) DEFAULT NULL,
  thumbnail_url  VARCHAR(500) DEFAULT NULL,
  is_featured    TINYINT(1) NOT NULL DEFAULT 0,
  display_order  INT NOT NULL DEFAULT 0,
  status         ENUM('published','unpublished') NOT NULL DEFAULT 'published',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_videos_yt (youtube_id),
  INDEX idx_vid_status (status, is_featured),
  CONSTRAINT fk_vid_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE video_translations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id      INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  UNIQUE KEY uq_vt_video_lang (video_id, language_code),
  CONSTRAINT fk_vt_video FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  CONSTRAINT fk_vt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Members (private - never exposed publicly)
-- ------------------------------------------------------------
CREATE TABLE members (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  membership_number  VARCHAR(30) DEFAULT NULL,
  full_name          VARCHAR(150) NOT NULL,
  date_of_birth      DATE DEFAULT NULL,
  email              VARCHAR(150) DEFAULT NULL,
  phone              VARCHAR(30)  DEFAULT NULL,
  address            TEXT,
  district           VARCHAR(100) DEFAULT NULL,
  ds_division        VARCHAR(150) DEFAULT NULL,
  preferred_language CHAR(2) DEFAULT 'en',
  membership_type    ENUM('general','youth','women','professional','overseas') NOT NULL DEFAULT 'general',
  photo_path         VARCHAR(255) DEFAULT NULL,
  status             ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  consent_given      TINYINT(1) NOT NULL DEFAULT 0,
  admin_notes        TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mem_status (status),
  INDEX idx_mem_district (district),
  INDEX idx_mem_email (email),
  UNIQUE KEY uq_mem_number (membership_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Contact messages
-- ------------------------------------------------------------
CREATE TABLE messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(30)  DEFAULT NULL,
  subject    VARCHAR(255) DEFAULT NULL,
  message    TEXT NOT NULL,
  status     ENUM('unread','read','archived') NOT NULL DEFAULT 'unread',
  replied_at DATETIME DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_msg_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Newsletter
-- ------------------------------------------------------------
CREATE TABLE newsletter_subscribers (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  name          VARCHAR(150) DEFAULT NULL,
  language_code CHAR(2) DEFAULT 'en',
  status        ENUM('active','unsubscribed') NOT NULL DEFAULT 'active',
  unsub_token   CHAR(64) DEFAULT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ns_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Media library
-- ------------------------------------------------------------
CREATE TABLE media (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_path     VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100) DEFAULT NULL,
  file_size     INT UNSIGNED DEFAULT NULL,
  type          ENUM('image','document','video','other') NOT NULL DEFAULT 'image',
  alt_en        VARCHAR(255) DEFAULT NULL,
  alt_si        VARCHAR(255) DEFAULT NULL,
  alt_ta        VARCHAR(255) DEFAULT NULL,
  uploaded_by   INT UNSIGNED DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_type (type),
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Activity logs
-- ------------------------------------------------------------
CREATE TABLE activity_logs (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED DEFAULT NULL,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50)  DEFAULT NULL,
  entity_id  INT UNSIGNED DEFAULT NULL,
  meta       JSON DEFAULT NULL,
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_created (created_at),
  INDEX idx_al_user (user_id),
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO languages (code, name_en, name_native, enabled, is_default) VALUES
  ('en', 'English',  'English',   1, 1),
  ('si', 'Sinhala',  'à·ƒà·’à¶‚à·„à¶½',     1, 0),
  ('ta', 'Tamil',    'à®¤à®®à®¿à®´à¯',      1, 0);

INSERT INTO roles (name, slug, description) VALUES
  ('Super Admin',     'super_admin',     'Full unrestricted access'),
  ('Admin',           'admin',           'Full access except user deletion'),
  ('Editor',          'editor',          'Content creation and editing'),
  ('Content Manager', 'content_manager', 'Limited content management');

-- Permissions: module.action
INSERT INTO permissions (slug, name, module) VALUES
  ('dashboard.view',          'View dashboard',            'dashboard'),
  ('news.view',               'View news',                 'news'),
  ('news.create',             'Create news',               'news'),
  ('news.edit',               'Edit news',                 'news'),
  ('news.delete',             'Delete news',               'news'),
  ('news.publish',            'Publish news',              'news'),
  ('categories.manage',       'Manage categories',         'categories'),
  ('leadership.manage',       'Manage leadership',         'leadership'),
  ('policies.manage',         'Manage policies',           'policies'),
  ('manifesto.manage',        'Manage manifesto',          'manifesto'),
  ('events.manage',           'Manage events',             'events'),
  ('events.registrations',    'Manage event registrations','events'),
  ('gallery.manage',          'Manage gallery',            'gallery'),
  ('videos.manage',           'Manage videos',             'videos'),
  ('members.view',            'View members',              'members'),
  ('members.manage',          'Manage members',            'members'),
  ('messages.manage',         'Manage messages',           'messages'),
  ('newsletter.manage',       'Manage newsletter',         'newsletter'),
  ('media.manage',            'Manage media library',      'media'),
  ('pages.manage',            'Manage pages',              'pages'),
  ('settings.manage',         'Manage settings',           'settings'),
  ('users.manage',            'Manage users and roles',    'users'),
  ('logs.view',               'View activity logs',        'logs');

-- Super Admin + Admin get everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.slug IN ('super_admin','admin');

-- Editor: content modules, no users/settings/logs/members delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.slug = 'editor'
  AND p.module IN ('dashboard','news','categories','leadership','policies','manifesto','events','gallery','videos','pages','media','messages');

-- Content Manager: content modules except delete-level & settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.slug = 'content_manager'
  AND p.module IN ('dashboard','news','categories','leadership','policies','manifesto','events','gallery','videos','pages','media')
  AND p.slug NOT IN ('news.delete','users.manage','settings.manage','logs.view');

-- Default site settings (placeholders until official details provided)
INSERT INTO settings (setting_key, setting_value, `group`) VALUES
  ('site_title',           'Thayaga Makkal Kazhagam (TMK)',   'general'),
  ('site_description',     'Official website of the party.',  'seo'),
  ('party_name_en',        'Thayaga Makkal Kazhagam (TMK)',   'branding'),
  ('party_name_si',        'තායක ජනතා සංවිධානය',             'branding'),
  ('party_name_ta',        'தாயக மக்கள் கழகம்',               'branding'),
  ('party_slogan_en',      'For the People, By the People',   'branding'),
  ('party_slogan_si',      'For the People, By the People',   'branding'),
  ('party_slogan_ta',      'For the People, By the People',   'branding'),
  ('party_logo',           '',                                'branding'),
  ('favicon',              '',                                'branding'),
  ('contact_email',        'info@example.com',                'general'),
  ('contact_phone',        '',                                'general'),
  ('office_address',       '',                                'general'),
  ('facebook_url',         '',                                'social'),
  ('twitter_url',          '',                                'social'),
  ('instagram_url',        '',                                'social'),
  ('youtube_url',          '',                                'social'),
  ('meta_title',           'Thayaga Makkal Kazhagam (TMK)',   'seo'),
  ('meta_description',     '',                                'seo'),
  ('og_image',             '',                                'seo'),
  ('footer_content_en',    '',                                'appearance'),
  ('footer_content_si',    '',                                'appearance'),
  ('footer_content_ta',    '',                                'appearance'),
  ('homepage_banner',      '',                                'appearance'),
  ('default_language',     'en',                              'language'),
  ('enabled_languages',    'en,si,ta',                        'language'),
  ('announcement_bar',     '',                                'appearance'),
  ('announcement_enabled', '0',                               'appearance');

-- Default policy categories (14 per spec)
INSERT INTO policy_categories (id, icon, display_order, status) VALUES
  (1,'coins',1,'active'),(2,'graduation-cap',2,'active'),(3,'heart-pulse',3,'active'),
  (4,'wheat',4,'active'),(5,'briefcase',5,'active'),(6,'building-2',6,'active'),
  (7,'leaf',7,'active'),(8,'users',8,'active'),(9,'user-check',9,'active'),
  (10,'hand-heart',10,'active'),(11,'flag',11,'active'),(12,'scale',12,'active'),
  (13,'languages',13,'active'),(14,'map',14,'active');

INSERT INTO policy_category_translations (category_id, language_code, name, slug) VALUES
  (1,'en','Economy','economy'),(2,'en','Education','education'),(3,'en','Healthcare','healthcare'),
  (4,'en','Agriculture','agriculture'),(5,'en','Employment','employment'),(6,'en','Infrastructure','infrastructure'),
  (7,'en','Environment','environment'),(8,'en','Youth Development','youth-development'),(9,'en',"Women's Development",'women-development'),
  (10,'en','Social Welfare','social-welfare'),(11,'en','National Development','national-development'),(12,'en','Tamil Community Rights','tamil-community-rights'),
  (13,'en','Language Rights','language-rights'),(14,'en','Provincial Development','provincial-development'),
  (1,'si','à¶†à¶»à·Šà¶®à·’à¶šà¶º','economy'),(2,'si','à¶…à¶°à·Šâ€à¶ºà·à¶´à¶±à¶º','education'),(3,'si','à·ƒà·žà¶›à·Šâ€à¶ºà¶º','healthcare'),
  (4,'si','à¶šà·˜à·‚à·’à¶šà¶»à·Šà¶¸à¶º','agriculture'),(5,'si','à¶»à·à¶šà·’à¶ºà·','employment'),(6,'si','à¶ºà¶§à·’à¶­à¶½ à·€à·Šâ€à¶ºà·”à·„à¶º','infrastructure'),
  (7,'si','à¶´à¶»à·’à·ƒà¶»à¶º','environment'),(8,'si','à¶­à¶»à·”à¶« à·ƒà¶‚à·€à¶»à·Šà¶°à¶±à¶º','youth-development'),(9,'si','à¶šà·à¶±à·Šà¶­à· à·ƒà¶‚à·€à¶»à·Šà¶°à¶±à¶º','women-development'),
  (10,'si','à·ƒà¶¸à·à¶¢ à¶ºà·„à¶´à¶­','social-welfare'),(11,'si','à¶¢à·à¶­à·’à¶š à·ƒà¶‚à·€à¶»à·Šà¶°à¶±à¶º','national-development'),(12,'si','à¶¯à·™à¶¸à·… à¶´à·Šâ€à¶»à¶¢à· à·„à·’à¶¸à·’à¶šà¶¸à·Š','tamil-community-rights'),
  (13,'si','à¶·à·à·‚à· à·„à·’à¶¸à·’à¶šà¶¸à·Š','language-rights'),(14,'si','à¶´à·…à·à¶­à·Š à·ƒà¶‚à·€à¶»à·Šà¶°à¶±à¶º','provincial-development'),
  (1,'ta','à®ªà¯Šà®°à¯à®³à®¾à®¤à®¾à®°à®®à¯','economy'),(2,'ta','à®•à®²à¯à®µà®¿','education'),(3,'ta','à®šà¯à®•à®¾à®¤à®¾à®°à®®à¯','healthcare'),
  (4,'ta','à®µà¯‡à®³à®¾à®£à¯à®®à¯ˆ','agriculture'),(5,'ta','à®µà¯‡à®²à¯ˆà®µà®¾à®¯à¯à®ªà¯à®ªà¯','employment'),(6,'ta','à®‰à®³à¯à®•à®Ÿà¯à®Ÿà®®à¯ˆà®ªà¯à®ªà¯','infrastructure'),
  (7,'ta','à®šà¯à®±à¯à®±à¯à®šà¯à®šà¯‚à®´à®²à¯','environment'),(8,'ta','à®‡à®³à¯ˆà®žà®°à¯ à®µà®³à®°à¯à®šà¯à®šà®¿','youth-development'),(9,'ta','à®ªà¯†à®£à¯à®•à®³à¯ à®µà®³à®°à¯à®šà¯à®šà®¿','women-development'),
  (10,'ta','à®šà®®à¯‚à®• à®¨à®²à®©à¯','social-welfare'),(11,'ta','à®¤à¯‡à®šà®¿à®¯ à®µà®³à®°à¯à®šà¯à®šà®¿','national-development'),(12,'ta','à®¤à®®à®¿à®´à¯ à®šà®®à¯‚à®• à®‰à®°à®¿à®®à¯ˆà®•à®³à¯','tamil-community-rights'),
  (13,'ta','à®®à¯Šà®´à®¿ à®‰à®°à®¿à®®à¯ˆà®•à®³à¯','language-rights'),(14,'ta','à®®à®¾à®•à®¾à®£ à®µà®³à®°à¯à®šà¯à®šà®¿','provincial-development');

-- No default administrator account is seeded.
-- Provision admin credentials securely for each deployment.
