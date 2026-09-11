-- Deux responsables (étude + exécution) et statut avis d'exécution dossier.
ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS responsable_execution_user_id VARCHAR(100);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS responsable_execution_nom VARCHAR(255);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS avis_execution_dossier VARCHAR(20);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS avis_execution_commentaire VARCHAR(4000);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS avis_execution_decide_par VARCHAR(100);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS avis_execution_decide_at TIMESTAMPTZ;

ALTER TABLE dossiers_etude DROP CONSTRAINT IF EXISTS dossiers_etude_status_chk;
ALTER TABLE dossiers_etude ADD CONSTRAINT dossiers_etude_status_chk CHECK (status IN (
    'BROUILLON','A_DECIDER','AFFECTE','EN_ETUDE','EN_VALIDATION','VALIDEE',
    'DEVIS_GENERE','GAGNE','PERDU','CONVERTIE','ANNULE','NE_PAS_ETUDIER',
    'REJETE_CHIFFRAGE','SUSPENDU','A_AVIS_EXECUTION'));
