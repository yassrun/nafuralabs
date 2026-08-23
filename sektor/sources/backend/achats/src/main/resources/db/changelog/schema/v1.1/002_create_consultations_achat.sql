-- SEKTOR-134 — Consultation = objet Achats (1 fournisseur + panier cle_stable + lien étude optionnel).
-- Lab clean : table neuve. Pas DA, pas AO, pas consultations_etudes.

CREATE TABLE IF NOT EXISTS consultations_achat (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    numero              VARCHAR(50) NOT NULL,
    fournisseur_id      UUID NOT NULL REFERENCES partners(id),
    dossier_etude_id    UUID,
    statut              VARCHAR(20) NOT NULL DEFAULT 'DEMANDE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_consultations_achat_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_consultations_achat_tenant
    ON consultations_achat (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_achat_fournisseur
    ON consultations_achat (tenant_id, fournisseur_id);

CREATE INDEX IF NOT EXISTS idx_consultations_achat_dossier
    ON consultations_achat (tenant_id, dossier_etude_id);

CREATE TABLE IF NOT EXISTS consultation_achat_panier (
    consultation_id     UUID NOT NULL REFERENCES consultations_achat(id) ON DELETE CASCADE,
    cle_stable          VARCHAR(120) NOT NULL,
    CONSTRAINT uq_consultation_achat_panier UNIQUE (consultation_id, cle_stable)
);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_panier_cle
    ON consultation_achat_panier (cle_stable);
