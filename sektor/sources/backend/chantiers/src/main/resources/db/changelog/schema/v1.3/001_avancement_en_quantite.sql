-- Avancement en quantité, le pourcentage se calcule — AC-1 à AC-9.
--
-- Lab métier : schéma clean, pas de reprise. Le pourcentage disparaît des trois endroits où
-- il était écrit ; rien ne le remplace en base, il se dérive à la lecture
-- (AvancementLectureService). Les pourcentages déjà stockés ne sont pas migrés.

ALTER TABLE avancements_physiques
    DROP COLUMN IF EXISTS pourcentage;

ALTER TABLE chantier_lots
    DROP COLUMN IF EXISTS avancement_percent;

ALTER TABLE chantiers
    DROP COLUMN IF EXISTS avancement_percent;
