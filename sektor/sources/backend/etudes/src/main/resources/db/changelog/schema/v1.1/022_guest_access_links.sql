-- Liens d'accès invité (client / fournisseur) — token hashé, révocable, expirant.

CREATE TABLE IF NOT EXISTS guest_access_links (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_etude_id    UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    email               VARCHAR(255) NOT NULL,
    purpose             VARCHAR(40) NOT NULL,
    token_hash          VARCHAR(64) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_by          VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ,
    CONSTRAINT chk_guest_access_purpose CHECK (
        purpose IN ('CLIENT_VIEW', 'FOURNISSEUR_UPLOAD')
    ),
    CONSTRAINT uq_guest_access_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_guest_access_dossier
    ON guest_access_links (tenant_id, dossier_etude_id);
