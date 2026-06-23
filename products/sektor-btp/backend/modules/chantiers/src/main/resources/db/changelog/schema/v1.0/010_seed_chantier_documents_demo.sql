-- Demo seeds aligned with documents-mock.service and attachement-mock.service (tenant nafura).

INSERT INTO documents_chantier (id, tenant_id, chantier_id, type, titre, fichier, taille, uploaded_at, uploaded_par, tags)
SELECT 'doc-001', t.id, 'ch-001', 'MARCHE', 'Marché n° OCP-2026-001 signé', 'marche-ocp-2026-001.pdf', 1240000,
       DATE '2026-01-15', 'Karim El Mansouri', '["signé","original"]'::jsonb
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents_chantier (id, tenant_id, chantier_id, type, titre, fichier, taille, uploaded_at, uploaded_par, tags)
SELECT 'doc-002', t.id, 'ch-001', 'PLAN', 'Plans architecturaux R+5 — révision A', 'plans-arch-rev-A.pdf', 8500000,
       DATE '2026-01-20', 'Sofia Tazi', NULL
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents_chantier (id, tenant_id, chantier_id, type, titre, fichier, taille, uploaded_at, uploaded_par, tags)
SELECT 'doc-006', t.id, 'ch-002', 'MARCHE', 'Marché ADM — Pont Bouregreg', 'marche-adm-pont.pdf', 2100000,
       DATE '2026-01-05', 'Khalid Naciri', '["signé"]'::jsonb
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachements_chantier (id, tenant_id, chantier_id, numero, date, meteo_code, temperature_c, effectif_present, status)
SELECT 'att-001', t.id, 'ch-001', 'ATT-CH-2025-001-2026-05-08', DATE '2026-05-08', 'SOLEIL', 24, 22, 'SIGNE_MOE'
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachements_chantier (id, tenant_id, chantier_id, numero, date, meteo_code, temperature_c, effectif_present, status)
SELECT 'att-002', t.id, 'ch-001', 'ATT-CH-2025-001-2026-05-07', DATE '2026-05-07', 'NUAGEUX', 20, 18, 'CONTRESIGNE_MOA'
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachement_lignes (id, tenant_id, attachement_id, poste_code, designation, quantite_executee, unite, zone, ordre)
SELECT 'att-l-001', t.id, 'att-001', '03.02.01', 'Cloisons carreaux de plâtre ep. 10', 180, 'm²', 'Niveau 3 — Aile Est', 0
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachement_lignes (id, tenant_id, attachement_id, poste_code, designation, quantite_executee, unite, zone, ordre)
SELECT 'att-l-002', t.id, 'att-001', '03.04.01', 'Enduit de ciment façade', 95, 'm²', 'Façade Nord', 1
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachement_lignes (id, tenant_id, attachement_id, poste_code, designation, quantite_executee, unite, zone, ordre)
SELECT 'att-l-003', t.id, 'att-002', '03.02.01', 'Cloisons carreaux de plâtre ep. 10', 160, 'm²', 'Niveau 3 — Aile Ouest', 0
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO attachement_lignes (id, tenant_id, attachement_id, poste_code, designation, quantite_executee, unite, zone, ordre)
SELECT 'att-l-004', t.id, 'att-002', '07.01.03', 'Colonne plomberie DN50', 12, 'ml', 'Gaine technique', 1
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;
