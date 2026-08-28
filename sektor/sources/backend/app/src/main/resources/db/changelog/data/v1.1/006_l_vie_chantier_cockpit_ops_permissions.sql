-- SEKTOR-221 — magasinier : lire le cockpit (réception BL du chantier).
-- Chef : documents chantier (déjà update, lecture documents explicite).
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-600000000001', 'BTP_MAGASINIER', 'chantiers.chantiers.chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000002', 'BTP_MAGASINIER', 'achats.achats.bon-commande-achat.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000003', 'BTP_MAGASINIER', 'achats.bon-commande-achat.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000004', 'BTP_MAGASINIER', 'achats.achats.bon-commande-achat.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000005', 'BTP_CHEF_CHANTIER', 'chantiers.chantiers.document-chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000006', 'BTP_CHEF_CHANTIER', 'chantiers.chantiers.document-chantier.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000007', 'BTP_CHEF_CHANTIER', 'achats.achats.bon-commande-achat.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000008', 'BTP_CHEF_CHANTIER', 'achats.bon-commande-achat.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000009', 'BTP_CHEF_CHANTIER', 'achats.achats.bon-commande-achat.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-60000000000a', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.achats.demande-achat.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-60000000000b', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.achats.demande-achat.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-60000000000c', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.demande-achat.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000010', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.achats.demande-achat.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-600000000011', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.demande-achat.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-60000000000d', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.achats.bon-commande-achat.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-60000000000e', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.achats.bon-commande-achat.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-60000000000f', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.achats.bon-commande-achat.update', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
