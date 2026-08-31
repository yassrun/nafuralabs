-- SEKTOR-279 — Consultation = 1 panier + N destinataires (contact mail).
-- Lab clean : drop fournisseur_id unique. Plus DEMANDE comme vérité à la création.

DROP INDEX IF EXISTS idx_consultations_achat_fournisseur;

ALTER TABLE consultations_achat
    DROP COLUMN IF EXISTS fournisseur_id;

ALTER TABLE consultations_achat
    ALTER COLUMN statut SET DEFAULT 'PREPARATION';

UPDATE consultations_achat
    SET statut = 'PREPARATION'
    WHERE statut = 'DEMANDE';

CREATE TABLE IF NOT EXISTS consultation_achat_destinataires (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    consultation_id     UUID NOT NULL REFERENCES consultations_achat(id) ON DELETE CASCADE,
    fournisseur_id      UUID NOT NULL REFERENCES partners(id),
    contact_id          UUID NOT NULL REFERENCES partner_contacts(id),
    statut              VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_consultation_achat_destinataire UNIQUE (consultation_id, fournisseur_id)
);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_destinataires_consultation
    ON consultation_achat_destinataires (consultation_id, created_at);
