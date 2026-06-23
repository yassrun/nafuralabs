-- Liquibase: doc-extractor schema v1.0 (005). Formerly Flyway V4_0_1.
-- =============================================================================
-- Doc-extractor module: Add source file metadata to extracted_record
-- =============================================================================

ALTER TABLE extracted_record
  ADD COLUMN IF NOT EXISTS source_file_name VARCHAR(512),
  ADD COLUMN IF NOT EXISTS source_mime_type VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_file_size_bytes BIGINT;

-- Backfill from doc-manager.document when linkage exists
UPDATE extracted_record er
SET
  source_file_name = COALESCE(d.file_name, er.record_id),
  source_mime_type = COALESCE(d.mime_type, 'application/octet-stream'),
  source_file_size_bytes = COALESCE(d.file_size_bytes, 0)
FROM document d
WHERE er.stored_document_id IS NOT NULL
  AND d.id = er.stored_document_id
  AND (er.source_file_name IS NULL OR er.source_mime_type IS NULL OR er.source_file_size_bytes IS NULL);

-- Backfill remaining rows with safe defaults
UPDATE extracted_record
SET
  source_file_name = COALESCE(source_file_name, record_id),
  source_mime_type = COALESCE(source_mime_type, 'application/octet-stream'),
  source_file_size_bytes = COALESCE(source_file_size_bytes, 0)
WHERE source_file_name IS NULL
   OR source_mime_type IS NULL
   OR source_file_size_bytes IS NULL;

