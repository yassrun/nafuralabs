-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- CONSTRUCTION / BTP: Devis
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
  '7f1f3b9b-3a1c-4e7b-90c1-0c0c0c0c0001',
  'btp',
  'DEVIS',
  1,
  'Devis',
  'Devis (quotation). Extraction of header, issuer/client, totals, and line items.',
  'You are a document extraction assistant. Extract data for a Devis (Quotation).
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- Use null when a field is missing or not clearly readable.
- Do NOT guess VAT, totals, or currency.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).',
  '{
    "type": "object",
    "required": ["quoteReference", "date", "issuer", "client", "currency", "totals", "items"],
    "properties": {
      "quoteReference": { "type": ["string", "null"], "title": "Devis reference" },
      "date": { "type": ["string", "null"], "format": "date", "title": "Date" },
      "currency": { "type": ["string", "null"], "title": "Currency" },
      "issuer": {
        "type": "object",
        "required": ["name", "address", "taxId"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Issuer name" },
          "address": { "type": ["string", "null"], "title": "Issuer address" },
          "taxId": { "type": ["string", "null"], "title": "Issuer tax ID" }
        }
      },
      "client": {
        "type": "object",
        "required": ["name", "address", "taxId"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Client name" },
          "address": { "type": ["string", "null"], "title": "Client address" },
          "taxId": { "type": ["string", "null"], "title": "Client tax ID" }
        }
      },
      "totals": {
        "type": "object",
        "required": ["subtotal", "vatTotal", "total"],
        "properties": {
          "subtotal": { "type": ["number", "null"], "title": "Subtotal (HT)" },
          "vatTotal": { "type": ["number", "null"], "title": "VAT total" },
          "total": { "type": ["number", "null"], "title": "Total (TTC)" }
        }
      },
      "items": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["designation", "quantity", "uom", "unitPrice", "vatRate", "lineTotal"],
          "properties": {
            "designation": { "type": ["string", "null"], "title": "Designation" },
            "quantity": { "type": ["number", "null"], "title": "Quantity" },
            "uom": { "type": ["string", "null"], "title": "Unit" },
            "unitPrice": { "type": ["number", "null"], "title": "Unit price" },
            "vatRate": { "type": ["number", "null"], "title": "VAT rate (%)" },
            "lineTotal": { "type": ["number", "null"], "title": "Line total" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "quoteReference", "label": "Ref" },
      { "path": "date", "label": "Date" },
      { "path": "client.name", "label": "Client" },
      { "path": "totals.total", "label": "Total" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "quoteReference", "label": "Reference" },
          { "path": "date", "label": "Date" },
          { "path": "currency", "label": "Currency" }
        ]
      },
      {
        "title": "Issuer",
        "columns": 2,
        "fields": [
          { "path": "issuer.name", "label": "Name" },
          { "path": "issuer.address", "label": "Address" },
          { "path": "issuer.taxId", "label": "Tax ID" }
        ]
      },
      {
        "title": "Client",
        "columns": 2,
        "fields": [
          { "path": "client.name", "label": "Name" },
          { "path": "client.address", "label": "Address" },
          { "path": "client.taxId", "label": "Tax ID" }
        ]
      },
      {
        "title": "Totals",
        "columns": 3,
        "fields": [
          { "path": "totals.subtotal", "label": "Subtotal (HT)" },
          { "path": "totals.vatTotal", "label": "VAT total" },
          { "path": "totals.total", "label": "Total (TTC)" }
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
          { "path": "uom", "label": "UoM", "widthPx": 90 },
          { "path": "unitPrice", "label": "Unit price", "widthPx": 110 },
          { "path": "vatRate", "label": "VAT %", "widthPx": 90 },
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