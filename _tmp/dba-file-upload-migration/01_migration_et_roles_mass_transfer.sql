-- =============================================================================
-- Script unique — mass_transfer
-- 1) Migration fichiers : file_upload.file_entity -> mass_transfer.mst_file
-- 2) Affectation rôles : mst_user.authorities
-- =============================================================================
-- À exécuter UNIQUEMENT sur la base CIBLE :
--   Host     : 10.173.181.76
--   Port     : 5432
--   Database : mass_transfer
--   User     : usrifrecs
--   Password : usrifrecs
--
-- La connexion SOURCE (file_upload) est déjà renseignée dans le dblink ci-dessous.
-- Aucun besoin de se connecter manuellement à file_upload.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Prérequis dblink (idempotent)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS dblink;

-- ---------------------------------------------------------------------------
-- 1) Migration fichiers
--    Source  : file_upload.file_entity (via dblink)
--    Cible   : mass_transfer.mst_file
--    Règles  : data IS NOT NULL ; pas de réinsertion si id déjà présent
-- ---------------------------------------------------------------------------
INSERT INTO mst_file (
    id,
    name,
    content_type,
    size,
    application,
    aft_status,
    aft_date,
    check_sum,
    created_date,
    data
)
SELECT
    src.id,
    src.name,
    src.content_type,
    src.size,
    COALESCE(src.application, 'vm'),
    src.aft_status,
    src.aft_date,
    src.check_sum,
    COALESCE(src.created_date, NOW()),
    src.data
FROM dblink(
    'host=10.173.181.76 port=5432 dbname=file_upload user=usrifrecs password=usrifrecs',
    $$
      SELECT
          id,
          name,
          content_type,
          size,
          application,
          aft_status,
          aft_date,
          check_sum,
          created_date,
          data
      FROM file_entity
      WHERE data IS NOT NULL
    $$
) AS src (
    id            varchar,
    name          varchar,
    content_type  varchar,
    size          bigint,
    application   varchar,
    aft_status    varchar,
    aft_date      timestamp,
    check_sum     varchar,
    created_date  timestamp,
    data          bytea
)
WHERE NOT EXISTS (
    SELECT 1 FROM mst_file t WHERE t.id = src.id
);

-- ---------------------------------------------------------------------------
-- 2) Affectation rôles — contrôle AVANT
-- ---------------------------------------------------------------------------
SELECT id, reference, login, email, authorities
FROM mst_user
WHERE lower(email) IN (
    lower('Mohamed.El-Boujamai@sahambank.com'),
    lower('soufiane.oulmaalem@sahambank.com'),
    lower('Amina.Ihbach@sahambank.com'),
    lower('Hicham.Abouothman@sahambank.com')
);

-- ---------------------------------------------------------------------------
-- 3) Affectation rôles — updates
-- ---------------------------------------------------------------------------
UPDATE mst_user
SET authorities = 'ADMINFONC|ADMINRH|DFD_SUPERVISOR'
WHERE lower(email) = lower('Mohamed.El-Boujamai@sahambank.com');

UPDATE mst_user
SET authorities = 'ADMINFONC|DFD_SUPERVISOR'
WHERE lower(email) = lower('soufiane.oulmaalem@sahambank.com');

UPDATE mst_user
SET authorities = 'ADMINFONC|DFD_SUPERVISOR'
WHERE lower(email) = lower('Amina.Ihbach@sahambank.com');

UPDATE mst_user
SET authorities = 'ADMINFONC'
WHERE lower(email) = lower('Hicham.Abouothman@sahambank.com');

-- ---------------------------------------------------------------------------
-- 4) Affectation rôles — contrôle APRÈS
-- ---------------------------------------------------------------------------
SELECT id, reference, login, email, authorities
FROM mst_user
WHERE lower(email) IN (
    lower('Mohamed.El-Boujamai@sahambank.com'),
    lower('soufiane.oulmaalem@sahambank.com'),
    lower('Amina.Ihbach@sahambank.com'),
    lower('Hicham.Abouothman@sahambank.com')
);

COMMIT;
