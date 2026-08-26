-- SEKTOR-196 (cockpit-chantier) AC-5/AC-6 — ordre de service porté par le chantier.
-- Le démarrage passe uniquement par l'OS : référence et date d'effet posées par la commande
-- atomique de démarrage (SEKTOR-198). Le read model cockpit les lit ici.

ALTER TABLE chantiers
    ADD COLUMN IF NOT EXISTS os_reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS os_date_effet DATE;

CREATE INDEX IF NOT EXISTS idx_chantiers_os
    ON chantiers (tenant_id, os_reference)
    WHERE os_reference IS NOT NULL;
