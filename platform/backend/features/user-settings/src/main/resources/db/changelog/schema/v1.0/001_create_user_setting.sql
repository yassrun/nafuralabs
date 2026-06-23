-- Tenant-admin / user-settings: Create user_setting table for profile, preferences, notifications.

CREATE TABLE IF NOT EXISTS user_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    setting_key VARCHAR(120) NOT NULL,
    value VARCHAR(2000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_setting_user_key ON user_setting(user_id, setting_key);
