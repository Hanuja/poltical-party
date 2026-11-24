-- Public Voice: private submissions and media remain hidden until an admin publishes them.
CREATE TABLE IF NOT EXISTS public_voice_submissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(32) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL,
  province VARCHAR(120) NOT NULL,
  district VARCHAR(120) NOT NULL,
  ds_division VARCHAR(160) NOT NULL,
  gn_division VARCHAR(160) DEFAULT NULL,
  village VARCHAR(180) NOT NULL,
  specific_location VARCHAR(255) DEFAULT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  public_title VARCHAR(120) DEFAULT NULL,
  public_description TEXT DEFAULT NULL,
  submitter_name VARCHAR(160) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  email VARCHAR(190) DEFAULT NULL,
  preferred_contact_method VARCHAR(20) DEFAULT NULL,
  consent_publication TINYINT(1) NOT NULL DEFAULT 0,
  public_response TEXT DEFAULT NULL,
  status ENUM('pending_review','under_review','more_info_requested','approved','published','rejected') NOT NULL DEFAULT 'pending_review',
  ip_hash CHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME DEFAULT NULL,
  INDEX idx_pv_status_created (status, created_at),
  INDEX idx_pv_category_location (category, province, district),
  INDEX idx_pv_village (village)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS public_voice_media (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT UNSIGNED NOT NULL,
  media_type ENUM('PHOTO','AUDIO','VIDEO','AI_IMAGE') NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  duration_seconds DECIMAL(8,2) DEFAULT NULL,
  is_ai_generated TINYINT(1) NOT NULL DEFAULT 0,
  ai_description VARCHAR(500) DEFAULT NULL,
  is_approved_for_publication TINYINT(1) NOT NULL DEFAULT 0,
  display_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pv_media_submission FOREIGN KEY (submission_id) REFERENCES public_voice_submissions(id) ON DELETE CASCADE,
  INDEX idx_pv_media_submission (submission_id, media_type, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS public_voice_reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT UNSIGNED NOT NULL,
  admin_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(40) NOT NULL,
  previous_status VARCHAR(30) DEFAULT NULL,
  new_status VARCHAR(30) DEFAULT NULL,
  internal_note TEXT DEFAULT NULL,
  public_response TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pv_review_submission FOREIGN KEY (submission_id) REFERENCES public_voice_submissions(id) ON DELETE CASCADE,
  INDEX idx_pv_review_submission (submission_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
