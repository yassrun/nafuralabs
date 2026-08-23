-- SEKTOR-106 — Item tenant 1–1 avec cle_stable Sektor.
-- Lab clean : backfill slug, unique (tenant_id, cle_stable), jamais d'orphelin.
-- Ligne fournisseur pointe cette identité (pas une 3ᵉ fiche article).

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS cle_stable VARCHAR(120);

UPDATE items
SET cle_stable = lower(regexp_replace(
        trim(both '-' from regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g')),
        '-{2,}',
        '-',
        'g'))
WHERE cle_stable IS NULL OR btrim(cle_stable) = '';

UPDATE items i
SET cle_stable = left(i.cle_stable || '-' || replace(i.id::text, '-', ''), 120)
WHERE i.id IN (
    SELECT id FROM (
        SELECT id,
               row_number() OVER (PARTITION BY tenant_id, cle_stable ORDER BY created_at, id) AS rn
        FROM items
        WHERE cle_stable IS NOT NULL
    ) d
    WHERE rn > 1
);

UPDATE items
SET cle_stable = left('item-' || replace(id::text, '-', ''), 120)
WHERE cle_stable IS NULL OR btrim(cle_stable) = '';

ALTER TABLE items
    ALTER COLUMN cle_stable SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_tenant_cle_stable
    ON items (tenant_id, cle_stable);

CREATE INDEX IF NOT EXISTS idx_items_cle_stable
    ON items (cle_stable);

ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS cle_stable VARCHAR(120);

UPDATE catalogue_fournisseur_lignes l
SET cle_stable = i.cle_stable
FROM items i
WHERE l.article_id = i.id
  AND (l.cle_stable IS NULL OR btrim(l.cle_stable) = '');

UPDATE catalogue_fournisseur_lignes
SET cle_stable = lower(regexp_replace(
        trim(both '-' from regexp_replace(trim(designation), '[^a-zA-Z0-9]+', '-', 'g')),
        '-{2,}',
        '-',
        'g'))
WHERE cle_stable IS NULL OR btrim(cle_stable) = '';

UPDATE catalogue_fournisseur_lignes
SET cle_stable = left('cfl-' || replace(id::text, '-', ''), 120)
WHERE cle_stable IS NULL OR btrim(cle_stable) = '';

ALTER TABLE catalogue_fournisseur_lignes
    ALTER COLUMN cle_stable SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cfl_tenant_cle_stable
    ON catalogue_fournisseur_lignes (tenant_id, cle_stable);

CREATE OR REPLACE FUNCTION cfl_fill_cle_stable() RETURNS trigger AS $$
DECLARE
    identite VARCHAR(120);
BEGIN
    SELECT i.cle_stable INTO identite FROM items i WHERE i.id = NEW.article_id;
    IF identite IS NULL OR btrim(identite) = '' THEN
        RAISE EXCEPTION 'item.identite.introuvable';
    END IF;
    NEW.cle_stable := identite;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cfl_fill_cle_stable ON catalogue_fournisseur_lignes;
CREATE TRIGGER trg_cfl_fill_cle_stable
    BEFORE INSERT OR UPDATE OF article_id ON catalogue_fournisseur_lignes
    FOR EACH ROW
    EXECUTE PROCEDURE cfl_fill_cle_stable();
