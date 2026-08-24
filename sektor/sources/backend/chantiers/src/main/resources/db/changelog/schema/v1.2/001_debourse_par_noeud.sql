-- Budget par nœud, décomposé du DPU — AC-1 à AC-7.
--
-- Lab métier : schéma clean, pas de reprise. Le budget par rubrique agrégé au chantier
-- (budget_chantiers / budget_lignes) n'est pas migré vers ces lignes ; il disparaît (AC-8).

-- Instantané du déboursé : d'où il vient et quand il a été copié. Jamais combien.
ALTER TABLE postes_budgetaires
    ADD COLUMN IF NOT EXISTS debourse_origine          VARCHAR(20),
    ADD COLUMN IF NOT EXISTS debourse_non_fiable       BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS debourse_copie_le         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS debourse_prix_dpu_id      UUID,
    ADD COLUMN IF NOT EXISTS debourse_prix_dpu_version BIGINT;

ALTER TABLE postes_budgetaires
    DROP CONSTRAINT IF EXISTS ck_postes_budgetaires_debourse_origine;
ALTER TABLE postes_budgetaires
    ADD CONSTRAINT ck_postes_budgetaires_debourse_origine CHECK (
        debourse_origine IS NULL
        OR debourse_origine IN ('DECOMPOSE', 'FORFAIT', 'ESTIME', 'SAISI')
    );

-- Un nœud interne n'a aucune étude derrière lui : son déboursé est saisi, pas copié (AC-6).
ALTER TABLE postes_budgetaires
    DROP CONSTRAINT IF EXISTS ck_postes_budgetaires_debourse_interne_saisi;
ALTER TABLE postes_budgetaires
    ADD CONSTRAINT ck_postes_budgetaires_debourse_interne_saisi CHECK (
        nature <> 'INTERNE'
        OR debourse_origine IS NULL
        OR debourse_origine = 'SAISI'
    );

-- Le déboursé prévu et révisé, par nœud et par rubrique.
CREATE TABLE IF NOT EXISTS debourses_noeuds (
    id          VARCHAR(150) PRIMARY KEY,
    tenant_id   UUID NOT NULL,
    -- Le porteur est toujours un poste : un lot vaut la somme de ses enfants (AC-1, AC-9).
    poste_id    VARCHAR(100) NOT NULL,
    rubrique    VARCHAR(30) NOT NULL,
    prevu_ht    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    revise_ht   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_debourses_noeuds_poste FOREIGN KEY (poste_id)
        REFERENCES postes_budgetaires (id) ON DELETE CASCADE,
    CONSTRAINT uq_debourses_noeuds_tenant_poste_rubrique UNIQUE (tenant_id, poste_id, rubrique),
    CONSTRAINT ck_debourses_noeuds_rubrique CHECK (
        rubrique IN ('MATIERE', 'MAIN_DOEUVRE', 'MATERIEL', 'SOUS_TRAITANCE', 'NON_VENTILE')
    )
);

CREATE INDEX IF NOT EXISTS idx_debourses_noeuds_tenant_poste
    ON debourses_noeuds (tenant_id, poste_id);
