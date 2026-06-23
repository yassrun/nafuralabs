CREATE TABLE IF NOT EXISTS incidents (
    id                          VARCHAR(100) PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    numero                      VARCHAR(50) NOT NULL,
    chantier_id                 VARCHAR(100),
    chantier_code               VARCHAR(50),
    employe_id                  VARCHAR(100),
    victime_nom                 VARCHAR(255),
    date_incident               DATE NOT NULL,
    heure_incident              TIME,
    lieu                        VARCHAR(500) NOT NULL,
    type_incident               VARCHAR(30) NOT NULL,
    gravite                     VARCHAR(30) NOT NULL,
    description                 TEXT NOT NULL,
    causes                      TEXT,
    actions_immediates          TEXT,
    plan_action                 TEXT,
    jours_arret                 INTEGER,
    status                      VARCHAR(30) NOT NULL DEFAULT 'OUVERT',
    cnss_dat_declare            BOOLEAN NOT NULL DEFAULT FALSE,
    cnss_dat_xml_url            VARCHAR(500),
    cnss_reference_declaration  VARCHAR(100),
    cnss_date_declaration       DATE,
    ijss_montant                NUMERIC(18, 4),
    ijss_periode                VARCHAR(100),
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_incidents_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant_status
    ON incidents(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant_chantier
    ON incidents(tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant_type
    ON incidents(tenant_id, type_incident);

CREATE TABLE IF NOT EXISTS incident_photos (
    incident_id                 VARCHAR(100) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    photo_url                   VARCHAR(500) NOT NULL,
    PRIMARY KEY (incident_id, photo_url)
);

CREATE TABLE IF NOT EXISTS incident_temoins (
    incident_id                 VARCHAR(100) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    temoin                      VARCHAR(255) NOT NULL,
    PRIMARY KEY (incident_id, temoin)
);
