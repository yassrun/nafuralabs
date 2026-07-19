-- Lot 9 T9.1 / T9.2 — normaliser article_type et migrer prix_unitaire vers ItemPrice ACHAT_STANDARD

-- MATERIAU (legacy seed) → MATIERE
UPDATE items
SET article_type = 'MATIERE', updated_at = now()
WHERE article_type = 'MATERIAU';

-- Migrer Item.prix_unitaire non null vers ItemPrice ACHAT_STANDARD (devise pivot du tenant)
INSERT INTO item_prices (
    id, tenant_id, item_id, price_type, currency_id, unit_price,
    min_quantity, effective_from, effective_to, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    i.tenant_id,
    i.id,
    'ACHAT_STANDARD',
    c.id,
    i.prix_unitaire,
    NULL,
    CURRENT_DATE,
    NULL,
    now(),
    now()
FROM items i
JOIN currencies c ON c.tenant_id = i.tenant_id AND c.is_reference = true
WHERE i.prix_unitaire IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM item_prices p
      WHERE p.tenant_id = i.tenant_id
        AND p.item_id = i.id
        AND p.price_type = 'ACHAT_STANDARD'
  );

CREATE INDEX IF NOT EXISTS idx_item_prices_lookup
    ON item_prices (tenant_id, item_id, price_type, effective_from DESC);
