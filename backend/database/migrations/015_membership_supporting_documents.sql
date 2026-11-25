-- Optional supporting PDF files submitted with a scanned membership application.
ALTER TABLE party_members
  ADD COLUMN IF NOT EXISTS supporting_documents LONGTEXT NULL AFTER pdf_path;
