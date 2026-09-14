-- Go / no-go cadrage → bordereau : décision DG + audit.
ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS go_decide_par VARCHAR(100);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS go_decide_at TIMESTAMPTZ;

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS motif_no_go VARCHAR(1000);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS motif_refus_charge_type VARCHAR(40);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS motif_refus_charge VARCHAR(4000);

ALTER TABLE dossiers_etude DROP CONSTRAINT IF EXISTS dossiers_etude_status_chk;
ALTER TABLE dossiers_etude ADD CONSTRAINT dossiers_etude_status_chk CHECK (status IN (
    'BROUILLON','A_DECIDER','AFFECTE','EN_ETUDE','EN_VALIDATION','VALIDEE',
    'DEVIS_GENERE','GAGNE','PERDU','CONVERTIE','ANNULE','NE_PAS_ETUDIER','REJETE_CHIFFRAGE','SUSPENDU'));
