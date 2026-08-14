-- L13 : budget NON_VENTILE + traçabilité non fiable
ALTER TABLE budget_lignes
    ADD COLUMN IF NOT EXISTS non_fiable BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS source_origine VARCHAR(30);
