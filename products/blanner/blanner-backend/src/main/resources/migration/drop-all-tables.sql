-- Script SQL pour réinitialiser complètement la base de données
-- ATTENTION: Ce script supprime TOUTES les tables et données
-- Utilisez avec précaution!

BEGIN;

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Supprimer les tables dans l'ordre inverse des dépendances (enfants d'abord, parents ensuite)
DROP TABLE IF EXISTS public.blan_reaction CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.participations CASCADE;
DROP TABLE IF EXISTS public.blans CASCADE;
DROP TABLE IF EXISTS public.blan_times CASCADE;
DROP TABLE IF EXISTS public.blan_locations CASCADE;
DROP TABLE IF EXISTS public.place_optional_tags CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
DROP TABLE IF EXISTS public.place_types CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- Supprimer les schémas si nécessaire (optionnel)
-- DROP SCHEMA IF EXISTS data CASCADE;

-- Supprimer les tables de suivi Liquibase (pour permettre une réinitialisation complète)
-- Décommentez les lignes suivantes si vous voulez aussi réinitialiser l'historique Liquibase
-- DROP TABLE IF EXISTS public.databasechangelog CASCADE;
-- DROP TABLE IF EXISTS public.databasechangeloglock CASCADE;

COMMIT;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Base de données réinitialisée. Vous pouvez maintenant exécuter les migrations Liquibase.';
END $$;

