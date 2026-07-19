-- Drop legacy fixed responsibility columns (replaced by chantier_affectation).
ALTER TABLE chantiers DROP COLUMN IF EXISTS chef_chantier_user_id;
ALTER TABLE chantiers DROP COLUMN IF EXISTS chef_chantier_name;
ALTER TABLE chantiers DROP COLUMN IF EXISTS conducteur_travaux_user_id;
ALTER TABLE chantiers DROP COLUMN IF EXISTS conducteur_travaux_name;
ALTER TABLE chantiers DROP COLUMN IF EXISTS ingenieur_user_id;
ALTER TABLE chantiers DROP COLUMN IF EXISTS ingenieur_name;
