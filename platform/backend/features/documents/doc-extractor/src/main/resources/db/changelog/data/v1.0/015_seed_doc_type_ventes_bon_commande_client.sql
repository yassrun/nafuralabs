-- Liquibase: doc-extractor data v1.0
-- VENTES: Bon de commande client (customer purchase order)
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
  'f7a8b9c0-d1e2-4345-f678-901234567890',
  'ventes',
  'BON_COMMANDE_CLIENT',
  1,
  'Bon de commande client',
  'Customer purchase order (BCC). Extraction of header, client identity, and line items.',
  'You are a document extraction assistant. Extract data for a Bon de Commande Client (customer purchase order received from a client).
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- Use null when a field is missing or not clearly readable.
- client is the ordering customer (buyer). Do NOT invent VAT or totals.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).

Field hints:
- orderReference: client PO number / "N° commande" / "Réf. client"
- date: order / reception date
- client.name: customer company name
- client.taxId: ICE / tax ID',
  '{
    "type": "object",
    "required": ["orderReference", "date", "client", "items"],
    "properties": {
      "orderReference": { "type": ["string", "null"], "title": "Order reference" },
      "date": { "type": ["string", "null"], "format": "date", "title": "Date" },
      "currency": { "type": ["string", "null"], "title": "Currency" },
      "client": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Client name" },
          "address": { "type": ["string", "null"], "title": "Client address" },
          "taxId": { "type": ["string", "null"], "title": "Client tax ID" }
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
      "items": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["designation"],
          "properties": {
            "designation": { "type": ["string", "null"], "title": "Designation" },
            "quantity": { "type": ["number", "null"], "title": "Quantity" },
            "uom": { "type": ["string", "null"], "title": "Unit" },
            "unitPrice": { "type": ["number", "null"], "title": "Unit price" },
            "lineTotal": { "type": ["number", "null"], "title": "Line total" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "orderReference", "label": "Ref" },
      { "path": "date", "label": "Date" },
      { "path": "client.name", "label": "Client" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "orderReference", "label": "Reference" },
          { "path": "date", "label": "Date" }
        ]
      },
      {
        "title": "Client",
        "columns": 2,
        "fields": [
          { "path": "client.name", "label": "Name" },
          { "path": "client.taxId", "label": "Tax ID" }
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
