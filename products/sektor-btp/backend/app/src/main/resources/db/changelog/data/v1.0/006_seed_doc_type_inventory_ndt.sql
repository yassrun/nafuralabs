-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- INVENTORY: NDT (Note de Transfert)
-- =============================================================================
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
  '8a571b12-6c7f-4e52-8f7c-640d9c9e82d2',
  'inventory',
  'NDT',
  1,
  'Note de transfert',
  'Note de transfert (inventory transfer). Extraction of header + locations + lines.',
  'You are a document extraction assistant. Extract data for a Note de Transfert (NDT).
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- If a required field is not found in the document, you MUST use null (not an empty string, not placeholder text, not guessed values).
- Do NOT fill required fields with wrong data, placeholder text, or made-up values. Keep them as null if the information is not clearly present in the document.
- Only extract information that is explicitly visible and clearly readable in the document.
- If you are uncertain about a value, use null rather than guessing.

Formatting rules:
- Dates must be YYYY-MM-DD format.
- Numbers must be numeric values (not strings).
- If a field cannot be found, use null for that field.',
  '{
    "type": "object",
    "required": ["transferReference", "date", "fromLocation", "toLocation", "lines"],
    "properties": {
      "transferReference": { "type": "string", "title": "Transfer reference" },
      "date": { "type": "string", "format": "date", "title": "Date" },
      "reason": { "type": "string", "title": "Reason" },
      "fromLocation": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "code": { "type": "string", "title": "From code" },
          "name": { "type": "string", "title": "From name" }
        }
      },
      "toLocation": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "code": { "type": "string", "title": "To code" },
          "name": { "type": "string", "title": "To name" }
        }
      },
      "lines": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["sku", "quantity", "uom"],
          "properties": {
            "sku": { "type": "string", "title": "SKU" },
            "description": { "type": "string", "title": "Description" },
            "quantity": { "type": "number", "title": "Quantity" },
            "uom": { "type": "string", "title": "Unit" },
            "lotNumber": { "type": "string", "title": "Lot number" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "transferReference", "label": "Transfer Ref" },
      { "path": "date", "label": "Date" },
      { "path": "fromLocation.name", "label": "From" },
      { "path": "toLocation.name", "label": "To" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "transferReference", "label": "Transfer reference" },
          { "path": "date", "label": "Date" },
          { "path": "reason", "label": "Reason" }
        ]
      },
      {
        "title": "From location",
        "columns": 2,
        "fields": [
          { "path": "fromLocation.code", "label": "Code" },
          { "path": "fromLocation.name", "label": "Name" }
        ]
      },
      {
        "title": "To location",
        "columns": 2,
        "fields": [
          { "path": "toLocation.code", "label": "Code" },
          { "path": "toLocation.name", "label": "Name" }
        ]
      }
    ],
    "arrays": [
      {
        "path": "lines",
        "title": "Lines",
        "columns": [
          { "path": "sku", "label": "SKU", "widthPx": 140 },
          { "path": "description", "label": "Description" },
          { "path": "quantity", "label": "Qty", "widthPx": 90 },
          { "path": "uom", "label": "UoM", "widthPx": 90 },
          { "path": "lotNumber", "label": "Lot", "widthPx": 140 }
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