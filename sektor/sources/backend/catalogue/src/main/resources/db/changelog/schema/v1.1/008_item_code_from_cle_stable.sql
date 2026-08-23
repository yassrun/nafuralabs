-- SEKTOR-132 — articles Extraire / create sans code tenant.
-- Un seul bloc DO $$ (splitStatements: false). Unique (tenant_id, code) : pas d'UPDATE massif.

DO $$
DECLARE
  r record;
  candidate varchar(20);
  base varchar(20);
  n int;
  suffix varchar(8);
  keep int;
BEGIN
  UPDATE items
  SET code = NULL
  WHERE code IS NOT NULL AND btrim(code) = '';

  FOR r IN
    SELECT id, tenant_id, cle_stable
    FROM items
    WHERE code IS NULL
    ORDER BY created_at, id
  LOOP
    base := rtrim(upper(left(COALESCE(NULLIF(btrim(r.cle_stable), ''), 'ART'), 20)), '-');
    IF base IS NULL OR btrim(base) = '' THEN
      base := 'ART';
    END IF;
    candidate := base;
    n := 2;
    WHILE EXISTS (
      SELECT 1 FROM items i
      WHERE i.tenant_id = r.tenant_id
        AND i.code = candidate
        AND i.id <> r.id
    ) LOOP
      suffix := '-' || n::text;
      keep := GREATEST(1, 20 - length(suffix));
      candidate := rtrim(left(base, keep), '-') || suffix;
      n := n + 1;
      IF n > 999 THEN
        candidate := left('A' || replace(r.id::text, '-', ''), 20);
        EXIT;
      END IF;
    END LOOP;
    UPDATE items SET code = candidate WHERE id = r.id;
  END LOOP;

  EXECUTE 'ALTER TABLE items ALTER COLUMN code SET NOT NULL';
END $$;
