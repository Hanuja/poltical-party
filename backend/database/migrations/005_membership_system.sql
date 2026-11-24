-- 005: Party membership, verification, targeting system
CREATE TABLE IF NOT EXISTS provinces (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  name_ta VARCHAR(160) NULL,
  name_si VARCHAR(160) NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS districts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  province_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  name_ta VARCHAR(160) NULL,
  name_si VARCHAR(160) NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE,
  INDEX idx_province (province_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS party_branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  district_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  name_ta VARCHAR(200) NULL,
  name_si VARCHAR(200) NULL,
  code VARCHAR(40) NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
  INDEX idx_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS party_members (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  membership_id VARCHAR(30) NOT NULL UNIQUE,
  user_id INT UNSIGNED NULL,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  province_id INT UNSIGNED NOT NULL,
  district_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NULL,
  id_document_path VARCHAR(255) NULL,
  photo_path VARCHAR(255) NULL,
  status ENUM('pending','under_review','verified','rejected','suspended','expired') NOT NULL DEFAULT 'pending',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME NULL,
  expires_at DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (branch_id) REFERENCES party_branches(id),
  INDEX idx_status (status),
  INDEX idx_district (district_id),
  INDEX idx_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS membership_verification_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  member_id INT UNSIGNED NOT NULL,
  reviewer_id INT UNSIGNED NULL,
  reviewer_role VARCHAR(60) NULL,
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  notes TEXT NULL,
  decision_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES party_members(id) ON DELETE CASCADE,
  INDEX idx_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcement_targets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT UNSIGNED NOT NULL,
  target_type ENUM('province','districts','branches','all_members') NOT NULL DEFAULT 'all_members',
  province_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  INDEX idx_announcement (announcement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcement_target_districts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_id INT UNSIGNED NOT NULL,
  district_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (target_id) REFERENCES announcement_targets(id) ON DELETE CASCADE,
  FOREIGN KEY (district_id) REFERENCES districts(id),
  UNIQUE KEY uq_target_district (target_id, district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcement_target_branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (target_id) REFERENCES announcement_targets(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES party_branches(id),
  UNIQUE KEY uq_target_branch (target_id, branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcement_reads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT UNSIGNED NOT NULL,
  member_id INT UNSIGNED NOT NULL,
  first_read_at DATETIME NOT NULL,
  read_count INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_read (announcement_id, member_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES party_members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcement_notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id INT UNSIGNED NOT NULL,
  member_id INT UNSIGNED NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notif (announcement_id, member_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES party_members(id) ON DELETE CASCADE,
  INDEX idx_member_unread (member_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
