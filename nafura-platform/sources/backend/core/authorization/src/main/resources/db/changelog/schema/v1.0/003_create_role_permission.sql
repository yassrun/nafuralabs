-- Authorization module: Create role_permission table.

CREATE TABLE IF NOT EXISTS role_permission (
    id UUID PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL,
    permission VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_role_permission_role_permission UNIQUE (role_code, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permission_role_code ON role_permission(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permission_permission ON role_permission(permission);
