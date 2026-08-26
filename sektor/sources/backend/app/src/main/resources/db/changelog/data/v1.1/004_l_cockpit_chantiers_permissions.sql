-- SEKTOR-191..201 / 209 — scopes CRUX effectifs (permissions complètes) pour le
-- read model chantier, le portefeuille décisionnel et le cycle Étude–Devis–Chantier.
--
-- Ces ajouts vivent dans un changelog PROPRE (et non dans 002_* déjà appliqué) : un
-- changelog déjà exécuté ne doit jamais changer de contenu (checksum Liquibase).
-- SEKTOR-209/P0-4 : `chantiers.chantiers.portefeuille.finance.read` gouverne la visibilité
-- financière (vente/budget/marge) du cockpit et du portefeuille pour DG/DAF/DIRECTEUR.

-- ── Chantiers — read/update/budget (AC-20) ──────────────────────────────────
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-30000000000c', 'BTP_INGENIEUR', 'chantiers.chantiers.chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-30000000000d', 'BTP_INGENIEUR', 'chantiers.chantiers.portefeuille.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000001', 'BTP_CHEF_CHANTIER', 'chantiers.chantiers.chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000002', 'BTP_CHEF_CHANTIER', 'chantiers.chantiers.portefeuille.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000003', 'BTP_CHEF_CHANTIER', 'chantiers.chantiers.chantier.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000005', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000006', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.portefeuille.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000007', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.chantiers.chantier.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000009', 'BTP_DAF', 'chantiers.chantiers.chantier.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-30000000000a', 'BTP_DAF', 'chantiers.chantiers.portefeuille.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-30000000000b', 'BTP_DAF', 'chantiers.chantiers.chantier.budget.read', NOW()),
  -- SEKTOR-209/P0-4 : visibilité financière (cockpit + portefeuille).
  ('c0a5b1d2-e3f4-4a01-9c01-30000000000e', 'BTP_DG', 'chantiers.chantiers.portefeuille.finance.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-30000000000f', 'BTP_DAF', 'chantiers.chantiers.portefeuille.finance.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-300000000010', 'BTP_DIRECTEUR_TRAVAUX', 'chantiers.chantiers.portefeuille.finance.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- ── Études — cycle gain/conversion (AC-16, AC-4) ────────────────────────────
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000211', 'BTP_DIRECTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000212', 'BTP_DIRECTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000213', 'BTP_DIRECTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000214', 'BTP_CONDUCTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000215', 'BTP_CONDUCTEUR_TRAVAUX', 'etudes.etudes.dossier.etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000216', 'BTP_CHEF_CHANTIER', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000217', 'BTP_CHEF_CHANTIER', 'etudes.etudes.dossier.etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000218', 'BTP_INGENIEUR', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000219', 'BTP_INGENIEUR', 'etudes.etudes.dossier.etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000021a', 'BTP_INGENIEUR', 'etudes.etudes.dossier.etude.submit', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000021b', 'BTP_DAF', 'etudes.etudes.dossier.etude.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
