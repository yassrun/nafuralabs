-- L12 référentiel-catalogue : index capitalisation / corpus
-- Colonnes ouvrage déjà en 017_l10. Interdit : L14 catalogue, table versions.

CREATE INDEX IF NOT EXISTS idx_ouvrages_tenant_source_etude
    ON ouvrages (tenant_id, source_etude_id)
    WHERE source_etude_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ouvrages_tenant_catalog_cle
    ON ouvrages (tenant_id, catalog_cle_stable)
    WHERE catalog_cle_stable IS NOT NULL;
