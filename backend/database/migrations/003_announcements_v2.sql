-- Migration 003: advanced announcements — breaking flag, event dates, expiry, attachment metadata.
ALTER TABLE announcements
  ADD COLUMN is_breaking TINYINT(1) NOT NULL DEFAULT 0 AFTER is_important,
  ADD COLUMN press_meeting_date DATE DEFAULT NULL AFTER expires_at,
  ADD COLUMN notice_date DATE DEFAULT NULL AFTER press_meeting_date,
  ADD COLUMN event_date DATE DEFAULT NULL AFTER notice_date,
  ADD COLUMN scheduled_at DATETIME DEFAULT NULL AFTER published_at;

ALTER TABLE announcement_attachments
  ADD COLUMN mime_type VARCHAR(100) DEFAULT NULL AFTER file_type,
  ADD COLUMN file_size INT UNSIGNED DEFAULT NULL AFTER mime_type;

-- Map existing expires_at usage: expiry already exists; ensure index for archive sweep
ALTER TABLE announcements ADD INDEX idx_ann_expiry (status, expires_at);
