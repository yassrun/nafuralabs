-- SEKTOR-209 revue 27/08 (écart 9) — BTP_CONDUCTEUR_TRAVAUX portait `chantiers.*`
-- (001_iam_bootstrap_erp.sql). Le wildcard couvrait AUSSI les scopes budget et finance,
-- contrairement à la matrice « terrain sans budget ni finance » du contrat cockpit (AC-20).
-- On retire le wildcard et on énumère les scopes terrain réellement utilisés par le
-- conducteur : lecture/écriture du chantier, avancement, attachement, situation, journal,
-- lots, documents, photos, zones et coûts réels. Budget (budget-chantier, poste-budgetaire.*,
-- debourse-noeud.update) et finance restent interdits au terrain.
DELETE FROM role_permission WHERE role_code = 'BTP_CONDUCTEUR_TRAVAUX' AND permission = 'chantiers.*';

-- L'ancienne révision de 004 (avant revue) accordait le budget au chef et au conducteur,
-- contrairement à la matrice « terrain sans budget » (AC-20). 004 ayant déjà été appliqué,
-- on retire ici ces deux sur-grants de façon corrective.
DELETE FROM role_permission
  WHERE role_code IN ('BTP_CHEF_CHANTIER', 'BTP_CONDUCTEUR_TRAVAUX')
    AND permission = 'chantiers.chantiers.chantier.budget.read';

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  -- identité + cockpit + portefeuille (déjà accordés en 004, rappelés pour l'idempotence)
  ('c0a5b1d2-e3f4-4a01-9c01-500000000001', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000002', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000003', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.portefeuille.read', NOW()),
  -- terrain : avancement, attachement, situation
  ('c0a5b1d2-e3f4-4a01-9c01-500000000004', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.avancement-physique.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000005', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.avancement-physique.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000006', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.avancement-physique.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000007', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.attachement-chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000008', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.attachement-chantier.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000009', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.attachement-chantier.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000000a', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.situation-travaux.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000000b', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.situation-travaux.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000000c', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.situation-travaux.update', NOW()),
  -- journal, lots, documents, photos, zones, phases, coûts réels (lecture/écriture terrain)
  ('c0a5b1d2-e3f4-4a01-9c01-50000000000d', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.journal-chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000000e', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.journal-chantier.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000000f', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier-lot.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000010', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier-lot.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000011', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier-lot.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000012', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.document-chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000013', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.document-chantier.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000014', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.photo-chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000015', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.photo-chantier.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000016', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.zone-chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000017', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.zone-chantier.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000018', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier-phase.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-500000000019', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.cout-reel.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000001a', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.cout-reel.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000001b', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.poste-budgetaire.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-50000000001c', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.debourse-noeud.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
