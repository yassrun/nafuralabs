-- Create read-only role for AI SQL queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nafura_ai_reader') THEN
    CREATE ROLE nafura_ai_reader WITH LOGIN PASSWORD 'changeme';
  END IF;
END $$;

-- Grant SELECT on all existing tables in public schema
GRANT USAGE ON SCHEMA public TO nafura_ai_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nafura_ai_reader;

-- Grant SELECT on future tables automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO nafura_ai_reader;

-- Explicitly deny everything else
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM nafura_ai_reader;
