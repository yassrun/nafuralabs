-- SEKTOR-209 — idempotence du gain et preuve financière de la dérogation.

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS gain_commande_empreinte VARCHAR(64);

ALTER TABLE transitions_etude
    ADD COLUMN IF NOT EXISTS montant_vente_ht NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS debourse_initial_ht NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS marge_ht NUMERIC(18, 4);
