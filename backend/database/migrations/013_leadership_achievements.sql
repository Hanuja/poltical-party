-- Migration 013: achievements in each localized leadership profile.
ALTER TABLE leadership_translations
  ADD COLUMN achievements TEXT DEFAULT NULL AFTER previous_positions;
