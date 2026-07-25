-- Backfill client_id Études/Devis : codes legacy → Partner UUID (rôle CLIENT).
-- Idempotent : ne touche que les valeurs non-UUID. Ne mappe pas cli-default / orphelins.

-- Devis : map par code Partner (insensible à la casse)
UPDATE devis d
SET client_id = p.id::text,
    client_name = COALESCE(NULLIF(TRIM(d.client_name), ''), p.raison_sociale)
FROM partners p
WHERE d.tenant_id = p.tenant_id
  AND d.client_id IS NOT NULL
  AND d.client_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND lower(d.client_id) = lower(p.code);

-- Dossiers : map par code Partner
UPDATE dossiers_etude de
SET client_id = p.id::text,
    client_nom = COALESCE(NULLIF(TRIM(de.client_nom), ''), p.raison_sociale)
FROM partners p
WHERE de.tenant_id = p.tenant_id
  AND de.client_id IS NOT NULL
  AND de.client_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND lower(de.client_id) = lower(p.code);

-- Dossiers avec seulement client_nom : correspondance exacte (unique) sur raison sociale CLIENT
UPDATE dossiers_etude de
SET client_id = matched.id::text,
    client_nom = matched.raison_sociale
FROM (
    SELECT
        p.tenant_id,
        lower(trim(p.raison_sociale)) AS nom_norm,
        MIN(p.id::text) AS id,
        MIN(p.raison_sociale) AS raison_sociale,
        COUNT(*) AS n
    FROM partners p
    JOIN partner_roles pr
      ON pr.partner_id = p.id
     AND pr.tenant_id = p.tenant_id
     AND pr.role = 'CLIENT'
    GROUP BY p.tenant_id, lower(trim(p.raison_sociale))
    HAVING COUNT(*) = 1
) matched
WHERE de.client_id IS NULL
  AND de.client_nom IS NOT NULL
  AND de.tenant_id = matched.tenant_id
  AND lower(trim(de.client_nom)) = matched.nom_norm;

CREATE INDEX IF NOT EXISTS idx_dossiers_etude_tenant_client
    ON dossiers_etude (tenant_id, client_id);
