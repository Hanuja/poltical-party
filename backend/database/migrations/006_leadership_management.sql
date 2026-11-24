-- Migration 006: Leadership management (admin auto-draft, Draft/Published/Inactive workflow).
-- Extends the existing `leadership` + `leadership_translations` tables.

-- 1. Status workflow: draft -> published -> inactive. Legacy 'unpublished' maps to 'inactive'.
ALTER TABLE leadership
  MODIFY COLUMN status ENUM('draft','published','unpublished','inactive') NOT NULL DEFAULT 'draft';
UPDATE leadership SET status = 'inactive' WHERE status = 'unpublished';
ALTER TABLE leadership
  MODIFY COLUMN status ENUM('draft','published','inactive') NOT NULL DEFAULT 'draft';

-- 2. New columns: client-generated profile key (prevents duplicate drafts), province,
--    audit + soft delete.
ALTER TABLE leadership
  ADD COLUMN profile_key   CHAR(36)     DEFAULT NULL AFTER id,
  ADD COLUMN province      VARCHAR(100) DEFAULT NULL AFTER district,
  ADD COLUMN published_at  DATETIME     DEFAULT NULL AFTER status,
  ADD COLUMN created_by    INT UNSIGNED DEFAULT NULL AFTER published_at,
  ADD COLUMN updated_by    INT UNSIGNED DEFAULT NULL AFTER created_by,
  ADD COLUMN auto_saved_at DATETIME     DEFAULT NULL AFTER updated_at,
  ADD COLUMN deleted_at    DATETIME     DEFAULT NULL AFTER auto_saved_at;

UPDATE leadership SET profile_key = UUID() WHERE profile_key IS NULL;

ALTER TABLE leadership
  ADD UNIQUE KEY uq_lead_profile_key (profile_key),
  ADD INDEX idx_lead_status (status, deleted_at);

-- 3. Drafts may be saved before a name/position exists in every language.
ALTER TABLE leadership_translations
  MODIFY COLUMN name     VARCHAR(150) DEFAULT NULL,
  MODIFY COLUMN position VARCHAR(150) DEFAULT NULL;
