-- Liquibase: doc-extractor data v1.0
-- CHANTIERS: Lots bulk import (Excel/CSV/PDF bordereau list)
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
  'a7b8c9d0-e1f2-4567-a890-1234567890ab',
  'chantiers',
  'LOTS',
  1,
  'Import lots chantier',
  'Bulk import of chantier lot rows from Excel, CSV or PDF bordereaux with heterogeneous column layouts.',
  'You are a document extraction assistant. Extract chantier lot rows from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with a "lots" array.
- Map any column headers (Code, Lot, Désignation, Quantité, Unité, Prix unitaire, PU HT, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- code and designation are required per row; skip rows without both.
- Prefer root lot lines when a hierarchy is present (ignore nested postes / sous-détail unless clearly coded as lots).
- Parse numbers with either "." or "," as decimal separator.

Field mapping hints:
- code: Code, Lot, N°, Réf
- designation: Désignation, Description, Libellé, Intitulé
- quantite: Quantité, Qté, Quantity
- unite: Unité, UoM, Unit
- prixUnitaireHt: Prix unitaire HT, PU HT, Prix unitaire, Unit price',
  '{
    "type": "object",
    "required": ["lots"],
    "properties": {
      "lots": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["code", "designation"],
          "properties": {
            "code": { "type": ["string", "null"], "title": "Code" },
            "designation": { "type": ["string", "null"], "title": "Désignation" },
            "quantite": { "type": ["number", "null"], "title": "Quantité" },
            "unite": { "type": ["string", "null"], "title": "Unité" },
            "prixUnitaireHt": { "type": ["number", "null"], "title": "Prix unitaire HT" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "importPolicy": "PARTIAL",
    "gridColumns": [
      { "path": "lots.length", "label": "Lots" }
    ],
    "arrays": [
      {
        "path": "lots",
        "title": "Lots",
        "columns": [
          { "path": "code", "label": "Code", "widthPx": 120 },
          { "path": "designation", "label": "Désignation" },
          { "path": "quantite", "label": "Quantité", "widthPx": 100 },
          { "path": "unite", "label": "Unité", "widthPx": 80 },
          { "path": "prixUnitaireHt", "label": "PU HT", "widthPx": 110 }
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
