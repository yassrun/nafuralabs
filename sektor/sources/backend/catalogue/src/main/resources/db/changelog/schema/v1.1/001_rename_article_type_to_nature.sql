-- Classification Lot 1: article_type → nature + normalisation legacy.
-- Voir docs/epics/classification-article/00-PLAN.md §4 Lot 1 / §5.1

UPDATE items
SET article_type = 'MATIERE'
WHERE article_type IS NULL
   OR UPPER(TRIM(article_type)) = 'MATERIAU';

UPDATE items
SET article_type = UPPER(TRIM(article_type))
WHERE article_type IS NOT NULL;

ALTER TABLE items RENAME COLUMN article_type TO nature;

DROP INDEX IF EXISTS idx_items_article_type;

CREATE INDEX IF NOT EXISTS idx_items_nature ON items (tenant_id, nature);
