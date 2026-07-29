-- Liquibase: doc-extractor data v1.0
-- INVENTORY: Articles bulk import (Excel/PDF list)
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
  'b9c0d1e2-f3a4-4567-b890-123456789012',
  'inventory',
  'ARTICLES',
  1,
  'Import articles',
  'Bulk import of catalogue articles from Excel, CSV or PDF lists.',
  'You are a document extraction assistant. Extract catalogue article / product records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "articles" array.
- Map column headers (Code, Référence, Nom, Désignation, Unité, Famille, Prix, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- code and name are required per row.

Field mapping hints:
- code: Code, Réf, SKU, Référence
- name: Nom, Désignation, Libellé, Description
- articleType: Type (MATERIAU, CONSOMMABLE, ENGIN, OUTILLAGE)
- uomCode: Unité, UoM, UOM, Unite
- familleName: Famille, Catégorie, Category
- prixUnitaire: Prix, Prix unitaire, PU
- stockMin: Stock min, Minimum',
  '{
    "type": "object",
    "required": ["articles"],
    "properties": {
      "articles": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["code", "name"],
          "properties": {
            "code": { "type": ["string", "null"], "title": "Code" },
            "name": { "type": ["string", "null"], "title": "Nom" },
            "articleType": { "type": ["string", "null"], "title": "Type" },
            "uomCode": { "type": ["string", "null"], "title": "Unité" },
            "familleName": { "type": ["string", "null"], "title": "Famille" },
            "prixUnitaire": { "type": ["number", "null"], "title": "Prix unitaire" },
            "stockMin": { "type": ["number", "null"], "title": "Stock min" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "importPolicy": "PARTIAL",
    "arrays": [
      {
        "path": "articles",
        "title": "Articles",
        "columns": [
          { "path": "code", "label": "Code", "widthPx": 100 },
          { "path": "name", "label": "Nom" },
          { "path": "uomCode", "label": "UoM", "widthPx": 80 },
          { "path": "familleName", "label": "Famille" },
          { "path": "prixUnitaire", "label": "Prix", "widthPx": 100 }
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
