-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- FINANCE: Supplier Invoice
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
  '4a1b1d5a-7b2a-4d61-a0db-2b2b1f1a1111',
  'finance',
  'SUPPLIER_INVOICE',
  1,
  'Supplier invoice',
  'Supplier invoice. Extraction of invoice header, supplier/customer identities, totals, and line items.',
  'You are a document extraction assistant. Extract data for a Supplier Invoice.
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- Use null when a field is missing or not clearly readable.
- Do NOT guess VAT, totals, or currency. Only extract what is explicit.
- Do NOT infer supplier/customer tax IDs if not present.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).',
  '{
    "type": "object",
    "required": ["invoiceNumber", "date", "supplier", "customer", "totals", "lineItems", "currency"],
    "properties": {
      "invoiceNumber": { "type": ["string", "null"], "title": "Invoice number" },
      "documentReference": { "type": ["string", "null"], "title": "Document reference" },
      "date": { "type": ["string", "null"], "format": "date", "title": "Invoice date" },
      "currency": { "type": ["string", "null"], "title": "Currency (e.g., MAD, EUR)" },
      "supplier": {
        "type": "object",
        "required": ["name", "address", "taxId"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Supplier name" },
          "address": { "type": ["string", "null"], "title": "Supplier address" },
          "taxId": { "type": ["string", "null"], "title": "Supplier tax ID" }
        }
      },
      "customer": {
        "type": "object",
        "required": ["name", "address", "taxId"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Customer name" },
          "address": { "type": ["string", "null"], "title": "Customer address" },
          "taxId": { "type": ["string", "null"], "title": "Customer tax ID" }
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
      "lineItems": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["designation", "quantity", "unitPrice", "vatRate", "lineTotal"],
          "properties": {
            "designation": { "type": ["string", "null"], "title": "Designation" },
            "quantity": { "type": ["number", "null"], "title": "Quantity" },
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
      { "path": "invoiceNumber", "label": "Invoice #" },
      { "path": "date", "label": "Date" },
      { "path": "supplier.name", "label": "Supplier" },
      { "path": "totals.total", "label": "Total" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "invoiceNumber", "label": "Invoice number" },
          { "path": "documentReference", "label": "Reference" },
          { "path": "date", "label": "Date" },
          { "path": "currency", "label": "Currency" }
        ]
      },
      {
        "title": "Supplier",
        "columns": 2,
        "fields": [
          { "path": "supplier.name", "label": "Name" },
          { "path": "supplier.address", "label": "Address" },
          { "path": "supplier.taxId", "label": "Tax ID" }
        ]
      },
      {
        "title": "Customer",
        "columns": 2,
        "fields": [
          { "path": "customer.name", "label": "Name" },
          { "path": "customer.address", "label": "Address" },
          { "path": "customer.taxId", "label": "Tax ID" }
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
        "path": "lineItems",
        "title": "Line items",
        "columns": [
          { "path": "designation", "label": "Designation" },
          { "path": "quantity", "label": "Qty", "widthPx": 90 },
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