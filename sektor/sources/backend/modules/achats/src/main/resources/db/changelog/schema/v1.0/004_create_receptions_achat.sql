CREATE TABLE IF NOT EXISTS receptions_achat (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    bon_commande_achat_id   UUID NOT NULL REFERENCES bons_commande_achat(id) ON DELETE CASCADE,
    numero                  VARCHAR(50) NOT NULL,
    date_reception          DATE NOT NULL,
    bl_numero               VARCHAR(100),
    status                  VARCHAR(30) NOT NULL DEFAULT 'VALIDE',
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_receptions_achat_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_receptions_achat_bc
    ON receptions_achat(bon_commande_achat_id);

CREATE TABLE IF NOT EXISTS receptions_achat_lignes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    reception_achat_id      UUID NOT NULL REFERENCES receptions_achat(id) ON DELETE CASCADE,
    bon_commande_ligne_id   UUID NOT NULL REFERENCES bons_commande_achat_lignes(id),
    article_id              VARCHAR(100) NOT NULL,
    quantite_recue          NUMERIC(18, 4) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receptions_achat_lignes_reception
    ON receptions_achat_lignes(reception_achat_id);
