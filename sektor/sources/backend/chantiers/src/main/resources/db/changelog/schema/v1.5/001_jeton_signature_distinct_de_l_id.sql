-- AC-19 — le jeton du lien de signature cesse d'être l'id de l'attachement.
--
-- Le jeton brut n'est jamais stocké : seul son hash SHA-256 l'est, comme guest_access_links
-- côté études. Pas de tenant_id en clé de recherche : au moment de résoudre le jeton, le tenant
-- n'est pas encore connu — c'est le jeton qui le donne (voir AttachementSignatureToken).

CREATE TABLE IF NOT EXISTS attachement_signature_tokens (
    id             UUID PRIMARY KEY,
    tenant_id      UUID NOT NULL,
    attachement_id VARCHAR(100) NOT NULL,
    token_hash     VARCHAR(64) NOT NULL UNIQUE,
    expires_at     TIMESTAMPTZ NOT NULL,
    consumed_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_attachement_signature_tokens_attachement FOREIGN KEY (attachement_id)
        REFERENCES attachements_chantier (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachement_signature_tokens_attachement
    ON attachement_signature_tokens (attachement_id);
