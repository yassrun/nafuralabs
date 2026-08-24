-- L'attachement lit les quantités de la période — AC-10 à AC-18.
--
-- Lab métier : schéma clean, pas de reprise. Les attachements existants (date unique, lignes au
-- posteCode libre) ne sont pas migrés — ils sont vidés côté seed (ChantierDocumentsSeedService).

-- AC-10 — une période, pas un jour.
ALTER TABLE attachements_chantier
    ADD COLUMN IF NOT EXISTS date_debut DATE,
    ADD COLUMN IF NOT EXISTS date_fin   DATE;

UPDATE attachements_chantier SET date_debut = date, date_fin = date WHERE date_debut IS NULL;

ALTER TABLE attachements_chantier
    ALTER COLUMN date_debut SET NOT NULL,
    ALTER COLUMN date_fin SET NOT NULL;

ALTER TABLE attachements_chantier
    DROP COLUMN IF EXISTS date;

-- AC-12, AC-11, AC-14 — la ligne pointe un nœud, porte la quantité de la période et une zone
-- facultative. Code, désignation, unité et prix sont lus sur le nœud (plus stockés sur la ligne).
ALTER TABLE attachement_lignes
    ADD COLUMN IF NOT EXISTS noeud_id         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS quantite_periode NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS zone_id          VARCHAR(100);

UPDATE attachement_lignes SET quantite_periode = quantite_executee WHERE quantite_periode IS NULL;
UPDATE attachement_lignes SET noeud_id = poste_code WHERE noeud_id IS NULL;

ALTER TABLE attachement_lignes
    ALTER COLUMN noeud_id SET NOT NULL,
    ALTER COLUMN quantite_periode SET NOT NULL;

ALTER TABLE attachement_lignes
    DROP COLUMN IF EXISTS poste_code,
    DROP COLUMN IF EXISTS designation,
    DROP COLUMN IF EXISTS quantite_executee,
    DROP COLUMN IF EXISTS unite,
    DROP COLUMN IF EXISTS zone;

-- AC-14 — le référentiel de zones du chantier, arborescent, vide par défaut.
CREATE TABLE IF NOT EXISTS zones_chantier (
    id             VARCHAR(100) PRIMARY KEY,
    tenant_id      UUID NOT NULL,
    chantier_id    VARCHAR(100) NOT NULL,
    designation    VARCHAR(500) NOT NULL,
    parent_zone_id VARCHAR(100),
    ordre          INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_zones_chantier_parent FOREIGN KEY (parent_zone_id)
        REFERENCES zones_chantier (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_zones_chantier_tenant_chantier
    ON zones_chantier (tenant_id, chantier_id);
