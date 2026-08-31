-- SEKTOR-280 — Journal d'envoi mail (AC-8, AC-9, AC-10).
-- Unique destinataire déjà journalisé. Mode B : no-op Brevo OK, le journal est la preuve.

CREATE TABLE IF NOT EXISTS consultation_achat_envois (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    consultation_id     UUID NOT NULL REFERENCES consultations_achat(id) ON DELETE CASCADE,
    destinataire_id     UUID NOT NULL REFERENCES consultation_achat_destinataires(id) ON DELETE CASCADE,
    email               VARCHAR(255) NOT NULL,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_consultation_achat_envoi_destinataire UNIQUE (destinataire_id)
);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_envois_consultation
    ON consultation_achat_envois (consultation_id, sent_at);
