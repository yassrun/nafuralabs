-- SEKTOR-135 — Devis reçu = import magique confirmé (lignes persistées).
-- Lab clean : tables neuves. Pas consultations_etudes. Fichier sans extraction ≠ devis.

CREATE TABLE IF NOT EXISTS consultation_achat_devis (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    consultation_id     UUID NOT NULL REFERENCES consultations_achat(id) ON DELETE CASCADE,
    fichier_nom         VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_devis_consultation
    ON consultation_achat_devis (consultation_id, created_at);

CREATE TABLE IF NOT EXISTS consultation_achat_devis_ligne (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devis_id            UUID NOT NULL REFERENCES consultation_achat_devis(id) ON DELETE CASCADE,
    identite            VARCHAR(120),
    libelle             VARCHAR(500) NOT NULL,
    quantite            NUMERIC(18, 4),
    unite               VARCHAR(30),
    prix_unitaire       NUMERIC(18, 4),
    ordre               INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_devis_ligne_devis
    ON consultation_achat_devis_ligne (devis_id, ordre);
