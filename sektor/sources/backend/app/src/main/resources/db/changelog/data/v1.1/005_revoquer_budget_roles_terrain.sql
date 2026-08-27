-- SEKTOR-209/P0-4 — un seed v1.0 déjà exécuté a pu accorder budget.read
-- aux rôles terrain. La matrice AC-20 réserve la finance à OWNER/DG/DAF/
-- DIRECTEUR_TRAVAUX : cette migration corrective est séparée afin de ne pas
-- modifier le checksum des changelogs déjà appliqués.
DELETE FROM role_permission
WHERE role_code IN ('BTP_CHEF_CHANTIER', 'BTP_CONDUCTEUR_TRAVAUX')
  AND permission = 'chantiers.chantiers.chantier.budget.read';
