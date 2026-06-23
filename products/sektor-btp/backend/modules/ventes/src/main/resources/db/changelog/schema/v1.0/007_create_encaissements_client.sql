CREATE TABLE IF NOT EXISTS encaissements_client (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    facture_id          UUID NOT NULL REFERENCES factures_client(id) ON DELETE CASCADE,
    date_encaissement   DATE NOT NULL,
    mode_paiement       VARCHAR(30) NOT NULL,
    montant_ttc         NUMERIC(18, 4) NOT NULL,
    reference           VARCHAR(100),
    banque_id           VARCHAR(100),
    banque              VARCHAR(255),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encaissements_client_facture
    ON encaissements_client(facture_id);

CREATE INDEX IF NOT EXISTS idx_encaissements_client_tenant_facture
    ON encaissements_client(tenant_id, facture_id);
