-- Migration 008: full leader profile details.
-- Per-language content (independent EN / TA / SI values, one row per language per profile):
ALTER TABLE leadership_translations
  ADD COLUMN short_bio            TEXT         DEFAULT NULL AFTER position,
  ADD COLUMN political_experience TEXT         DEFAULT NULL AFTER responsibilities,
  ADD COLUMN previous_positions   TEXT         DEFAULT NULL AFTER political_experience,
  ADD COLUMN office_branch        VARCHAR(255) DEFAULT NULL AFTER previous_positions;

-- Shared official information:
ALTER TABLE leadership
  ADD COLUMN appointment_date DATE DEFAULT NULL AFTER province;
