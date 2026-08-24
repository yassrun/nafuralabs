-- Le réel s'impute sur le nœud — AC-10, AC-11.
--
-- Palier 1 : nœud + rubrique + montant + date. Aucune colonne d'activité, de zone ou de
-- quotité — pas même nullable : ce contrat ne prépare pas le planning, il s'en passe (AC-14).

CREATE TABLE IF NOT EXISTS couts_reels_noeuds (
    id                 VARCHAR(100) PRIMARY KEY,
    tenant_id          UUID NOT NULL,
    chantier_id        VARCHAR(100) NOT NULL,
    -- Toujours renseigné : un coût sans nœud tombe sur « Frais de chantier », pas dans le vide.
    poste_id           VARCHAR(100) NOT NULL,
    rubrique           VARCHAR(30) NOT NULL,
    montant_ht         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    date_cout          DATE NOT NULL,
    libelle            VARCHAR(500),
    source             VARCHAR(50),
    -- Vrai tant que la dépense attend sa ré-imputation sur le bon nœud.
    impute_par_defaut  BOOLEAN NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_couts_reels_noeuds_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT fk_couts_reels_noeuds_poste FOREIGN KEY (poste_id)
        REFERENCES postes_budgetaires (id) ON DELETE CASCADE,
    -- Le non ventilé décrit un chiffrage prévu qu'on n'a pas su décomposer ; une dépense
    -- réelle, elle, sait toujours ce qu'elle a payé.
    CONSTRAINT ck_couts_reels_noeuds_rubrique CHECK (
        rubrique IN ('MATIERE', 'MAIN_DOEUVRE', 'MATERIEL', 'SOUS_TRAITANCE')
    )
);

CREATE INDEX IF NOT EXISTS idx_couts_reels_noeuds_tenant_chantier
    ON couts_reels_noeuds (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_couts_reels_noeuds_tenant_poste
    ON couts_reels_noeuds (tenant_id, poste_id);

-- AC-8 — le budget par rubrique agrégé au chantier cesse d'exister comme stockage.
-- Lab métier : schéma clean, aucune reprise. Le déboursé vit sur l'arbre (debourses_noeuds)
-- et l'agrégat par rubrique se dérive à la lecture. Il n'y a plus de second endroit où le
-- stocker, donc plus aucun total ne peut diverger de ses composantes (AC-9).
DROP TABLE IF EXISTS budget_lignes;
DROP TABLE IF EXISTS budget_chantiers;
