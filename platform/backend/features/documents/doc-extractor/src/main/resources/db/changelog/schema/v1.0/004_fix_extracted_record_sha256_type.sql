-- Liquibase: doc-extractor schema v1.0 (004). Formerly Flyway V3_0_3.
-- Fix sha256 column type from CHAR(64) to VARCHAR(64) to match Hibernate expectations
ALTER TABLE extracted_record ALTER COLUMN sha256 TYPE VARCHAR(64);
