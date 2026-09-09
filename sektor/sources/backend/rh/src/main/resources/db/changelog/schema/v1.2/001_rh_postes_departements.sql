-- SEKTOR-331 — référentiels RH poste / département (pas le rôle IAM).
CREATE TABLE IF NOT EXISTS rh_postes (
    id          VARCHAR(100) PRIMARY KEY,
    tenant_id   UUID NOT NULL,
    code        VARCHAR(50) NOT NULL,
    libelle     VARCHAR(200) NOT NULL,
    actif       BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rh_postes_tenant_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS rh_departements (
    id          VARCHAR(100) PRIMARY KEY,
    tenant_id   UUID NOT NULL,
    code        VARCHAR(50) NOT NULL,
    libelle     VARCHAR(200) NOT NULL,
    actif       BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rh_departements_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_rh_postes_tenant_libelle ON rh_postes (tenant_id, libelle);
CREATE INDEX IF NOT EXISTS idx_rh_departements_tenant_libelle ON rh_departements (tenant_id, libelle);

UPDATE employes SET poste = 'Employé' WHERE btrim(poste) = '';

INSERT INTO rh_postes (id, tenant_id, code, libelle, actif, created_at, updated_at)
SELECT
    'rh-pst-' || lpad(row_number() OVER (ORDER BY tenant_id, poste)::text, 4, '0'),
    tenant_id,
    'P' || lpad(row_number() OVER (ORDER BY tenant_id, poste)::text, 4, '0'),
    poste,
    true,
    now(),
    now()
FROM (SELECT DISTINCT tenant_id, poste FROM employes WHERE poste IS NOT NULL AND btrim(poste) <> '') d;

INSERT INTO rh_departements (id, tenant_id, code, libelle, actif, created_at, updated_at)
SELECT
    'rh-dep-' || lpad(row_number() OVER (ORDER BY tenant_id, departement)::text, 4, '0'),
    tenant_id,
    'D' || lpad(row_number() OVER (ORDER BY tenant_id, departement)::text, 4, '0'),
    departement,
    true,
    now(),
    now()
FROM (SELECT DISTINCT tenant_id, departement FROM employes WHERE departement IS NOT NULL AND btrim(departement) <> '') d;

ALTER TABLE employes ADD COLUMN IF NOT EXISTS poste_id VARCHAR(100);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS departement_id VARCHAR(100);

UPDATE employes e
SET poste_id = p.id
FROM rh_postes p
WHERE e.tenant_id = p.tenant_id AND e.poste = p.libelle AND e.poste_id IS NULL;

UPDATE employes e
SET departement_id = d.id
FROM rh_departements d
WHERE e.tenant_id = d.tenant_id AND e.departement = d.libelle AND e.departement_id IS NULL;

ALTER TABLE employes ALTER COLUMN poste_id SET NOT NULL;

ALTER TABLE employes
    ADD CONSTRAINT fk_employes_poste FOREIGN KEY (poste_id) REFERENCES rh_postes (id);

ALTER TABLE employes
    ADD CONSTRAINT fk_employes_departement FOREIGN KEY (departement_id) REFERENCES rh_departements (id);

CREATE INDEX IF NOT EXISTS idx_employes_poste_id ON employes (tenant_id, poste_id);
CREATE INDEX IF NOT EXISTS idx_employes_departement_id ON employes (tenant_id, departement_id);
