-- Lot 2 — l'ingénieur études doit pouvoir soumettre son étude à validation.
--
-- 006 ne donnait etude.submit qu'au directeur travaux : le rédacteur ne pouvait pas
-- soumettre son propre travail, ce qui bloque le parcours.
--
-- La séparation qui compte est ailleurs : l'auteur SOUMET (etude.submit), le N+1 APPROUVE
-- (etude.approve). L'ingénieur n'a délibérément pas etude.approve — et le service refuse en
-- plus qu'un approbateur valide une étude dont il est l'auteur, sauf paramètre tenant
-- explicite (etudes.auteurPeutValider). C'était le défaut de ConsultationService.validate(),
-- qui changeait le statut sans aucun contrôle sous la permission du rédacteur.

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000210', 'BTP_INGENIEUR', 'etude.submit', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
