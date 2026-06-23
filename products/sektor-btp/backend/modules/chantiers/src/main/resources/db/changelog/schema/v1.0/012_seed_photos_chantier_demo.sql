-- Demo seeds: 2 geolocated photos for ch-001 (tenant nafura).

INSERT INTO photos_chantier (
    id, tenant_id, chantier_id, filename, content_type, storage_path,
    lat, lng, zone, taken_at, exif_json, uploaded_by
)
SELECT
    'photo-001',
    t.id,
    'ch-001',
    'niveau3-aile-est-2026-05-08.jpg',
    'image/jpeg',
    'photos/ch-001/niveau3-aile-est-2026-05-08.jpg',
    33.5731,
    -7.5898,
    'Niveau 3 — Aile Est',
    TIMESTAMPTZ '2026-05-08 10:32:00+00',
    '{"make":"Apple","model":"iPhone 15","iso":100,"focalLength":"26mm"}'::jsonb,
    'Karim El Mansouri'
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;

INSERT INTO photos_chantier (
    id, tenant_id, chantier_id, filename, content_type, storage_path,
    lat, lng, zone, taken_at, exif_json, uploaded_by
)
SELECT
    'photo-002',
    t.id,
    'ch-001',
    'facade-nord-2026-05-07.jpg',
    'image/jpeg',
    'photos/ch-001/facade-nord-2026-05-07.jpg',
    33.5725,
    -7.5905,
    'Façade Nord',
    TIMESTAMPTZ '2026-05-07 16:15:00+00',
    '{"make":"Samsung","model":"Galaxy S24","iso":200,"focalLength":"24mm"}'::jsonb,
    'Sofia Tazi'
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT (id) DO NOTHING;
