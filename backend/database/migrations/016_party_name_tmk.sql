-- Migration 016: official party name — Thayaga Makkal Kazhagam (TMK).
-- Run once on the live database (phpMyAdmin → SQL, or mysql --default-character-set=utf8mb4). Re-runnable.
-- Replaces the old/placeholder party name stored in settings, including the names used in membership emails.
-- The membership ID prefix (mem_id_prefix) is NOT changed here: change it in Admin → Membership Settings
-- if new membership IDs should start with TMK. Existing membership IDs are never rewritten.
SET NAMES utf8mb4;

INSERT INTO settings (setting_key, setting_value, `group`) VALUES
  ('site_title',        'Thayaga Makkal Kazhagam (TMK)', 'general'),
  ('meta_title',        'Thayaga Makkal Kazhagam (TMK)', 'seo'),
  ('party_name_en',     'Thayaga Makkal Kazhagam (TMK)', 'branding'),
  ('party_name_ta',     'தாயக மக்கள் கழகம்',            'branding'),
  ('party_name_si',     'තායක ජනතා සංවිධානය',          'branding'),
  ('mem_party_name_en', 'Thayaga Makkal Kazhagam (TMK)', 'membership'),
  ('mem_party_name_ta', 'தாயக மக்கள் கழகம்',            'membership'),
  ('mem_party_name_si', 'තායක ජනතා සංවිධානය',          'membership')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
