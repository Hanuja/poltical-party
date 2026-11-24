-- Migration 007: optional per-language "Key Responsibilities" for leader profiles
-- (one responsibility per line). Shown as an expandable list on the public Our People page.
ALTER TABLE leadership_translations
  ADD COLUMN responsibilities TEXT DEFAULT NULL AFTER bio;
