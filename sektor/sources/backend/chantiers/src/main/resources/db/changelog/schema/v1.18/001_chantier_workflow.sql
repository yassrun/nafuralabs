--liquibase formatted sql
--changeset sektor:chantiers-v1.18-workflow
ALTER TABLE chantiers ADD COLUMN workflow_data TEXT;
ALTER TABLE chantiers ADD COLUMN workflow_revision BIGINT NOT NULL DEFAULT 0;
