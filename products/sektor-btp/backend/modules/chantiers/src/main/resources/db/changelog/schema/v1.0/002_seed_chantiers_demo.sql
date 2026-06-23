-- Demo seeds aligned with ChantiersMockService (context seed-demo when enabled in lifecycle).

INSERT INTO chantiers (
    id, tenant_id, code, label, chantier_type, client_id, client_name, ville,
    date_demarrage, date_fin_prevue, montant_ht, taux_tva, taux_rg, avancement_percent,
    status, chef_chantier_name, conducteur_travaux_name, is_active, created_at, updated_at
)
SELECT 'ch-001', t.id, 'CH-2025-001', 'Résidence Yasmine — Casa', 'BATIMENT',
       'cli-001', 'OCP Promotion SA', 'Casablanca',
       DATE '2026-01-06', DATE '2026-10-20', 24500000, 20, 7, 35,
       'EN_COURS', 'Mehdi Saadi', 'Karim El Idrissi', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantiers (
    id, tenant_id, code, label, chantier_type, client_id, client_name, ville,
    date_demarrage, date_fin_prevue, montant_ht, taux_tva, taux_rg, avancement_percent,
    status, chef_chantier_name, conducteur_travaux_name, is_active, created_at, updated_at
)
SELECT 'ch-002', t.id, 'CH-2025-002', 'Pont Bouregreg ouvrage 3', 'TP',
       'cli-002', 'ADM (Autoroutes du Maroc)', 'Rabat',
       DATE '2026-01-10', DATE '2026-09-28', 87000000, 20, 7, 55,
       'EN_COURS', 'Rachid Alaoui', 'Hicham Bennani', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantiers (
    id, tenant_id, code, label, chantier_type, client_id, client_name, ville,
    date_demarrage, date_fin_prevue, montant_ht, taux_tva, taux_rg, avancement_percent,
    status, chef_chantier_name, conducteur_travaux_name, is_active, created_at, updated_at
)
SELECT 'ch-003', t.id, 'CH-2025-003', 'Lotissement Al Boustane', 'VRD',
       'cli-003', 'Addoha SA', 'Casablanca',
       DATE '2026-01-08', DATE '2026-09-25', 18200000, 20, 7, 48,
       'EN_COURS', 'Nawfal Berrada', 'Younes Tazi', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantiers (
    id, tenant_id, code, label, chantier_type, client_id, client_name, ville,
    date_demarrage, date_fin_prevue, montant_ht, taux_tva, taux_rg, avancement_percent,
    status, chef_chantier_name, conducteur_travaux_name, is_active, created_at, updated_at
)
SELECT 'ch-004', t.id, 'CH-2025-004', 'École Tanger Med phase 2', 'BATIMENT',
       'cli-004', 'Ministère Education Nationale', 'Tanger',
       DATE '2026-01-14', DATE '2026-06-06', 12800000, 20, 7, 72,
       'EN_COURS', 'Mehdi Saadi', 'Karim El Idrissi', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantiers (
    id, tenant_id, code, label, chantier_type, client_id, client_name, ville,
    date_demarrage, date_fin_prevue, montant_ht, taux_tva, taux_rg, avancement_percent,
    status, chef_chantier_name, conducteur_travaux_name, is_active, created_at, updated_at
)
SELECT 'ch-005', t.id, 'CH-2025-005', 'Voirie Mohammedia secteur 7', 'VRD',
       'cli-005', 'Commune Mohammedia', 'Mohammedia',
       DATE '2026-01-18', DATE '2026-06-30', 9600000, 20, 7, 60,
       'EN_COURS', 'Rachid Alaoui', 'Hicham Bennani', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantiers (
    id, tenant_id, code, label, chantier_type, client_id, client_name, ville,
    date_demarrage, date_fin_prevue, montant_ht, taux_tva, taux_rg, avancement_percent,
    status, chef_chantier_name, conducteur_travaux_name, is_active, created_at, updated_at
)
SELECT 'ch-006', t.id, 'CH-2025-006', 'Hôtel Atlas Marrakech', 'BATIMENT',
       'cli-006', 'Atlas Hospitality', 'Marrakech',
       DATE '2026-01-09', DATE '2026-07-04', 42000000, 20, 7, 54,
       'EN_COURS', 'Nawfal Berrada', 'Younes Tazi', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;
