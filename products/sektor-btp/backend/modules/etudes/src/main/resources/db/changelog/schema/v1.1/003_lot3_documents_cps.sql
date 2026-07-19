-- Lot 3 — documents du marche et indexation du CPS.
--
-- Le workflow demarre par le depot des pieces du marche (bordereau + CPS), stockees telles
-- quelles. Le CPS est ensuite decoupe en sections indexees, interrogeables article par article
-- pendant la decomposition — au lieu d'une passe globale d'appariement par code, fragile parce
-- qu'un CPS est de la prose organisee par chapitres, pas une table indexee par codes.
--
-- Voir products/sektor-btp/docs/epics/etude-prix-unifiee/03-import-bordereau-cps.md

-- ── Pieces du marche ────────────────────────────────────────────────────────
-- Une table plutot que deux colonnes fixes sur le dossier : la realite varie. Un seul PDF
-- contenant CPS et bordereau, ou trois fichiers separes, ou un CPS + un CPT + des plans.
CREATE TABLE IF NOT EXISTS dossier_documents (
    id                UUID PRIMARY KEY,
    tenant_id         UUID NOT NULL,
    dossier_etude_id  UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    document_id       VARCHAR(100) NOT NULL,   -- reference doc-manager : l'ORIGINAL, jamais altere
    nom_fichier       VARCHAR(255),
    type              VARCHAR(30) NOT NULL,
    ordre             INT NOT NULL DEFAULT 0,
    created_by        VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL,
    CONSTRAINT dossier_documents_type_chk CHECK (type IN (
        'CPS', 'BORDEREAU', 'CPS_ET_BORDEREAU', 'CPT', 'PLAN', 'REGLEMENT', 'AUTRE'))
);

CREATE INDEX IF NOT EXISTS dossier_documents_dossier_idx
    ON dossier_documents (tenant_id, dossier_etude_id, ordre);

-- ── CPS indexe ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cps_documents (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_document_id UUID NOT NULL REFERENCES dossier_documents(id) ON DELETE CASCADE,
    nb_pages            INT,
    -- PDF_NATIF : couche texte dense, extraction fiable.
    -- SCAN_OCR  : couche texte presente mais bruitee.
    -- SCAN_IMAGE: aucun texte extractible -- extraction automatique indisponible aujourd'hui,
    --             la conversion scan -> texte est prevue plus tard. Le fichier reste stocke.
    qualite_source      VARCHAR(20) NOT NULL,
    densite_texte       INT,                    -- caracteres/page : sert au diagnostic terrain
    statut_extraction   VARCHAR(20) NOT NULL,
    message_extraction  VARCHAR(500),
    nb_sections         INT NOT NULL DEFAULT 0,
    extrait_le          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL,
    CONSTRAINT cps_documents_qualite_chk CHECK (qualite_source IN (
        'PDF_NATIF', 'SCAN_OCR', 'SCAN_IMAGE', 'INCONNUE')),
    CONSTRAINT cps_documents_statut_chk CHECK (statut_extraction IN (
        'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ECHEC', 'NON_SUPPORTE'))
);

CREATE INDEX IF NOT EXISTS cps_documents_doc_idx
    ON cps_documents (tenant_id, dossier_document_id);

-- Unite de recherche ET de restitution : une section doit se lire seule.
CREATE TABLE IF NOT EXISTS cps_sections (
    id               UUID PRIMARY KEY,
    tenant_id        UUID NOT NULL,
    cps_document_id  UUID NOT NULL REFERENCES cps_documents(id) ON DELETE CASCADE,
    numero           VARCHAR(50),     -- '3.2.1', '12', 'IV' -- null si document non structure
    titre            VARCHAR(500),
    contenu          TEXT NOT NULL,
    ordre            INT NOT NULL,
    -- Recherche plein texte native Postgres : aucun token LLM consomme a ce stade.
    -- Le modele n'intervient qu'ensuite, sur les quelques passages retenus.
    contenu_tsv      TSVECTOR GENERATED ALWAYS AS (
                        setweight(to_tsvector('french', coalesce(numero, '')), 'A') ||
                        setweight(to_tsvector('french', coalesce(titre, '')), 'A') ||
                        setweight(to_tsvector('french', contenu), 'B')
                     ) STORED,
    created_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS cps_sections_tsv_idx ON cps_sections USING GIN (contenu_tsv);
CREATE INDEX IF NOT EXISTS cps_sections_doc_idx ON cps_sections (tenant_id, cps_document_id, ordre);

-- ── Tracabilite du descriptif ───────────────────────────────────────────────
-- Le chiffreur doit pouvoir remonter a la source dans le CPS. C'est aussi ce qui rend une
-- suggestion IA acceptable : elle propose, la source est visible, l'humain juge.
ALTER TABLE dpgf_noeuds
    ADD COLUMN IF NOT EXISTS descriptif_source            VARCHAR(20),
    ADD COLUMN IF NOT EXISTS descriptif_source_section_id UUID,
    ADD COLUMN IF NOT EXISTS descriptif_suggere_par_ia    BOOLEAN NOT NULL DEFAULT FALSE;
