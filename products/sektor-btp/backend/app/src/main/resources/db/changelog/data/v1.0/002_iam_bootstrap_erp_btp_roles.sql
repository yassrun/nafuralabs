-- ============================================================
-- IAM Bootstrap (suite) : rôles chantier BTP et permissions applicatives
-- Complète 001_iam_bootstrap_erp.sql, qui est généré depuis le spec applicatif.
--
-- État déclaratif : ce fichier décrit les permissions cibles, pas une suite de
-- modifications. Rejoué à chaque changement (runOnChange), il doit rester idempotent.
-- OWNER / ADMIN / BTP_DG détiennent déjà '*' via 001.
-- ============================================================

-- ── Rôles chantier ──────────────────────────────────────────────────────────

-- Role: BTP_DIRECTEUR_TRAVAUX
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('a1b2c3d4-e5f6-4701-a111-111111111101', 'BTP_DIRECTEUR_TRAVAUX', 'chantiers.*', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111102', 'BTP_DIRECTEUR_TRAVAUX', 'chantiers.viewAll', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111103', 'BTP_DIRECTEUR_TRAVAUX', 'marches.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111104', 'BTP_DIRECTEUR_TRAVAUX', 'achats.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111105', 'BTP_DIRECTEUR_TRAVAUX', 'achats.analytics.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111106', 'BTP_DIRECTEUR_TRAVAUX', 'achats.kpis.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111107', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.requests.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111108', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.requests.update', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111109', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.matrice-pouvoirs.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110a', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.delegations.*', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110b', 'BTP_DIRECTEUR_TRAVAUX', 'rh.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110c', 'BTP_DIRECTEUR_TRAVAUX', 'hse.*', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110d', 'BTP_DIRECTEUR_TRAVAUX', 'ventes.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110e', 'BTP_DIRECTEUR_TRAVAUX', 'stock.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110f', 'BTP_DIRECTEUR_TRAVAUX', 'partner.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111110', 'BTP_DIRECTEUR_TRAVAUX', 'item.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_CHEF_EQUIPE
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('b2c3d4e5-f6a7-4802-b222-222222222201', 'BTP_CHEF_EQUIPE', 'chantiers.read', NOW()),
  ('b2c3d4e5-f6a7-4802-b222-222222222202', 'BTP_CHEF_EQUIPE', 'chantiers.avancement.*', NOW()),
  ('b2c3d4e5-f6a7-4802-b222-222222222203', 'BTP_CHEF_EQUIPE', 'chantiers.photos.*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_MAGASINIER
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c3d4e5f6-a7b8-4903-c333-333333333301', 'BTP_MAGASINIER', 'stock.*', NOW()),
  ('c3d4e5f6-a7b8-4903-c333-333333333302', 'BTP_MAGASINIER', 'item.read', NOW()),
  ('c3d4e5f6-a7b8-4903-c333-333333333303', 'BTP_MAGASINIER', 'chantiers.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_POINTEUR
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('d4e5f6a7-b8c9-4a04-d444-444444444401', 'BTP_POINTEUR', 'rh.pointage.*', NOW()),
  ('d4e5f6a7-b8c9-4a04-d444-444444444402', 'BTP_POINTEUR', 'chantiers.read', NOW()),
  ('d4e5f6a7-b8c9-4a04-d444-444444444403', 'BTP_POINTEUR', 'rh.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_INGENIEUR
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('e5f6a7b8-c9d0-4b05-e555-555555555501', 'BTP_INGENIEUR', 'chantiers.read', NOW()),
  ('e5f6a7b8-c9d0-4b05-e555-555555555502', 'BTP_INGENIEUR', 'chantiers.avancement.read', NOW()),
  ('e5f6a7b8-c9d0-4b05-e555-555555555503', 'BTP_INGENIEUR', 'etudes.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- ── Visibilité entreprise + approbations ────────────────────────────────────

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('f6a7b8c9-d0e1-4c06-f666-666666666601', 'BTP_DG', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666602', 'BTP_DAF', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666603', 'OWNER', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666604', 'ADMIN', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666605', 'BTP_CONDUCTEUR_TRAVAUX', 'approbations.requests.read', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666606', 'BTP_CONDUCTEUR_TRAVAUX', 'approbations.requests.update', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666607', 'BTP_CHEF_CHANTIER', 'approbations.requests.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- ── Scan de documents ───────────────────────────────────────────────────────
-- Actions de scan distinctes des flux create/update.

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('a1b2c3d4-e5f6-4789-a012-3456789abcde', 'BTP_DAF', 'stock.reception.scan', NOW()),
  ('b2c3d4e5-f6a7-4890-b123-456789abcdef', 'BTP_DAF', 'finance.ff.scan', NOW()),
  ('a7b8c9d0-e1f2-4012-a345-6789abcdef01', 'BTP_DAF', 'ventes.bcc.scan', NOW()),
  ('b8c9d0e1-f2a3-4123-b456-789abcdef012', 'BTP_DAF', 'ventes.avoir.scan', NOW()),
  ('c3d4e5f6-a7b8-4901-c234-56789abcdef0', 'BTP_CONDUCTEUR_TRAVAUX', 'stock.reception.scan', NOW()),
  ('d4e5f6a7-b8c9-4012-d345-6789abcdef01', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.commande.scan', NOW()),
  ('c9d0e1f2-a3b4-4234-c567-89abcdef0123', 'BTP_CONDUCTEUR_TRAVAUX', 'ventes.bcc.scan', NOW()),
  ('e5f6a7b8-c9d0-4123-e456-789abcdef012', 'BTP_CHEF_CHANTIER', 'stock.reception.scan', NOW()),
  ('f6a7b8c9-d0e1-4234-f567-89abcdef0123', 'BTP_CHEF_CHANTIER', 'achats.commande.scan', NOW()),
  ('d0e1f2a3-b4c5-4345-d678-9abcdef01234', 'BTP_CHEF_CHANTIER', 'ventes.bcc.scan', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- ── Dossier d'étude ────────────────────────────────────────────────────────
-- L'auteur SOUMET (etude.submit), le N+1 APPROUVE (etude.approve) : l'ingénieur n'a
-- délibérément pas etude.approve. L4 : plus de joker etude.* — permissions énumérées.
-- Garde-fou quatre yeux : CHARGE_ETUDE / REVISEUR via dossier_intervenant (pas seulement createdBy).

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000211', 'BTP_DIRECTEUR_TRAVAUX', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000212', 'BTP_DIRECTEUR_TRAVAUX', 'etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000207', 'BTP_DIRECTEUR_TRAVAUX', 'etude.submit', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000208', 'BTP_DIRECTEUR_TRAVAUX', 'etude.approve', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000213', 'BTP_DIRECTEUR_TRAVAUX', 'etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000209', 'BTP_DIRECTEUR_TRAVAUX', 'etude.delete', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000214', 'BTP_CONDUCTEUR_TRAVAUX', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000215', 'BTP_CONDUCTEUR_TRAVAUX', 'etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000216', 'BTP_CHEF_CHANTIER', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000217', 'BTP_CHEF_CHANTIER', 'etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000203', 'BTP_DAF', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000204', 'BTP_INGENIEUR', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000205', 'BTP_INGENIEUR', 'etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000206', 'BTP_INGENIEUR', 'etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000210', 'BTP_INGENIEUR', 'etude.submit', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
