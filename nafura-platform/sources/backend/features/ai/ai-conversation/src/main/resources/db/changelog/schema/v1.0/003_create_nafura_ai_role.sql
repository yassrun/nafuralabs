-- Align AI SQL reader role with Vault field ai_user (nafura_ai)
-- liquibase formatted sql

-- changeset nafura:ai-conversation-003-create-nafura-ai-role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nafura_ai') THEN
    CREATE ROLE nafura_ai WITH LOGIN PASSWORD 'changeme';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO nafura_ai;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nafura_ai;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO nafura_ai;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM nafura_ai;
