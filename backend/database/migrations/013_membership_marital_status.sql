-- Store the applicant's required marital status selection.
ALTER TABLE party_members
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) NULL AFTER gender;
