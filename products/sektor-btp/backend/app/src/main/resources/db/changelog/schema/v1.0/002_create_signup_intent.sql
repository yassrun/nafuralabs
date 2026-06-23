-- Deferred signup: store intent until email confirmation, then materialize app_user + Keycloak.

CREATE TABLE IF NOT EXISTS signup_intent (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    preferred_locale VARCHAR(5),
    password_ciphertext TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_signup_intent_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_signup_intent_expires_at ON signup_intent(expires_at);
