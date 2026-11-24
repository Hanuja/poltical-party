-- ============================================================
-- 011 — Registration form v2: NIC number, special requirements, reg method
-- Adds the fields required by the split-layout registration popup.
-- Safe to run on an existing database (columns/indexes are only added
-- when missing). Apply with backend/database/migrate_registration_v2.php
-- or import directly into MySQL.
-- ============================================================

ALTER TABLE event_registrations
  ADD COLUMN nic_number          VARCHAR(30)  NULL AFTER phone,
  ADD COLUMN special_requirements TEXT        NULL AFTER designation,
  ADD COLUMN reg_method          ENUM('website','qr','admin') NOT NULL DEFAULT 'website' AFTER special_requirements,
  ADD INDEX idx_reg_nic (event_id, nic_number);

-- One active registration per NIC per event. MySQL UNIQUE indexes allow
-- multiple NULLs, so legacy rows without a NIC are unaffected.
ALTER TABLE event_registrations
  ADD UNIQUE KEY uq_reg_event_nic (event_id, nic_number);
