-- Demo seeds aligned with web ventes/achats mocks (context seed-demo when enabled in lifecycle).

-- Clients (ventes mock SEED_CLIENTS)
INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'CLI-001', 'OCP Promotion SA', '001234567890123', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'CLIENT', now()
FROM partners p
JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'CLI-001'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'CLI-002', 'ADM (Autoroutes du Maroc)', '000987654321098', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'CLIENT', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'CLI-002'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'CLI-004', 'Ministère Éducation Nationale', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'CLIENT', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'CLI-004'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'CLI-005', 'Commune Mohammedia', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'CLIENT', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'CLI-005'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'CLI-006', 'Atlas Hospitality', '003456789012345', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'CLIENT', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'CLI-006'
ON CONFLICT DO NOTHING;

-- Fournisseurs (achats mock — subset)
INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, registre_commerce, patente, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'F-001', 'Sonasid', '001239745000082', 'RC-7823', 'PT-45621', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'FOURNISSEUR', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'F-001'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, registre_commerce, patente, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'F-002', 'Ciments du Maroc – Agence Casa', '002847593000087', 'RC-12041', 'PT-78901', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'FOURNISSEUR', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'F-002'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, registre_commerce, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'F-003', 'COFA – Coffrage & Acier', '003715829000043', 'RC-33091', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'FOURNISSEUR', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'F-003'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, registre_commerce, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'F-004', 'Maghreb Aggregats', '004582917000061', 'RC-45671', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'FOURNISSEUR', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'F-004'
ON CONFLICT DO NOTHING;

INSERT INTO partners (id, tenant_id, code, raison_sociale, ice, registre_commerce, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'F-005', 'Engins Pro Location', '005923741000079', 'RC-58901', now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'FOURNISSEUR', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'F-005'
ON CONFLICT DO NOTHING;

-- Dual role: Sonasid also supplies as CLIENT for testing multi-role
INSERT INTO partner_roles (id, tenant_id, partner_id, role, created_at)
SELECT gen_random_uuid(), p.tenant_id, p.id, 'CLIENT', now()
FROM partners p JOIN tenant t ON t.id = p.tenant_id AND t.key = 'nafura'
WHERE p.code = 'F-001'
  AND NOT EXISTS (
    SELECT 1 FROM partner_roles pr
    WHERE pr.partner_id = p.id AND pr.role = 'CLIENT'
  );
