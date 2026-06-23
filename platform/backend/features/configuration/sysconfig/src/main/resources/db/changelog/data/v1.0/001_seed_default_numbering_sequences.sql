-- Seed 5 default numbering sequences per tenant (INV, PO, SO, QUO, DN)

INSERT INTO numbering_sequences (id, tenant_id, code, name, prefix, separator, reset_policy, year_format, current_number, increment_by, pad_length, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'INV', 'Invoice Numbering', 'INV', '-', 'YEARLY', 'YYYY', 0, 1, 4, now(), now()
FROM tenant t
WHERE NOT EXISTS (SELECT 1 FROM numbering_sequences ns WHERE ns.tenant_id = t.id AND ns.code = 'INV');

INSERT INTO numbering_sequences (id, tenant_id, code, name, prefix, separator, reset_policy, year_format, current_number, increment_by, pad_length, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'PO', 'Purchase Order', 'PO', '-', 'YEARLY', 'YYYY', 0, 1, 4, now(), now()
FROM tenant t
WHERE NOT EXISTS (SELECT 1 FROM numbering_sequences ns WHERE ns.tenant_id = t.id AND ns.code = 'PO');

INSERT INTO numbering_sequences (id, tenant_id, code, name, prefix, separator, reset_policy, year_format, current_number, increment_by, pad_length, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'SO', 'Sales Order', 'SO', '-', 'YEARLY', 'YYYY', 0, 1, 4, now(), now()
FROM tenant t
WHERE NOT EXISTS (SELECT 1 FROM numbering_sequences ns WHERE ns.tenant_id = t.id AND ns.code = 'SO');

INSERT INTO numbering_sequences (id, tenant_id, code, name, prefix, separator, reset_policy, year_format, current_number, increment_by, pad_length, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'QUO', 'Quotation', 'QUO', '-', 'YEARLY', 'YYYY', 0, 1, 4, now(), now()
FROM tenant t
WHERE NOT EXISTS (SELECT 1 FROM numbering_sequences ns WHERE ns.tenant_id = t.id AND ns.code = 'QUO');

INSERT INTO numbering_sequences (id, tenant_id, code, name, prefix, separator, reset_policy, year_format, current_number, increment_by, pad_length, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'DN', 'Delivery Note', 'DN', '-', 'YEARLY', 'YYYY', 0, 1, 4, now(), now()
FROM tenant t
WHERE NOT EXISTS (SELECT 1 FROM numbering_sequences ns WHERE ns.tenant_id = t.id AND ns.code = 'DN');
