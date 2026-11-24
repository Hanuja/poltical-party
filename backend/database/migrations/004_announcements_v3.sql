-- Migration 004: category-specific announcement fields + auto_draft status.
ALTER TABLE announcements
  MODIFY COLUMN status ENUM('auto_draft','draft','scheduled','published','archived') NOT NULL DEFAULT 'draft',
  ADD COLUMN announcement_code VARCHAR(50) DEFAULT NULL AFTER id,
  ADD COLUMN reference_number VARCHAR(100) DEFAULT NULL AFTER image_alt,
  ADD COLUMN announcement_type VARCHAR(50) DEFAULT NULL AFTER reference_number,
  ADD COLUMN event_type VARCHAR(50) DEFAULT NULL AFTER announcement_type,
  ADD COLUMN spokesperson VARCHAR(150) DEFAULT NULL AFTER event_type,
  ADD COLUMN meeting_location VARCHAR(255) DEFAULT NULL AFTER spokesperson,
  ADD COLUMN notice_category VARCHAR(50) DEFAULT NULL AFTER meeting_location,
  ADD COLUMN district VARCHAR(100) DEFAULT NULL AFTER notice_category,
  ADD COLUMN ds_division VARCHAR(100) DEFAULT NULL AFTER district,
  ADD COLUMN gn_division VARCHAR(100) DEFAULT NULL AFTER ds_division,
  ADD COLUMN contact_person VARCHAR(150) DEFAULT NULL AFTER gn_division,
  ADD COLUMN contact_phone VARCHAR(30) DEFAULT NULL AFTER contact_person,
  ADD COLUMN contact_email VARCHAR(150) DEFAULT NULL AFTER contact_phone,
  ADD COLUMN video_url VARCHAR(500) DEFAULT NULL AFTER cover_image,
  ADD COLUMN pdf_path VARCHAR(500) DEFAULT NULL AFTER video_url,
  ADD COLUMN auto_saved_at DATETIME DEFAULT NULL AFTER updated_at,
  ADD COLUMN breaking_priority INT DEFAULT 0 AFTER is_breaking,
  ADD UNIQUE KEY uq_ann_code (announcement_code);

ALTER TABLE announcement_attachments
  ADD COLUMN title VARCHAR(255) DEFAULT NULL AFTER file_name,
  ADD COLUMN description TEXT DEFAULT NULL AFTER title;
