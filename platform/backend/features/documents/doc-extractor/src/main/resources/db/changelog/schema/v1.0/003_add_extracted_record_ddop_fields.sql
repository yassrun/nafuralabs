-- Liquibase: doc-extractor schema v1.0 (003). Formerly Flyway V3_0_2.
ALTER TABLE extracted_record 
ADD COLUMN IF NOT EXISTS sha256 VARCHAR(64),
ADD COLUMN IF NOT EXISTS phash BIGINT;

-- For existing records, we'll generate a random-ish unique sha256 to avoid constraint violations
UPDATE extracted_record SET sha256 = md5(id::text) || md5(record_id::text) WHERE sha256 IS NULL;

ALTER TABLE extracted_record ALTER COLUMN sha256 SET NOT NULL;
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'unique_tenant_sha256'
	) THEN
		ALTER TABLE extracted_record
			ADD CONSTRAINT unique_tenant_sha256 UNIQUE (tenant_id, sha256);
	END IF;
END $$;
