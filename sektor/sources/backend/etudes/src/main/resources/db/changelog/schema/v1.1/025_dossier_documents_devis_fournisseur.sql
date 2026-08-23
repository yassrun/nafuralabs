-- SEKTOR-109 — un PDF orphelin DEVIS_FOURNISSEUR existe et ne compte pas.
-- Le chk d'origine (003) n'autorise que CPS/BORDEREAU/…/AUTRE.

ALTER TABLE dossier_documents DROP CONSTRAINT IF EXISTS dossier_documents_type_chk;
ALTER TABLE dossier_documents ADD CONSTRAINT dossier_documents_type_chk CHECK (type IN (
    'CPS', 'BORDEREAU', 'CPS_ET_BORDEREAU', 'CPT', 'PLAN', 'REGLEMENT', 'AUTRE',
    'DEVIS_FOURNISSEUR'));
