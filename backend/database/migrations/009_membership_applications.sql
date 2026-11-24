-- Migration 009: Join Us membership applications.
-- Builds on 005_membership_system (party_members + membership_verification_logs). Re-runnable (MariaDB IF NOT EXISTS).
--
-- Status mapping used by the API and UI:
--   pending      = "Received"       (just submitted)
--   under_review = "Under Review"
--   verified     = "Approved"       (gets a membership_id; announcement access already keys off 'verified')
--   rejected     = "Declined"       (decision_reason holds the reason sent to the applicant)

-- 1. Applications are stored before a membership ID exists, so membership_id becomes nullable
--    (UNIQUE still holds; NULLs don't collide). application_ref is the public reference.
ALTER TABLE party_members
  MODIFY COLUMN membership_id VARCHAR(30) NULL;

ALTER TABLE party_members
  ADD COLUMN IF NOT EXISTS application_ref     VARCHAR(20)  NULL AFTER id,
  ADD COLUMN IF NOT EXISTS date_of_birth       DATE         NULL AFTER full_name,
  ADD COLUMN IF NOT EXISTS gender              VARCHAR(20)  NULL AFTER date_of_birth,
  ADD COLUMN IF NOT EXISTS residential_address TEXT         NULL AFTER email,
  ADD COLUMN IF NOT EXISTS mailing_address     TEXT         NULL AFTER residential_address,
  ADD COLUMN IF NOT EXISTS electoral_division_id INT UNSIGNED NULL AFTER district_id,
  ADD COLUMN IF NOT EXISTS nic_number          VARCHAR(12)  NULL AFTER electoral_division_id,
  ADD COLUMN IF NOT EXISTS citizenship         VARCHAR(20)  NULL AFTER nic_number,
  ADD COLUMN IF NOT EXISTS occupation          VARCHAR(120) NULL AFTER citizenship,
  ADD COLUMN IF NOT EXISTS interests           TEXT         NULL AFTER occupation,
  ADD COLUMN IF NOT EXISTS previous_member     TINYINT(1)   NOT NULL DEFAULT 0 AFTER interests,
  ADD COLUMN IF NOT EXISTS previous_organisation VARCHAR(160) NULL AFTER previous_member,
  ADD COLUMN IF NOT EXISTS preferred_language  CHAR(2)      NOT NULL DEFAULT 'en' AFTER previous_organisation,
  ADD COLUMN IF NOT EXISTS declarations        TEXT         NULL AFTER preferred_language,
  ADD COLUMN IF NOT EXISTS declaration_name    VARCHAR(160) NULL AFTER declarations,
  ADD COLUMN IF NOT EXISTS declared_at         DATETIME     NULL AFTER declaration_name,
  ADD COLUMN IF NOT EXISTS decision_reason     TEXT         NULL AFTER verified_at,
  ADD COLUMN IF NOT EXISTS reviewed_by         INT UNSIGNED NULL AFTER decision_reason,
  ADD COLUMN IF NOT EXISTS reviewed_at         DATETIME     NULL AFTER reviewed_by,
  ADD COLUMN IF NOT EXISTS submitted_ip        VARCHAR(45)  NULL AFTER reviewed_at;

ALTER TABLE party_members
  ADD UNIQUE INDEX IF NOT EXISTS uq_pm_application_ref (application_ref),
  ADD INDEX IF NOT EXISTS idx_pm_nic (nic_number),
  ADD INDEX IF NOT EXISTS idx_pm_email (email),
  ADD INDEX IF NOT EXISTS idx_pm_created (created_at);

-- 2. Electoral constituencies (polling divisions) for the districts in `districts`.
CREATE TABLE IF NOT EXISTS electoral_divisions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  district_id INT UNSIGNED NOT NULL,
  electoral_district VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ta VARCHAR(160) NULL,
  name_si VARCHAR(160) NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
  INDEX idx_ed_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO electoral_divisions (district_id, electoral_district, name, name_ta, slug, sort_order)
SELECT d.id, x.ed, x.name, x.name_ta, x.slug, x.ord FROM (
  SELECT 'jaffna' dk, 'Jaffna' ed, 'Kayts' name, 'ஊர்காவற்துறை' name_ta, 'kayts' slug, 1 ord UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Vaddukoddai', 'வட்டுக்கோட்டை', 'vaddukoddai', 2 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Kankesanthurai', 'காங்கேசன்துறை', 'kankesanthurai', 3 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Manipay', 'மானிப்பாய்', 'manipay', 4 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Kopay', 'கோப்பாய்', 'kopay', 5 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Udupiddy', 'உடுப்பிட்டி', 'udupiddy', 6 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Point Pedro', 'பருத்தித்துறை', 'point-pedro', 7 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Chavakachcheri', 'சாவகச்சேரி', 'chavakachcheri', 8 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Nallur', 'நல்லூர்', 'nallur', 9 UNION ALL
  SELECT 'jaffna', 'Jaffna', 'Jaffna', 'யாழ்ப்பாணம்', 'jaffna-town', 10 UNION ALL
  SELECT 'kilinochchi', 'Jaffna', 'Kilinochchi', 'கிளிநொச்சி', 'kilinochchi', 1 UNION ALL
  SELECT 'mannar', 'Vanni', 'Mannar', 'மன்னார்', 'mannar', 1 UNION ALL
  SELECT 'vavuniya', 'Vanni', 'Vavuniya', 'வவுனியா', 'vavuniya', 1 UNION ALL
  SELECT 'mullaitivu', 'Vanni', 'Mullaitivu', 'முல்லைத்தீவு', 'mullaitivu', 1 UNION ALL
  SELECT 'trincomalee', 'Trincomalee', 'Seruwila', 'சேருவில', 'seruwila', 1 UNION ALL
  SELECT 'trincomalee', 'Trincomalee', 'Trincomalee', 'திருகோணமலை', 'trincomalee-town', 2 UNION ALL
  SELECT 'trincomalee', 'Trincomalee', 'Muttur', 'மூதூர்', 'muttur', 3 UNION ALL
  SELECT 'batticaloa', 'Batticaloa', 'Kalkudah', 'கல்குடா', 'kalkudah', 1 UNION ALL
  SELECT 'batticaloa', 'Batticaloa', 'Batticaloa', 'மட்டக்களப்பு', 'batticaloa-town', 2 UNION ALL
  SELECT 'batticaloa', 'Batticaloa', 'Paddiruppu', 'பட்டிருப்பு', 'paddiruppu', 3 UNION ALL
  SELECT 'ampara', 'Digamadulla', 'Ampara', 'அம்பாறை', 'ampara-town', 1 UNION ALL
  SELECT 'ampara', 'Digamadulla', 'Sammanthurai', 'சம்மாந்துறை', 'sammanthurai', 2 UNION ALL
  SELECT 'ampara', 'Digamadulla', 'Kalmunai', 'கல்முனை', 'kalmunai', 3 UNION ALL
  SELECT 'ampara', 'Digamadulla', 'Pottuvil', 'பொத்துவில்', 'pottuvil', 4
) x JOIN districts d ON d.slug = x.dk;

-- 3. Membership ID counter (one row per year; incremented inside the approval transaction).
CREATE TABLE IF NOT EXISTS membership_sequences (
  seq_year SMALLINT UNSIGNED PRIMARY KEY,
  last_value INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Email templates (admin-editable overrides; code holds the defaults) and the send log.
--    uq_mem_email (member_id, template_key) guarantees one email per event per applicant.
CREATE TABLE IF NOT EXISTS membership_email_templates (
  template_key VARCHAR(30) NOT NULL,
  lang CHAR(2) NOT NULL DEFAULT 'en',
  subject VARCHAR(200) NOT NULL,
  heading VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  updated_by INT UNSIGNED NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (template_key, lang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS membership_emails (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id INT UNSIGNED NOT NULL,
  template_key VARCHAR(30) NOT NULL,
  recipient VARCHAR(160) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html MEDIUMTEXT NOT NULL,
  status ENUM('queued','sent','failed','not_configured') NOT NULL DEFAULT 'queued',
  error VARCHAR(500) NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mem_email (member_id, template_key),
  FOREIGN KEY (member_id) REFERENCES party_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Saved progress: the draft is stored server-side and reopened with a one-time-shown resume
--    code + the applicant's email. Only a SHA-256 of the code is stored. Expires after 7 days.
CREATE TABLE IF NOT EXISTS membership_drafts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code_hash CHAR(64) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL,
  data MEDIUMTEXT NOT NULL,
  step TINYINT UNSIGNED NOT NULL DEFAULT 1,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_md_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Per-IP rate limiting for the public endpoints (submit / track / draft). IP stored hashed.
CREATE TABLE IF NOT EXISTS membership_rate_limits (
  bucket VARCHAR(20) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  window_start DATETIME NOT NULL,
  hits SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Admin notifications (topbar bell). Generic so other modules can use it.
CREATE TABLE IF NOT EXISTS admin_notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body VARCHAR(500) NULL,
  link VARCHAR(255) NULL,
  entity VARCHAR(40) NULL,
  entity_id INT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_an_unread (is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Join Us page settings (all start empty = hidden on the page until an admin fills them in;
--    party names default to the existing branding settings).
INSERT IGNORE INTO settings (setting_key, setting_value, `group`) VALUES
  ('mem_leader_photo', '', 'membership'),
  ('mem_leader_name_en', '', 'membership'), ('mem_leader_name_ta', '', 'membership'), ('mem_leader_name_si', '', 'membership'),
  ('mem_leader_title_en', '', 'membership'), ('mem_leader_title_ta', '', 'membership'), ('mem_leader_title_si', '', 'membership'),
  ('mem_slogan_en', '', 'membership'), ('mem_slogan_ta', '', 'membership'), ('mem_slogan_si', '', 'membership'),
  ('mem_welcome_en', '', 'membership'), ('mem_welcome_ta', '', 'membership'), ('mem_welcome_si', '', 'membership'),
  ('mem_success_en', '', 'membership'), ('mem_success_ta', '', 'membership'), ('mem_success_si', '', 'membership'),
  ('mem_why_img_1', '', 'membership'), ('mem_why_img_2', '', 'membership'),
  ('mem_why_img_3', '', 'membership'), ('mem_why_img_4', '', 'membership'),
  ('mem_rules_url', '', 'membership'), ('mem_constitution_url', '', 'membership'), ('mem_conduct_url', '', 'membership'),
  ('mem_contact_email', '', 'membership'), ('mem_contact_phone', '', 'membership'),
  ('mem_public_site_url', '', 'membership'),
  ('mem_require_photo', '0', 'membership'),
  ('mem_min_age', '18', 'membership'),
  ('mem_id_prefix', 'ITAK', 'membership');

INSERT IGNORE INTO settings (setting_key, setting_value, `group`)
  SELECT 'mem_party_name_en', setting_value, 'membership' FROM settings WHERE setting_key = 'party_name_en';
INSERT IGNORE INTO settings (setting_key, setting_value, `group`)
  SELECT 'mem_party_name_ta', setting_value, 'membership' FROM settings WHERE setting_key = 'party_name_ta';
