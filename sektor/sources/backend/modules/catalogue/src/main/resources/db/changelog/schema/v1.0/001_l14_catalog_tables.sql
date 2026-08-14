-- L14 référentiel-catalogue : module catalogue Sektor
-- Aucune colonne tenant_id. Aucune FK vers table hors catalog_*.
-- Liens vers le monde tenant = cle_stable / code édition (VARCHAR).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE catalog_editions (
    id              UUID PRIMARY KEY,
    code            VARCHAR(40) NOT NULL UNIQUE,
    statut          VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    publie_le       TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_catalog_editions_statut CHECK (statut IN ('BROUILLON', 'PUBLIEE', 'ARCHIVEE'))
);

CREATE TABLE catalog_articles (
    id                  UUID PRIMARY KEY,
    cle_stable          VARCHAR(120) NOT NULL UNIQUE,
    nature              VARCHAR(40) NOT NULL,
    libelle             VARCHAR(300) NOT NULL,
    description         TEXT,
    unite_code          VARCHAR(20) NOT NULL,
    code_famille        VARCHAR(40),
    statut              VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    edition_publication VARCHAR(40),
    remplace_par        UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_catalog_articles_statut CHECK (statut IN ('BROUILLON', 'PUBLIE', 'RETIRE')),
    CONSTRAINT fk_catalog_articles_remplace FOREIGN KEY (remplace_par) REFERENCES catalog_articles (id)
);

CREATE INDEX idx_catalog_articles_libelle_trgm ON catalog_articles USING gin (libelle gin_trgm_ops);
CREATE INDEX idx_catalog_articles_statut ON catalog_articles (statut);

CREATE TABLE catalog_ouvrages (
    id                  UUID PRIMARY KEY,
    cle_stable          VARCHAR(120) NOT NULL UNIQUE,
    libelle             VARCHAR(300) NOT NULL,
    description         TEXT,
    unite_code          VARCHAR(20) NOT NULL,
    code_lot            VARCHAR(40),
    code_famille        VARCHAR(40),
    code_ouvrage        VARCHAR(40),
    version             INT NOT NULL DEFAULT 1,
    statut              VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    edition_publication VARCHAR(40),
    remplace_par        UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_catalog_ouvrages_statut CHECK (statut IN ('BROUILLON', 'PUBLIE', 'RETIRE')),
    CONSTRAINT fk_catalog_ouvrages_remplace FOREIGN KEY (remplace_par) REFERENCES catalog_ouvrages (id)
);

CREATE INDEX idx_catalog_ouvrages_libelle_trgm ON catalog_ouvrages USING gin (libelle gin_trgm_ops);
CREATE INDEX idx_catalog_ouvrages_statut ON catalog_ouvrages (statut);

CREATE TABLE catalog_composants (
    id                  UUID PRIMARY KEY,
    catalog_ouvrage_id  UUID NOT NULL REFERENCES catalog_ouvrages (id) ON DELETE CASCADE,
    rang                INT NOT NULL DEFAULT 0,
    nature              VARCHAR(40) NOT NULL,
    libelle             VARCHAR(300) NOT NULL,
    unite_code          VARCHAR(20),
    rendement           NUMERIC(18, 6) NOT NULL,
    catalog_article_cle VARCHAR(120),
    base_rendement      VARCHAR(20) NOT NULL DEFAULT 'PAR_UNITE',
    CONSTRAINT chk_catalog_composants_base CHECK (base_rendement IN ('PAR_UNITE', 'PAR_JOUR'))
);

CREATE INDEX idx_catalog_composants_ouvrage ON catalog_composants (catalog_ouvrage_id);

CREATE TABLE catalog_prix_reference (
    id                  UUID PRIMARY KEY,
    catalog_article_cle VARCHAR(120) NOT NULL,
    prix                NUMERIC(18, 4) NOT NULL,
    devise              VARCHAR(3) NOT NULL DEFAULT 'MAD',
    zone                VARCHAR(80),
    valid_from          DATE NOT NULL,
    valid_to            DATE,
    source              VARCHAR(200),
    edition             VARCHAR(40),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_prix_article ON catalog_prix_reference (catalog_article_cle, valid_from);

CREATE TABLE catalog_candidats (
    id                      UUID PRIMARY KEY,
    libelle_propose         VARCHAR(300) NOT NULL,
    nature                  VARCHAR(40),
    unite_code              VARCHAR(20),
    code_famille            VARCHAR(40),
    type_objet              VARCHAR(20) NOT NULL DEFAULT 'ARTICLE',
    nb_tenants_confirmants  INT NOT NULL DEFAULT 0,
    exemples_libelles       JSONB NOT NULL DEFAULT '[]'::jsonb,
    rendement_min           NUMERIC(18, 6),
    rendement_max           NUMERIC(18, 6),
    rendement_median        NUMERIC(18, 6),
    statut                  VARCHAR(20) NOT NULL DEFAULT 'PROPOSE',
    propose_par             VARCHAR(20) NOT NULL DEFAULT 'REGLE',
    model_version           VARCHAR(80),
    decide_par              VARCHAR(120),
    decide_le               TIMESTAMPTZ,
    catalog_cle_creee       VARCHAR(120),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_catalog_candidats_statut CHECK (statut IN ('PROPOSE', 'ACCEPTE', 'REFUSE')),
    CONSTRAINT chk_catalog_candidats_propose CHECK (propose_par IN ('REGLE', 'IA', 'MANUEL')),
    CONSTRAINT chk_catalog_candidats_type CHECK (type_objet IN ('ARTICLE', 'OUVRAGE'))
);

CREATE INDEX idx_catalog_candidats_statut ON catalog_candidats (statut, nb_tenants_confirmants);

COMMENT ON TABLE catalog_editions IS 'L14 — éditions catalogue (pas de tenant_id)';
COMMENT ON TABLE catalog_articles IS 'L14 — articles catalogue ; lien tenant via cle_stable';
COMMENT ON TABLE catalog_candidats IS 'L14 — file gouvernance G2 ; exemples anonymisés';
