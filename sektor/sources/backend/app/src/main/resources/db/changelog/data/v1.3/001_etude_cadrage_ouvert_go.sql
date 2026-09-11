-- Cadrage ouvert à tout membre (create + read). Go / no-go : DG / owner.
-- Les annotations @RequirePermission("etude.X") sont préfixées
-- etudes.etudes.dossier.etude.X par PermissionEnforcementFilter.
-- etude.update reste aux rôles métier existants ; après le go le service
-- n’accepte que le chargé d’étude ou le DG.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000401', 'BTP_INGENIEUR', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000402', 'BTP_DIRECTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000403', 'BTP_CONDUCTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000404', 'BTP_CHEF_CHANTIER', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000405', 'BTP_DAF', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000406', 'BTP_MAGASINIER', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000407', 'BTP_MAGASINIER', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000408', 'BTP_CHEF_EQUIPE', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000409', 'BTP_CHEF_EQUIPE', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000040a', 'BTP_POINTEUR', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000040b', 'BTP_POINTEUR', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000040c', 'BTP_DG', 'etudes.etudes.dossier.etude.go', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000040d', 'OWNER', 'etudes.etudes.dossier.etude.go', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
