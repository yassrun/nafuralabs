-- Suspendre le chiffrage jusqu'au statut Chiffré.
ALTER TABLE dossiers_etude DROP CONSTRAINT IF EXISTS dossiers_etude_status_chk;
ALTER TABLE dossiers_etude ADD CONSTRAINT dossiers_etude_status_chk CHECK (status IN (
    'BROUILLON','A_DECIDER','AFFECTE','EN_ETUDE','EN_VALIDATION','VALIDEE',
    'DEVIS_GENERE','GAGNE','PERDU','CONVERTIE','ANNULE','NE_PAS_ETUDIER',
    'REJETE_CHIFFRAGE','SUSPENDU'));
