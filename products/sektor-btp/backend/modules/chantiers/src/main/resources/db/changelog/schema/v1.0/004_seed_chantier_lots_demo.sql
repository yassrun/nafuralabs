-- Demo lots aligned with chantiers-mock.service (context seed-demo when enabled in lifecycle).

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-001-lot-01', t.id, 'ch-001', '01', 'Gros oeuvre', 'm3', 3200, 93, 1, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-001-lot-02', t.id, 'ch-001', '02', 'Clos couvert', 'm2', 4100, 19, 2, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-001-lot-03', t.id, 'ch-001', '03', 'Second oeuvre', 'm2', 5200, 2, 3, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-001-lot-04', t.id, 'ch-001', '04', 'VRD et abords', 'm2', 1800, 0, 4, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-002-lot-01', t.id, 'ch-002', '01', 'Fondations profondes', 'U', 128, 90, 1, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-002-lot-02', t.id, 'ch-002', '02', 'Tablier principal', 'ff', 1, 19, 2, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-002-lot-03', t.id, 'ch-002', '03', 'Equipements et securite', 'ff', 1, 0, 3, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-003-lot-01', t.id, 'ch-003', '01', 'Structure', 'm3', 2800, 97, 1, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-003-lot-02', t.id, 'ch-003', '02', 'Corps d etat techniques', 'ff', 1, 21, 2, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-003-lot-03', t.id, 'ch-003', '03', 'Finitions medicales', 'ff', 1, 0, 3, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-004-lot-01', t.id, 'ch-004', '01', 'Voirie et plateformes', 'm2', 15000, 79, 1, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-004-lot-02', t.id, 'ch-004', '02', 'Reseaux humides', 'ml', 4600, 82, 2, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-004-lot-03', t.id, 'ch-004', '03', 'Eclairage exterieur', 'ff', 1, 32, 3, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-005-lot-01', t.id, 'ch-005', '01', 'Demolition et gros oeuvre', 'ff', 1, 100, 1, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-005-lot-02', t.id, 'ch-005', '02', 'MEP et domotique', 'ff', 1, 86, 2, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-005-lot-03', t.id, 'ch-005', '03', 'Decoration et exterior', 'ff', 1, 36, 3, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-006-lot-01', t.id, 'ch-006', '01', 'Batiments pedagogiques', 'm2', 5400, 61, 1, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-006-lot-02', t.id, 'ch-006', '02', 'Amenagements sportifs', 'm2', 2800, 79, 2, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO chantier_lots (
    id, tenant_id, chantier_id, code, designation, unite, quantite,
    avancement_percent, ordre, created_at, updated_at
)
SELECT 'ch-006-lot-03', t.id, 'ch-006', '03', 'Lots techniques', 'ff', 1, 53, 3, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;
