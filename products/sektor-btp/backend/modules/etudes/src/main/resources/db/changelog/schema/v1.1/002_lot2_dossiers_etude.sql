-- Lot 2 — dossier d'étude : l'agrégat qui orchestre le parcours de chiffrage.
--
-- Il ne porte aucune donnée de prix : le bordereau et son chiffrage vivent dans
-- dpgf / dpgf_noeuds / prix_dpu. Voir products/sektor-btp/docs/epics/etude-prix-unifiee/.

CREATE TABLE IF NOT EXISTS dossiers_etude (
    id                            UUID PRIMARY KEY,
    tenant_id                     UUID NOT NULL,
    numero                        VARCHAR(50)  NOT NULL,
    objet                         VARCHAR(500) NOT NULL,

    client_id                     VARCHAR(100),
    client_nom                    VARCHAR(255),

    -- Sources documentaires
    cps_document_id               VARCHAR(100),
    bordereau_document_id         VARCHAR(100),
    appel_offre_client_id         UUID,

    -- Contenu, délégué au DPGF
    dpgf_id                       UUID REFERENCES dpgf(id) ON DELETE SET NULL,

    -- Parcours
    current_step                  INT NOT NULL DEFAULT 1,
    status                        VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    origine                       VARCHAR(30) NOT NULL DEFAULT 'ETUDE',

    -- Valeurs de départ appliquées aux PrixDpu créés dans ce dossier.
    -- Ce ne sont PAS des règles : l'expert métier pose une marge par article, variable.
    frais_generaux_percent_defaut NUMERIC(8,4),
    marge_percent_defaut          NUMERIC(8,4),
    tva_taux_defaut               NUMERIC(8,4),

    -- Marge globale éventuelle, par-dessus les marges par article.
    -- Sémantique non tranchée (composée ou cible) : laissée NULL tant que l'expert métier
    -- n'a pas répondu. Provisionnée maintenant parce qu'elle serait une migration une fois
    -- la table en production.
    marge_globale_percent         NUMERIC(8,4),

    -- Aval
    devis_genere_id               UUID,
    motif_refus                   VARCHAR(1000),
    notes                         TEXT,

    -- Audit et verrou optimiste
    created_by                    VARCHAR(100),
    updated_by                    VARCHAR(100),
    version                       BIGINT NOT NULL DEFAULT 0,
    created_at                    TIMESTAMPTZ NOT NULL,
    updated_at                    TIMESTAMPTZ NOT NULL,

    CONSTRAINT dossiers_etude_numero_uk UNIQUE (tenant_id, numero),
    CONSTRAINT dossiers_etude_step_chk  CHECK (current_step BETWEEN 1 AND 5),
    CONSTRAINT dossiers_etude_status_chk CHECK (status IN (
        'BROUILLON','EN_ETUDE','EN_VALIDATION','VALIDEE',
        'DEVIS_GENERE','GAGNE','PERDU','CONVERTIE','ANNULE')),
    CONSTRAINT dossiers_etude_origine_chk CHECK (origine IN ('ETUDE','MARCHE_EXISTANT'))
);

CREATE INDEX IF NOT EXISTS dossiers_etude_tenant_status_idx
    ON dossiers_etude (tenant_id, status);

CREATE INDEX IF NOT EXISTS dossiers_etude_dpgf_idx
    ON dossiers_etude (tenant_id, dpgf_id);
