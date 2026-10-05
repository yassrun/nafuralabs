-- Several organizations (spec 09): a readable slug for public URLs, a status (suspended by the operator),
-- and the audience of a membership (members or external, spec 11).
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_slug ON tenant(slug);

ALTER TABLE tenant_membership ADD COLUMN IF NOT EXISTS audience VARCHAR(40) NOT NULL DEFAULT 'members';
