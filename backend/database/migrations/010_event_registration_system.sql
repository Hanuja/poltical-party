-- ============================================================
-- 010 — Event registration, QR tickets & check-in
-- For a FRESH database (right after political_party_db.sql).
-- On an existing database run backend/database/migrate_registrations.php instead:
-- it checks what is already there and only adds what is missing.
-- ============================================================

ALTER TABLE event_registrations
  ADD COLUMN ticket_code   VARCHAR(32)  NULL AFTER event_id,
  ADD COLUMN organization  VARCHAR(255) NULL AFTER phone,
  ADD COLUMN designation   VARCHAR(150) NULL AFTER organization,
  ADD COLUMN status        ENUM('registered','checked_in','cancelled') NOT NULL DEFAULT 'registered' AFTER designation,
  ADD COLUMN checked_in_at DATETIME     NULL AFTER status,
  ADD COLUMN checked_in_by VARCHAR(150) NULL AFTER checked_in_at,
  ADD COLUMN updated_at    TIMESTAMP    NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD UNIQUE KEY uq_reg_ticket (ticket_code),
  ADD INDEX idx_reg_status (status),
  ADD INDEX idx_reg_event_st (event_id, status),
  ADD INDEX idx_reg_created (created_at),
  ADD INDEX idx_reg_checkin (checked_in_at);
-- (uq_reg_event_email (event_id, email) already exists in the base schema: one registration per email per event)

CREATE TABLE IF NOT EXISTS activity_history (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_id INT UNSIGNED NULL,
  event_id        INT UNSIGNED NULL,
  ticket_code     VARCHAR(32)  NULL,
  attendee_name   VARCHAR(150) NULL,            -- snapshot, so the log still reads correctly after edits
  action_type     VARCHAR(40)  NOT NULL,        -- REGISTERED | QR_SCANNED | DETAILS_UPDATED | TICKET_CANCELLED
  details         VARCHAR(500) NULL,
  performed_by    VARCHAR(150) NULL,
  ip_address      VARCHAR(45)  NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ah_created (created_at),
  INDEX idx_ah_action (action_type, created_at),
  INDEX idx_ah_ticket (ticket_code),
  INDEX idx_ah_reg (registration_id),
  INDEX idx_ah_event (event_id),
  CONSTRAINT fk_ah_reg   FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE SET NULL,
  CONSTRAINT fk_ah_event FOREIGN KEY (event_id)        REFERENCES events(id)              ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
