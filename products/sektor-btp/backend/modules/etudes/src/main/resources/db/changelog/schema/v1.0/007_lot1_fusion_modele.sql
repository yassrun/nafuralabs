-- Lot 1 — fusion modèle : rendement, DpgfNoeud, PrixDpu rattachement, source_prix, audit

-- T1.2 — quantite → rendement (sémantique : par unité d'ouvrage)
ALTER TABLE composants_dpu RENAME COLUMN quantite TO rendement;

-- T1.5 — provenance du prix
ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS source_prix VARCHAR(20) NOT NULL DEFAULT 'MANUEL',
    ADD COLUMN IF NOT EXISTS offre_fournisseur_id UUID,
    ADD COLUMN IF NOT EXISTS suggere_par_ia BOOLEAN NOT NULL DEFAULT FALSE;

-- T1.4 — PrixDpu rattachable à un nœud de bordereau
ALTER TABLE prix_dpu ALTER COLUMN ouvrage_id DROP NOT NULL;

ALTER TABLE prix_dpu
    ADD COLUMN IF NOT EXISTS dpgf_noeud_id UUID,
    ADD COLUMN IF NOT EXISTS source_ouvrage_id UUID,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE prix_dpu DROP CONSTRAINT IF EXISTS uq_prix_dpu_tenant_ouvrage;

ALTER TABLE prix_dpu DROP CONSTRAINT IF EXISTS prix_dpu_rattachement_chk;
ALTER TABLE prix_dpu
    ADD CONSTRAINT prix_dpu_rattachement_chk
        CHECK (ouvrage_id IS NOT NULL OR dpgf_noeud_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_prix_dpu_tenant_ouvrage
    ON prix_dpu (tenant_id, ouvrage_id)
    WHERE ouvrage_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_prix_dpu_tenant_noeud
    ON prix_dpu (tenant_id, dpgf_noeud_id)
    WHERE dpgf_noeud_id IS NOT NULL;

-- T1.3 — DpgfNoeud enrichi (après prix_dpu.dpgf_noeud_id pour la FK croisée)
ALTER TABLE dpgf_noeuds
    ADD COLUMN IF NOT EXISTS descriptif TEXT,
    ADD COLUMN IF NOT EXISTS mode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS prix_dpu_id UUID;

ALTER TABLE dpgf_noeuds DROP CONSTRAINT IF EXISTS dpgf_noeuds_mode_chk;
ALTER TABLE dpgf_noeuds
    ADD CONSTRAINT dpgf_noeuds_mode_chk
        CHECK (
            (type = 'ARTICLE' AND (mode IS NULL OR mode IN ('FOURNI', 'DECOMPOSE')))
            OR (type <> 'ARTICLE' AND mode IS NULL)
        );

UPDATE dpgf_noeuds
SET mode = 'FOURNI'
WHERE type = 'ARTICLE' AND mode IS NULL;

-- FKs croisées (ajoutées après les deux colonnes)
ALTER TABLE prix_dpu DROP CONSTRAINT IF EXISTS fk_prix_dpu_dpgf_noeud;
ALTER TABLE prix_dpu
    ADD CONSTRAINT fk_prix_dpu_dpgf_noeud
        FOREIGN KEY (dpgf_noeud_id) REFERENCES dpgf_noeuds(id) ON DELETE CASCADE;

ALTER TABLE dpgf_noeuds DROP CONSTRAINT IF EXISTS fk_dpgf_noeuds_prix_dpu;
ALTER TABLE dpgf_noeuds
    ADD CONSTRAINT fk_dpgf_noeuds_prix_dpu
        FOREIGN KEY (prix_dpu_id) REFERENCES prix_dpu(id) ON DELETE SET NULL;

-- T1.6 — audit + version sur Dpgf
ALTER TABLE dpgf
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
