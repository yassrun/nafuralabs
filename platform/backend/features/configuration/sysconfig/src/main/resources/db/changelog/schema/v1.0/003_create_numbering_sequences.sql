-- Auto-generated from numbering-sequence.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity numbering-sequence --feature sysconfig

CREATE TABLE IF NOT EXISTS numbering_sequences (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    prefix         VARCHAR(50),
    current_number BIGINT NOT NULL,
    increment_by   INTEGER NOT NULL DEFAULT 1,
    pad_length     INTEGER NOT NULL DEFAULT 6,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_numbering_sequences_tenant ON numbering_sequences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_numbering_sequences_code ON numbering_sequences(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_numbering_sequences_code_tenant ON numbering_sequences(tenant_id, code);
