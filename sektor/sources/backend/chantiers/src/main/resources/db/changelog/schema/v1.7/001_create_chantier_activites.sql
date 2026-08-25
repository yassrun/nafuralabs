-- Planning palier 2 — couche d'activités (WBS libre, zone optionnelle, précédences, rattachements).
-- AC-1..AC-7 CONTRAT planning-activites.

CREATE TABLE IF NOT EXISTS chantier_activites (
    id                   VARCHAR(100) PRIMARY KEY,
    tenant_id            UUID NOT NULL,
    chantier_id          VARCHAR(100) NOT NULL,
    parent_activite_id   VARCHAR(100),
    zone_id              VARCHAR(100),
    libelle              VARCHAR(500) NOT NULL,
    date_debut           DATE NOT NULL,
    date_fin             DATE NOT NULL,
    ordre                INTEGER NOT NULL DEFAULT 0,
    -- % saisi uniquement pour activité sans nœud (AC-9) ; dérivé sinon.
    avancement_percent   NUMERIC(8, 4),
    status               VARCHAR(30) NOT NULL DEFAULT 'PLANIFIE',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_chantier_activites_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT fk_chantier_activites_parent FOREIGN KEY (parent_activite_id)
        REFERENCES chantier_activites (id) ON DELETE SET NULL,
    CONSTRAINT fk_chantier_activites_zone FOREIGN KEY (zone_id)
        REFERENCES zones_chantier (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chantier_activites_tenant_chantier
    ON chantier_activites (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_chantier_activites_parent
    ON chantier_activites (parent_activite_id);

CREATE TABLE IF NOT EXISTS chantier_activite_precedences (
    id                   VARCHAR(100) PRIMARY KEY,
    tenant_id            UUID NOT NULL,
    chantier_id          VARCHAR(100) NOT NULL,
    pred_activite_id     VARCHAR(100) NOT NULL,
    succ_activite_id     VARCHAR(100) NOT NULL,
    type_lien            VARCHAR(10) NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_activite_prec_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT fk_activite_prec_pred FOREIGN KEY (pred_activite_id)
        REFERENCES chantier_activites (id) ON DELETE CASCADE,
    CONSTRAINT fk_activite_prec_succ FOREIGN KEY (succ_activite_id)
        REFERENCES chantier_activites (id) ON DELETE CASCADE,
    CONSTRAINT uq_activite_precedence UNIQUE (tenant_id, pred_activite_id, succ_activite_id, type_lien),
    CONSTRAINT chk_activite_type_lien CHECK (type_lien IN ('FD', 'DD', 'FF', 'DF'))
);

CREATE INDEX IF NOT EXISTS idx_activite_precedences_chantier
    ON chantier_activite_precedences (tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS chantier_activite_rattachements (
    id                   VARCHAR(100) PRIMARY KEY,
    tenant_id            UUID NOT NULL,
    activite_id          VARCHAR(100) NOT NULL,
    lot_id               VARCHAR(100),
    poste_id             VARCHAR(100),
    quantite_prevue      NUMERIC(18, 4) NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_activite_ratt_activite FOREIGN KEY (activite_id)
        REFERENCES chantier_activites (id) ON DELETE CASCADE,
    CONSTRAINT chk_activite_ratt_noeud CHECK (
        (poste_id IS NOT NULL AND lot_id IS NOT NULL)
        OR (poste_id IS NULL AND lot_id IS NOT NULL)
    ),
    CONSTRAINT chk_activite_ratt_qty CHECK (quantite_prevue > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_activite_ratt_poste
    ON chantier_activite_rattachements (tenant_id, activite_id, poste_id)
    WHERE poste_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_activite_ratt_lot_feuille
    ON chantier_activite_rattachements (tenant_id, activite_id, lot_id)
    WHERE poste_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_activite_ratt_poste
    ON chantier_activite_rattachements (tenant_id, poste_id);

CREATE INDEX IF NOT EXISTS idx_activite_ratt_lot
    ON chantier_activite_rattachements (tenant_id, lot_id);

-- Source de la déclaration quand elle remonte depuis une activité (AC-10).
ALTER TABLE avancements_physiques
    ADD COLUMN IF NOT EXISTS activite_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_avancements_physiques_activite
    ON avancements_physiques (activite_id);
