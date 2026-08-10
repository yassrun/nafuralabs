-- L15 — item_match (rapprochement tenant ↔ catalogue)
-- Table TENANT (tenant_id OK). catalog_cle = VARCHAR, pas de FK vers catalog_*.

CREATE TABLE item_match (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    source_type     VARCHAR(40) NOT NULL,
    source_id       UUID NOT NULL,
    catalog_cle     VARCHAR(120) NOT NULL,
    methode         VARCHAR(20) NOT NULL,
    confiance       NUMERIC(5, 4) NOT NULL,
    statut          VARCHAR(20) NOT NULL DEFAULT 'SUGGERE',
    valide_par      VARCHAR(120),
    valide_le       TIMESTAMPTZ,
    model_version   VARCHAR(80),
    libelle_source  VARCHAR(300),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_item_match_source CHECK (source_type IN (
        'TENANT_ITEM', 'TENANT_OUVRAGE', 'SUPPLIER_LINE', 'COMPOSANT_LIBRE'
    )),
    CONSTRAINT chk_item_match_methode CHECK (methode IN (
        'EXACT', 'REGLE', 'TRIGRAM', 'VECTEUR', 'LLM', 'MANUEL'
    )),
    CONSTRAINT chk_item_match_statut CHECK (statut IN ('SUGGERE', 'VALIDE', 'REJETE'))
);

CREATE INDEX idx_item_match_source
    ON item_match (tenant_id, source_type, source_id, statut);

CREATE INDEX idx_item_match_catalog
    ON item_match (catalog_cle, statut);

CREATE UNIQUE INDEX uq_item_match_actif
    ON item_match (tenant_id, source_type, source_id, catalog_cle)
    WHERE statut IN ('SUGGERE', 'VALIDE');

COMMENT ON TABLE item_match IS 'L15 — rapprochement déterministe ; pas de FK catalogue';
