-- Liquibase: doc-extractor data v1.0
-- ETUDES: Ouvrages bibliothèque de prix (header-only bulk import)
INSERT INTO doc_type_definition (
  id,
  domain_key,
  doc_type_key,
  version,
  name,
  description,
  prompt_template,
  json_schema,
  ui_schema,
  excel_mapping,
  is_active,
  status,
  created_at,
  created_by,
  updated_at,
  updated_by
) VALUES (
  'c0d1e2f3-a4b5-4678-c901-234567890123',
  'etudes',
  'OUVRAGES',
  1,
  'Import ouvrages',
  'Bulk import of price-library ouvrages (header only) from Excel, CSV or PDF lists.',
  'You are a document extraction assistant. Extract construction price-library ouvrages (headers only) from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "ouvrages" array.
- Do NOT extract detailed BOM components — only header fields.
- code and designation are required per row.
- category should be one of: TERRASSEMENT, GO, CHARPENTE, ETANCHEITE, CLOISON, REVETEMENT, MENUISERIE, ELECTRICITE, PLOMBERIE, CLIM, PEINTURE, VRD, AUTRE when possible.

Field mapping hints:
- code: Code, Réf, Poste
- designation: Désignation, Libellé, Description, Nom
- category: Catégorie, Corps d''état, Family
- unite: Unité, UoM, Unite',
  '{
    "type": "object",
    "required": ["ouvrages"],
    "properties": {
      "ouvrages": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["code", "designation"],
          "properties": {
            "code": { "type": ["string", "null"], "title": "Code" },
            "designation": { "type": ["string", "null"], "title": "Désignation" },
            "category": { "type": ["string", "null"], "title": "Catégorie" },
            "unite": { "type": ["string", "null"], "title": "Unité" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "importPolicy": "PARTIAL",
    "arrays": [
      {
        "path": "ouvrages",
        "title": "Ouvrages",
        "columns": [
          { "path": "code", "label": "Code", "widthPx": 100 },
          { "path": "designation", "label": "Désignation" },
          { "path": "category", "label": "Catégorie", "widthPx": 120 },
          { "path": "unite", "label": "Unité", "widthPx": 80 }
        ]
      }
    ]
  }'::jsonb,
  NULL,
  TRUE,
  'PUBLISHED',
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
)
ON CONFLICT (domain_key, doc_type_key, version) DO NOTHING;
