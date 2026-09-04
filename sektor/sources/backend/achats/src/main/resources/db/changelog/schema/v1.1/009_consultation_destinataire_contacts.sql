-- Destinataire = 1 fournisseur + N PartnerContact (To + CC).
-- contact_id du destinataire reste le premier (To). Lab : copy existants.

CREATE TABLE IF NOT EXISTS consultation_achat_destinataire_contacts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    destinataire_id     UUID NOT NULL REFERENCES consultation_achat_destinataires(id) ON DELETE CASCADE,
    contact_id          UUID NOT NULL REFERENCES partner_contacts(id),
    position            INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_consultation_achat_destinataire_contact UNIQUE (destinataire_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_consultation_achat_destinataire_contacts_dest
    ON consultation_achat_destinataire_contacts (destinataire_id, position);

INSERT INTO consultation_achat_destinataire_contacts (
        tenant_id, destinataire_id, contact_id, position, created_at
    )
SELECT d.tenant_id, d.id, d.contact_id, 0, now()
FROM consultation_achat_destinataires d
WHERE NOT EXISTS (
    SELECT 1
    FROM consultation_achat_destinataire_contacts c
    WHERE c.destinataire_id = d.id
);
