-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- FINANCE: Receipt
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
  '4a1b1d5a-7b2a-4d61-a0db-2b2b1f1a3333',
  'finance',
  'RECEIPT',
  1,
  'Receipt',
  'Receipt (ticket). Extraction of receipt header, merchant identity, totals, and simple line items when available.',
  'You are a document extraction assistant. Extract data for a Receipt.
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- Use null when a field is missing or not clearly readable.
- Do NOT guess VAT or currency.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).',
  '{
    "type": "object",
    "required": ["receiptNumber", "date", "merchant", "totals", "currency", "items"],
    "properties": {
      "receiptNumber": { "type": ["string", "null"], "title": "Receipt number" },
      "date": { "type": ["string", "null"], "format": "date", "title": "Date" },
      "merchant": {
        "type": "object",
        "required": ["name", "address", "taxId"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Merchant name" },
          "address": { "type": ["string", "null"], "title": "Merchant address" },
          "taxId": { "type": ["string", "null"], "title": "Merchant tax ID" }
        }
      },
      "currency": { "type": ["string", "null"], "title": "Currency" },
      "totals": {
        "type": "object",
        "required": ["subtotal", "vatTotal", "total"],
        "properties": {
          "subtotal": { "type": ["number", "null"], "title": "Subtotal" },
          "vatTotal": { "type": ["number", "null"], "title": "VAT total" },
          "total": { "type": ["number", "null"], "title": "Total" }
        }
      },
      "items": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["designation", "quantity", "unitPrice", "lineTotal"],
          "properties": {
            "designation": { "type": ["string", "null"], "title": "Designation" },
            "quantity": { "type": ["number", "null"], "title": "Quantity" },
            "unitPrice": { "type": ["number", "null"], "title": "Unit price" },
            "lineTotal": { "type": ["number", "null"], "title": "Line total" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "receiptNumber", "label": "Receipt #" },
      { "path": "date", "label": "Date" },
      { "path": "merchant.name", "label": "Merchant" },
      { "path": "totals.total", "label": "Total" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "receiptNumber", "label": "Receipt number" },
          { "path": "date", "label": "Date" },
          { "path": "currency", "label": "Currency" }
        ]
      },
      {
        "title": "Merchant",
        "columns": 2,
        "fields": [
          { "path": "merchant.name", "label": "Name" },
          { "path": "merchant.address", "label": "Address" },
          { "path": "merchant.taxId", "label": "Tax ID" }
        ]
      },
      {
        "title": "Totals",
        "columns": 3,
        "fields": [
          { "path": "totals.subtotal", "label": "Subtotal" },
          { "path": "totals.vatTotal", "label": "VAT total" },
          { "path": "totals.total", "label": "Total" }
        ]
      }
    ],
    "arrays": [
      {
        "path": "items",
        "title": "Items",
        "columns": [
          { "path": "designation", "label": "Designation" },
          { "path": "quantity", "label": "Qty", "widthPx": 90 },
          { "path": "unitPrice", "label": "Unit price", "widthPx": 110 },
          { "path": "lineTotal", "label": "Line total", "widthPx": 110 }
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