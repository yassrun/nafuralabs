-- SEKTOR-325 — formes PHASE/ACTIVITE/JALON, natures désactivables, durée ouvrée nullable.
-- Migration conservatrice : pas de DROP. IDs, dates visibles et rattachements inchangés.
-- Défaut forme=ACTIVITE ; nature et durée NULL = à qualifier. Parents NON convertis en PHASE.

CREATE TABLE IF NOT EXISTS chantier_activite_natures (
    code        VARCHAR(50) PRIMARY KEY,
    libelle     VARCHAR(200) NOT NULL,
    forme       VARCHAR(20) NOT NULL,
    actif       BOOLEAN NOT NULL DEFAULT true,
    ordre       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_activite_nature_forme CHECK (forme IN ('ACTIVITE', 'JALON'))
);

INSERT INTO chantier_activite_natures (code, libelle, forme, ordre) VALUES
    ('PREPA_INSTALL',       'Préparation / installation', 'ACTIVITE', 10),
    ('ETUDES_VALIDATION',   'Études / validation',        'ACTIVITE', 20),
    ('APPROVISIONNEMENT',   'Approvisionnement',          'ACTIVITE', 30),
    ('TRAVAUX',             'Travaux',                    'ACTIVITE', 40),
    ('CONTROLE_ESSAI',      'Contrôle / essai',           'ACTIVITE', 50),
    ('RECEPTION_CLOTURE',   'Réception / clôture',        'ACTIVITE', 60),
    ('JALON_TECHNIQUE',     'Jalon technique',            'JALON',    110),
    ('JALON_CONTRACTUEL',   'Jalon contractuel',          'JALON',    120),
    ('JALON_FINANCIER',     'Jalon financier',            'JALON',    130)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE chantier_activites
    ADD COLUMN IF NOT EXISTS forme VARCHAR(20) NOT NULL DEFAULT 'ACTIVITE',
    ADD COLUMN IF NOT EXISTS nature_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS duree_minutes_ouvrees INTEGER;

ALTER TABLE chantier_activites
    ADD CONSTRAINT chk_chantier_activites_forme
    CHECK (forme IN ('PHASE', 'ACTIVITE', 'JALON'));

ALTER TABLE chantier_activites
    ADD CONSTRAINT chk_chantier_activites_duree
    CHECK (duree_minutes_ouvrees IS NULL OR duree_minutes_ouvrees >= 0);

ALTER TABLE chantier_activites
    ADD CONSTRAINT fk_chantier_activites_nature
    FOREIGN KEY (nature_code) REFERENCES chantier_activite_natures (code);

CREATE INDEX IF NOT EXISTS idx_chantier_activites_nature
    ON chantier_activites (nature_code);
