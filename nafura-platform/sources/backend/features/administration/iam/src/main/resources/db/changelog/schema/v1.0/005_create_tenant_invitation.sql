-- Tenant invitation tracking (token jti, delivery status, acceptance).

CREATE TABLE IF NOT EXISTS tenant_invitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    token_jti UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    email_delivery_status VARCHAR(20),
    inviter_message TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_tenant_invitation_jti ON tenant_invitation(token_jti);
CREATE INDEX IF NOT EXISTS idx_tenant_invitation_tenant_user ON tenant_invitation(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitation_status ON tenant_invitation(status);
CREATE INDEX IF NOT EXISTS idx_tenant_invitation_expires ON tenant_invitation(expires_at);
