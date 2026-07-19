-- Lot 8 — consultation.* → etude.* (dossier d'étude unifié)
-- 005_consultation_permissions.sql a déjà pu s'exécuter sur les envs existants :
-- on retire les anciennes permissions et on pose les nouvelles.

DELETE FROM role_permission
 WHERE permission = 'consultation.*'
    OR permission LIKE 'consultation.%';

-- Directeur travaux / conducteur : cycle de vie complet étude
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000201', 'BTP_DIRECTEUR_TRAVAUX', 'etude.*', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000202', 'BTP_CONDUCTEUR_TRAVAUX', 'etude.*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- DAF : lecture
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000203', 'BTP_DAF', 'etude.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Ingénieur études : lecture + création + mise à jour
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000204', 'BTP_INGENIEUR', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000205', 'BTP_INGENIEUR', 'etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000206', 'BTP_INGENIEUR', 'etude.update', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Permissions métier complémentaires (soumission / approbation) pour le directeur travaux
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000207', 'BTP_DIRECTEUR_TRAVAUX', 'etude.submit', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000208', 'BTP_DIRECTEUR_TRAVAUX', 'etude.approve', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000209', 'BTP_DIRECTEUR_TRAVAUX', 'etude.delete', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
