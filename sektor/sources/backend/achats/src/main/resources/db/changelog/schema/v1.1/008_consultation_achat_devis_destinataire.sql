-- SEKTOR-281 — Devis lié à un destinataire (AC-14, AC-15).
-- Lab clean : drop les devis orphelins, destinataire_id NOT NULL, un devis qui compte par dest.

DELETE FROM consultation_achat_devis_ligne;
DELETE FROM consultation_achat_devis;

ALTER TABLE consultation_achat_devis
    DROP COLUMN IF EXISTS destinataire_id;

ALTER TABLE consultation_achat_devis
    ADD COLUMN destinataire_id UUID NOT NULL
        REFERENCES consultation_achat_destinataires(id) ON DELETE CASCADE;

ALTER TABLE consultation_achat_devis
    DROP CONSTRAINT IF EXISTS uq_consultation_achat_devis_destinataire;

ALTER TABLE consultation_achat_devis
    ADD CONSTRAINT uq_consultation_achat_devis_destinataire UNIQUE (destinataire_id);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_devis_destinataire
    ON consultation_achat_devis (destinataire_id);
