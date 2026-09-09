-- SEKTOR-326 — calendrier chantier versionné (fuseau IANA, semaine type, exceptions).
-- Un calendrier par chantier (A04 provisoire). Création paresseuse côté service :
-- première écriture planning, jamais à la conversion palier 1.
-- Modifier le calendrier ne recalcule pas les activités (pas de simulation L2).

CREATE TABLE IF NOT EXISTS chantier_calendriers (
    id           VARCHAR(100) PRIMARY KEY,
    tenant_id    UUID NOT NULL,
    chantier_id  VARCHAR(100) NOT NULL,
    kind         VARCHAR(20) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chantier_calendrier UNIQUE (tenant_id, chantier_id),
    CONSTRAINT fk_chantier_calendrier_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT chk_chantier_calendrier_kind CHECK (kind IN ('STANDARD', 'HISTORIQUE'))
);

CREATE INDEX IF NOT EXISTS idx_chantier_calendriers_chantier
    ON chantier_calendriers (tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS chantier_calendrier_versions (
    id             VARCHAR(100) PRIMARY KEY,
    tenant_id      UUID NOT NULL,
    calendrier_id  VARCHAR(100) NOT NULL,
    date_effet     DATE NOT NULL,
    fuseau_iana    VARCHAR(80) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_calendrier_version_effet UNIQUE (calendrier_id, date_effet),
    CONSTRAINT fk_calendrier_version FOREIGN KEY (calendrier_id)
        REFERENCES chantier_calendriers (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendrier_versions_calendrier
    ON chantier_calendrier_versions (calendrier_id, date_effet);

CREATE TABLE IF NOT EXISTS chantier_calendrier_creneaux (
    id            VARCHAR(100) PRIMARY KEY,
    tenant_id     UUID NOT NULL,
    version_id    VARCHAR(100) NOT NULL,
    jour_semaine  INTEGER NOT NULL,
    heure_debut   TIME NOT NULL,
    heure_fin     TIME NOT NULL,
    lendemain     BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_calendrier_creneau_version FOREIGN KEY (version_id)
        REFERENCES chantier_calendrier_versions (id) ON DELETE CASCADE,
    CONSTRAINT chk_creneau_jour CHECK (jour_semaine BETWEEN 1 AND 7),
    CONSTRAINT chk_creneau_duree CHECK (lendemain OR heure_fin > heure_debut)
);

CREATE INDEX IF NOT EXISTS idx_calendrier_creneaux_version
    ON chantier_calendrier_creneaux (version_id);

CREATE TABLE IF NOT EXISTS chantier_calendrier_exceptions (
    id           VARCHAR(100) PRIMARY KEY,
    tenant_id    UUID NOT NULL,
    version_id   VARCHAR(100) NOT NULL,
    date_locale  DATE NOT NULL,
    type         VARCHAR(20) NOT NULL,
    CONSTRAINT uq_calendrier_exception_date UNIQUE (version_id, date_locale),
    CONSTRAINT fk_calendrier_exception_version FOREIGN KEY (version_id)
        REFERENCES chantier_calendrier_versions (id) ON DELETE CASCADE,
    CONSTRAINT chk_exception_type CHECK (type IN ('FERMETURE', 'OUVERTURE'))
);

CREATE INDEX IF NOT EXISTS idx_calendrier_exceptions_version
    ON chantier_calendrier_exceptions (version_id);

CREATE TABLE IF NOT EXISTS chantier_calendrier_exception_creneaux (
    id            VARCHAR(100) PRIMARY KEY,
    tenant_id     UUID NOT NULL,
    exception_id  VARCHAR(100) NOT NULL,
    heure_debut   TIME NOT NULL,
    heure_fin     TIME NOT NULL,
    lendemain     BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_exception_creneau FOREIGN KEY (exception_id)
        REFERENCES chantier_calendrier_exceptions (id) ON DELETE CASCADE,
    CONSTRAINT chk_exc_creneau_duree CHECK (lendemain OR heure_fin > heure_debut)
);

CREATE INDEX IF NOT EXISTS idx_exception_creneaux_exception
    ON chantier_calendrier_exception_creneaux (exception_id);
