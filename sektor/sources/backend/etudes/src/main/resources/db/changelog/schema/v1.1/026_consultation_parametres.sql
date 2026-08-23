-- SEKTOR-110 — paramètres tenant consultation (mode + min N).
-- Table études : le rôle app peut y écrire. Pas tenant_setting (SELECT only).

CREATE TABLE IF NOT EXISTS consultation_parametres (
    tenant_id   UUID PRIMARY KEY,
    mode        VARCHAR(20) NOT NULL DEFAULT 'OPTIONNELLE',
    minimum     INT NOT NULL DEFAULT 1,
    updated_at  TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_consultation_parametres_mode CHECK (mode IN ('OPTIONNELLE', 'OBLIGATOIRE')),
    CONSTRAINT chk_consultation_parametres_minimum CHECK (minimum >= 1)
);
