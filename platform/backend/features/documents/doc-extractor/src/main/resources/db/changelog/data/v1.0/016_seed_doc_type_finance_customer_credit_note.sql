-- Liquibase: doc-extractor data v1.0
-- FINANCE/VENTES: Customer credit note (avoir)
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
  'a8b9c0d1-e2f3-4456-a789-012345678901',
  'finance',
  'CUSTOMER_CREDIT_NOTE',
  1,
  'Avoir client',
  'Customer credit note (avoir). Extraction of header, original invoice ref, motif, buyer, and line items.',
  'You are a document extraction assistant. Extract data for a customer credit note (avoir / note de crédit).
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- Use null when a field is missing — do NOT invent amounts.
- This is a CREDIT NOTE, not an invoice. Capture motif / reason when present.
- originalInvoiceNumber is the related invoice number being credited.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).',
  '{
    "type": "object",
    "required": ["creditNoteNumber", "date", "buyer", "lineItems"],
    "properties": {
      "creditNoteNumber": { "type": ["string", "null"], "title": "Credit note number" },
      "originalInvoiceNumber": { "type": ["string", "null"], "title": "Original invoice number" },
      "date": { "type": ["string", "null"], "format": "date", "title": "Date" },
      "motif": { "type": ["string", "null"], "title": "Motif / reason" },
      "currency": { "type": ["string", "null"], "title": "Currency" },
      "buyer": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Buyer / client name" },
          "taxId": { "type": ["string", "null"], "title": "Buyer tax ID" }
        }
      },
      "totals": {
        "type": "object",
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
          "required": ["designation"],
          "properties": {
            "designation": { "type": ["string", "null"], "title": "Designation" },
            "lineTotal": { "type": ["number", "null"], "title": "Line total HT" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "creditNoteNumber", "label": "N°" },
      { "path": "date", "label": "Date" },
      { "path": "originalInvoiceNumber", "label": "Facture" },
      { "path": "buyer.name", "label": "Client" }
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
