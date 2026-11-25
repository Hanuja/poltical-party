ALTER TABLE events
  ADD COLUMN contact_person VARCHAR(150) DEFAULT NULL AFTER city,
  ADD COLUMN contact_phone VARCHAR(30) DEFAULT NULL AFTER contact_person;

ALTER TABLE event_translations
  ADD COLUMN short_description VARCHAR(500) DEFAULT NULL AFTER slug;
