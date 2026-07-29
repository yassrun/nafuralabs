-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- LOGISTIC: BL (Bon de Livraison)
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
  '3c5f2c63-5d93-46a2-9ed2-7dbd1047bb01',
  'logistic',
  'BL',
  1,
  'Bon de livraison',
  'Bon de livraison (Delivery Note). Extraction of header + parties + line items.',
  'You are a document extraction assistant. Extract data for a Bon de Livraison (BL).
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
    "required": ["blReference", "date", "sender", "receiver", "items"],
    "properties": {
      "blReference": { "type": "string", "title": "BL Reference" },
      "date": { "type": "string", "format": "date", "title": "Date" },
      "issuer": { "type": "string", "title": "Issuer" },
      "sender": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string", "title": "Sender name" },
          "address": { "type": "string", "title": "Sender address" }
        }
      },
      "receiver": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string", "title": "Receiver name" },
          "address": { "type": "string", "title": "Receiver address" }
        }
      },
      "items": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["itemReference", "itemDesignation", "quantity", "uom"],
          "properties": {
            "itemReference": { "type": "string", "title": "Item ref" },
            "itemDesignation": { "type": "string", "title": "Designation" },
            "quantity": { "type": "number", "title": "Quantity" },
            "uom": { "type": "string", "title": "Unit" },
            "unitPrice": { "type": "number", "title": "Unit price" },
            "totalPrice": { "type": "number", "title": "Total price" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "blReference", "label": "BL Ref" },
      { "path": "date", "label": "Date" },
      { "path": "sender.name", "label": "Sender" },
      { "path": "receiver.name", "label": "Receiver" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "blReference", "label": "BL Reference" },
          { "path": "date", "label": "Date" },
          { "path": "issuer", "label": "Issuer" }
        ]
      },
      {
        "title": "Sender",
        "columns": 2,
        "fields": [
          { "path": "sender.name", "label": "Name" },
          { "path": "sender.address", "label": "Address" }
        ]
      },
      {
        "title": "Receiver",
        "columns": 2,
        "fields": [
          { "path": "receiver.name", "label": "Name" },
          { "path": "receiver.address", "label": "Address" }
        ]
      }
    ],
    "arrays": [
      {
        "path": "items",
        "title": "Items",
        "columns": [
          { "path": "itemReference", "label": "Ref", "widthPx": 140 },
          { "path": "itemDesignation", "label": "Designation" },
          { "path": "quantity", "label": "Qty", "widthPx": 90 },
          { "path": "uom", "label": "UoM", "widthPx": 90 },
          { "path": "unitPrice", "label": "Unit Price", "widthPx": 110 },
          { "path": "totalPrice", "label": "Total", "widthPx": 110 }
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