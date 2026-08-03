-- Checklist des pièces attendues sur un dossier d'étude (S5).
-- Seed minimal BDP + CPS à la création ; slots dynamiques + propositions CPS.

CREATE TABLE IF NOT EXISTS dossier_piece_attendue (
    id                    UUID PRIMARY KEY,
    tenant_id             UUID NOT NULL,
    dossier_etude_id      UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    type                  VARCHAR(40) NOT NULL,
    libelle               VARCHAR(255) NOT NULL,
    obligatoire           BOOLEAN NOT NULL DEFAULT TRUE,
    source                VARCHAR(20) NOT NULL,
    dossier_document_id   UUID REFERENCES dossier_documents(id) ON DELETE SET NULL,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100),
    created_at            TIMESTAMPTZ NOT NULL,
    updated_at            TIMESTAMPTZ NOT NULL,
    CONSTRAINT dossier_piece_attendue_source_chk CHECK (source IN ('IA', 'MANUEL'))
);

CREATE INDEX IF NOT EXISTS dossier_piece_attendue_dossier_idx
    ON dossier_piece_attendue (tenant_id, dossier_etude_id, created_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS dossier_piece_attendue_type_uidx
    ON dossier_piece_attendue (tenant_id, dossier_etude_id, type)
    WHERE type IN ('BORDEREAU', 'CPS');
