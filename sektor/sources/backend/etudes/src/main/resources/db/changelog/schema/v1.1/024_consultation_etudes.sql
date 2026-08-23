-- SEKTOR-109 — Consultation études + devis reçu (DECISIONS-PRODUIT 20/08).
-- Accrochée au dossier. Un fournisseur = au plus un devis qui compte.
-- Un PDF orphelin DEVIS_FOURNISSEUR n'est pas un devis consultation.

CREATE TABLE IF NOT EXISTS consultations_etudes (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_etude_id    UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    statut              VARCHAR(20) NOT NULL DEFAULT 'OUVERTE',
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_consultation_etude_dossier UNIQUE (tenant_id, dossier_etude_id),
    CONSTRAINT chk_consultation_etude_statut CHECK (statut IN ('OUVERTE', 'CLOTUREE'))
);

CREATE INDEX IF NOT EXISTS idx_consultation_etude_dossier
    ON consultations_etudes (tenant_id, dossier_etude_id);

CREATE TABLE IF NOT EXISTS consultation_etude_paquet (
    consultation_id UUID NOT NULL REFERENCES consultations_etudes(id) ON DELETE CASCADE,
    cle_stable      VARCHAR(120) NOT NULL,
    PRIMARY KEY (consultation_id, cle_stable)
);

CREATE TABLE IF NOT EXISTS consultation_etude_invites (
    consultation_id UUID NOT NULL REFERENCES consultations_etudes(id) ON DELETE CASCADE,
    partenaire_id   UUID NOT NULL,
    PRIMARY KEY (consultation_id, partenaire_id)
);

CREATE TABLE IF NOT EXISTS devis_consultation (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    consultation_id     UUID NOT NULL REFERENCES consultations_etudes(id) ON DELETE CASCADE,
    partenaire_id       UUID NOT NULL,
    document_id         UUID,
    recu_at             TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_devis_consultation_fournisseur UNIQUE (consultation_id, partenaire_id)
);

CREATE INDEX IF NOT EXISTS idx_devis_consultation_consult
    ON devis_consultation (tenant_id, consultation_id);

CREATE TABLE IF NOT EXISTS devis_consultation_lignes (
    id                      UUID PRIMARY KEY,
    devis_consultation_id   UUID NOT NULL REFERENCES devis_consultation(id) ON DELETE CASCADE,
    tenant_id               UUID NOT NULL,
    cle_stable              VARCHAR(120) NOT NULL,
    designation             VARCHAR(500),
    quantite                NUMERIC(18, 4),
    unite                   VARCHAR(30),
    prix_unitaire           NUMERIC(18, 4) NOT NULL,
    item_id                 UUID,
    ordre                   INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_devis_consultation_lignes_cle
    ON devis_consultation_lignes (tenant_id, cle_stable);

CREATE TABLE IF NOT EXISTS consultation_identites_couvertes (
    consultation_id         UUID NOT NULL REFERENCES consultations_etudes(id) ON DELETE CASCADE,
    cle_stable              VARCHAR(120) NOT NULL,
    devis_consultation_id   UUID REFERENCES devis_consultation(id) ON DELETE SET NULL,
    prix_unitaire           NUMERIC(18, 4) NOT NULL,
    PRIMARY KEY (consultation_id, cle_stable)
);
