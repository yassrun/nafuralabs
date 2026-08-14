-- L9 : marqueur « à compléter » sur articles créés allégés depuis le rattrapage étude.

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS a_completer BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_items_a_completer
    ON items (tenant_id, a_completer)
    WHERE a_completer = true;
