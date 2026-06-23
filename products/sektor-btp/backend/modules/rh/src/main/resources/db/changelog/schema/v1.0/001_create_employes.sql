CREATE TABLE IF NOT EXISTS employes (
    id                          VARCHAR(100) PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    matricule                   VARCHAR(50) NOT NULL,
    nom                         VARCHAR(120) NOT NULL,
    prenom                      VARCHAR(120) NOT NULL,
    cin                         VARCHAR(20) NOT NULL,
    cnss                        VARCHAR(20),
    date_naissance              DATE,
    adresse                     VARCHAR(500),
    ville                       VARCHAR(120),
    telephone                   VARCHAR(30),
    email                       VARCHAR(255),
    poste                       VARCHAR(255) NOT NULL,
    departement                 VARCHAR(120),
    categorie                   VARCHAR(30) NOT NULL,
    type_contrat                VARCHAR(30) NOT NULL,
    statut                      VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    date_embauche               DATE NOT NULL,
    date_fin_contrat            DATE,
    salaire_base                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    indemnite_representation    NUMERIC(18, 4),
    indemnite_transport         NUMERIC(18, 4),
    rib                         VARCHAR(34),
    banque                      VARCHAR(120),
    notes                       TEXT,
    ice                         VARCHAR(20),
    if_fiscal                   VARCHAR(20),
    rc                          VARCHAR(120),
    patente                     VARCHAR(120),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_employes_tenant_matricule UNIQUE (tenant_id, matricule)
);

CREATE INDEX IF NOT EXISTS idx_employes_tenant_statut ON employes(tenant_id, statut);
CREATE INDEX IF NOT EXISTS idx_employes_tenant_categorie ON employes(tenant_id, categorie);
CREATE INDEX IF NOT EXISTS idx_employes_tenant_type_contrat ON employes(tenant_id, type_contrat);
