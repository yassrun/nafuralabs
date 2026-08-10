-- L14 : étude mémorise l'édition catalogue utilisée (VARCHAR, pas de FK)
ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS catalog_edition_code VARCHAR(40);

COMMENT ON COLUMN dossiers_etude.catalog_edition_code IS
    'L14 — code édition catalogue (ex. 2026.1), chaîne stable sans FK';
