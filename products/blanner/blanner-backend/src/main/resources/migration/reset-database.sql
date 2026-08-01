-- Script SQL complet pour réinitialiser la base de données et Liquibase
-- ATTENTION: Ce script supprime TOUTES les tables, données ET l'historique Liquibase
-- Utilisez uniquement en développement!

BEGIN;

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = 'replica';

-- Supprimer toutes les tables dans l'ordre inverse des dépendances
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

-- Supprimer les tables de suivi Liquibase (pour réinitialiser complètement)
DROP TABLE IF EXISTS public.databasechangelog CASCADE;
DROP TABLE IF EXISTS public.databasechangeloglock CASCADE;

-- Supprimer les schémas si nécessaire
DROP SCHEMA IF EXISTS data CASCADE;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

COMMIT;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Base de données complètement réinitialisée. Liquibase va recréer toutes les tables au prochain démarrage.';
END $$;

