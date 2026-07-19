-- Backfill chantier_affectation from legacy responsibility name columns on chantiers.
-- Match employe by full name only (employes.user_id may not exist yet at this point in the
-- lifecycle sort order — rh/008_add_employe_user_id runs later alphabetically).

-- Chef de chantier
INSERT INTO chantier_affectation (
    id, tenant_id, chantier_id, employe_id, role_code, date_debut, date_fin, is_active, created_at, updated_at
)
SELECT
    'aff-bf-chef-' || c.id,
    c.tenant_id,
    c.id,
    e.id,
    'BTP_CHEF_CHANTIER',
    COALESCE(c.date_demarrage, CURRENT_DATE),
    NULL,
    TRUE,
    now(),
    now()
FROM chantiers c
JOIN employes e ON e.tenant_id = c.tenant_id
  AND lower(trim(e.prenom || ' ' || e.nom)) = lower(trim(c.chef_chantier_name))
WHERE c.chef_chantier_name IS NOT NULL
  AND trim(c.chef_chantier_name) <> ''
ON CONFLICT DO NOTHING;

-- Conducteur de travaux
INSERT INTO chantier_affectation (
    id, tenant_id, chantier_id, employe_id, role_code, date_debut, date_fin, is_active, created_at, updated_at
)
SELECT
    'aff-bf-cond-' || c.id,
    c.tenant_id,
    c.id,
    e.id,
    'BTP_CONDUCTEUR_TRAVAUX',
    COALESCE(c.date_demarrage, CURRENT_DATE),
    NULL,
    TRUE,
    now(),
    now()
FROM chantiers c
JOIN employes e ON e.tenant_id = c.tenant_id
  AND lower(trim(e.prenom || ' ' || e.nom)) = lower(trim(c.conducteur_travaux_name))
WHERE c.conducteur_travaux_name IS NOT NULL
  AND trim(c.conducteur_travaux_name) <> ''
ON CONFLICT DO NOTHING;

-- Ingénieur
INSERT INTO chantier_affectation (
    id, tenant_id, chantier_id, employe_id, role_code, date_debut, date_fin, is_active, created_at, updated_at
)
SELECT
    'aff-bf-ing-' || c.id,
    c.tenant_id,
    c.id,
    e.id,
    'BTP_INGENIEUR',
    COALESCE(c.date_demarrage, CURRENT_DATE),
    NULL,
    TRUE,
    now(),
    now()
FROM chantiers c
JOIN employes e ON e.tenant_id = c.tenant_id
  AND lower(trim(e.prenom || ' ' || e.nom)) = lower(trim(c.ingenieur_name))
WHERE c.ingenieur_name IS NOT NULL
  AND trim(c.ingenieur_name) <> ''
ON CONFLICT DO NOTHING;
