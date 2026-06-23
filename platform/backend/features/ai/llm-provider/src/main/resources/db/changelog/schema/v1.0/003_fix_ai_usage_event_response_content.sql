-- Ensure extracted JSON / long LLM responses fit in audit log (Hibernate ddl-auto may have created VARCHAR(255)).
ALTER TABLE ai_usage_event
    ALTER COLUMN response_content TYPE TEXT;
