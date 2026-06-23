-- Allow polymorphic entity IDs as strings (ERP uses ch-001, sit-001, etc.)
ALTER TABLE record_attachments
    ALTER COLUMN entity_id TYPE VARCHAR(100) USING entity_id::text;
