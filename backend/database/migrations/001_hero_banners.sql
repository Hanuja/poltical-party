-- Migration: hero banner management for the public homepage hero.
-- Admin frontend manages banners through /api/hero/ (admin methods require auth).

CREATE TABLE IF NOT EXISTS hero_banners (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  is_active       TINYINT(1)     NOT NULL DEFAULT 0,
  sort_order      INT            NOT NULL DEFAULT 0,
  image_desktop   VARCHAR(255)   NOT NULL,
  image_mobile    VARCHAR(255)   DEFAULT NULL,
  logo            VARCHAR(255)   DEFAULT NULL,
  cta1_url        VARCHAR(500)   DEFAULT NULL,
  cta2_url        VARCHAR(500)   DEFAULT NULL,
  created_by      INT UNSIGNED   DEFAULT NULL,
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hero_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hero_banner_translations (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  banner_id    INT UNSIGNED NOT NULL,
  language_code CHAR(2) NOT NULL,
  badge        VARCHAR(150) DEFAULT NULL,
  heading      VARCHAR(255) DEFAULT NULL,
  heading_highlight VARCHAR(150) DEFAULT NULL,
  description  TEXT DEFAULT NULL,
  cta1_label   VARCHAR(100) DEFAULT NULL,
  cta2_label   VARCHAR(100) DEFAULT NULL,
  UNIQUE KEY uq_hbt_banner_lang (banner_id, language_code),
  CONSTRAINT fk_hbt_banner FOREIGN KEY (banner_id) REFERENCES hero_banners(id) ON DELETE CASCADE,
  CONSTRAINT fk_hbt_lang FOREIGN KEY (language_code) REFERENCES languages(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed a default active banner (placeholder campaign imagery).
INSERT INTO hero_banners (is_active, sort_order, image_desktop, image_mobile, logo, cta1_url, cta2_url)
SELECT 0, 0, '/images/placeholder-hero-banner.svg', '/images/placeholder-hero-banner-mobile.svg', '/images/logo.svg', '/membership', '/manifesto'
WHERE NOT EXISTS (SELECT 1 FROM hero_banners);

INSERT INTO hero_banner_translations (banner_id, language_code, badge, heading, heading_highlight, description, cta1_label, cta2_label)
SELECT b.id, l.code,
  CASE l.code
    WHEN 'si' THEN 'නව දේශපාලන චලනයක්'
    WHEN 'ta' THEN 'புதிய அரசியல் இயக்கம்'
    ELSE 'A New Political Movement'
  END,
  CASE l.code
    WHEN 'si' THEN 'වඩා හොඳ අනාගතයක් අප සමඟ ආරම්භ වේ.'
    WHEN 'ta' THEN 'சிறந்த எதிர்காலம் நம்முடன் தொடங்குகிறது.'
    ELSE 'A Better Future Starts With Us.'
  END,
  CASE l.code
    WHEN 'si' THEN 'වඩා හොඳ අනාගතයක්'
    WHEN 'ta' THEN 'சிறந்த எதிர்காலம்'
    ELSE 'Better Future'
  END,
  CASE l.code
    WHEN 'si' THEN 'සමානතාව, සාධාරණත්වය සහ සියලු වැසියන්ට ගෞරවය — අපේ පක්ෂයේ දැක්ම විස්තර කෙරේ.'
    WHEN 'ta' THEN 'ஒவ்வொரு குடிமகனுக்கும் சமத்துவம், நீதி மற்றும் கண்ணியம் — இது எங்கள் கட்சி கட்டமைக்கப்பட்ட தத்துவம்.'
    ELSE 'Equality, justice and dignity for every citizen — this is the vision our party is built on.'
  END,
  CASE l.code
    WHEN 'si' THEN 'අපේ චලනයට එක්වෙන්න'
    WHEN 'ta' THEN 'எங்கள் இயக்கத்தில் சேருங்கள்'
    ELSE 'Join Our Movement'
  END,
  CASE l.code
    WHEN 'si' THEN 'අපේ ප්‍රකාශනය කියවන්න'
    WHEN 'ta' THEN 'எங்கள் அறிக்கை படிக்க'
    ELSE 'Read Our Manifesto'
  END
FROM hero_banners b
JOIN languages l ON l.code IN ('en','si','ta')
WHERE NOT EXISTS (SELECT 1 FROM hero_banner_translations t WHERE t.banner_id = b.id AND t.language_code = l.code);

UPDATE hero_banners SET is_active = 1
WHERE id = (SELECT id FROM (SELECT MIN(id) AS id FROM hero_banners) x);
