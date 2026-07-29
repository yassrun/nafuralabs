-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- LOGISTIC: Packing List
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
  'b8e4c1f0-5e7f-4c44-a9d4-8b1df5a02c11',
  'logistic',
  'PACKING_LIST',
  1,
  'Packing list',
  'Packing list. Extraction of header + shipper/consignee + packages + items.',
  'You are a document extraction assistant. Extract data for a Packing List.
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- If a field is not found, use null. Do not invent values.
- Only extract values that are explicitly present and clearly readable.
- If uncertain, use null.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).
- Do NOT guess currency, totals, weights, or quantities when not explicit.',
  '{
    "type": "object",
    "required": ["packingListReference", "date", "shipper", "consignee", "packages", "items"],
    "properties": {
      "packingListReference": { "type": ["string", "null"], "title": "Packing list reference" },
      "date": { "type": ["string", "null"], "format": "date", "title": "Date" },
      "issuer": { "type": ["string", "null"], "title": "Issuer" },
      "shipper": {
        "type": "object",
        "required": ["name", "address"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Shipper name" },
          "address": { "type": ["string", "null"], "title": "Shipper address" }
        }
      },
      "consignee": {
        "type": "object",
        "required": ["name", "address"],
        "properties": {
          "name": { "type": ["string", "null"], "title": "Consignee name" },
          "address": { "type": ["string", "null"], "title": "Consignee address" }
        }
      },
      "packages": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["packageRef", "packageType", "packageCount", "grossWeightKg", "netWeightKg"],
          "properties": {
            "packageRef": { "type": ["string", "null"], "title": "Package reference" },
            "packageType": { "type": ["string", "null"], "title": "Package type" },
            "packageCount": { "type": ["number", "null"], "title": "Package count" },
            "grossWeightKg": { "type": ["number", "null"], "title": "Gross weight (kg)" },
            "netWeightKg": { "type": ["number", "null"], "title": "Net weight (kg)" }
          }
        }
      },
      "items": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["itemReference", "designation", "quantity", "uom"],
          "properties": {
            "itemReference": { "type": ["string", "null"], "title": "Item reference" },
            "designation": { "type": ["string", "null"], "title": "Designation" },
            "quantity": { "type": ["number", "null"], "title": "Quantity" },
            "uom": { "type": ["string", "null"], "title": "Unit" },
            "packageRef": { "type": ["string", "null"], "title": "Package reference" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "packingListReference", "label": "Ref" },
      { "path": "date", "label": "Date" },
      { "path": "shipper.name", "label": "Shipper" },
      { "path": "consignee.name", "label": "Consignee" }
    ],
    "sections": [
      {
        "title": "Header",
        "columns": 2,
        "fields": [
          { "path": "packingListReference", "label": "Reference" },
          { "path": "date", "label": "Date" },
          { "path": "issuer", "label": "Issuer" }
        ]
      },
      {
        "title": "Parties",
        "columns": 2,
        "fields": [
          { "path": "shipper.name", "label": "Shipper name" },
          { "path": "shipper.address", "label": "Shipper address" },
          { "path": "consignee.name", "label": "Consignee name" },
          { "path": "consignee.address", "label": "Consignee address" }
        ]
      }
    ],
    "arrays": [
      {
        "path": "packages",
        "title": "Packages",
        "columns": [
          { "path": "packageRef", "label": "Ref", "widthPx": 140 },
          { "path": "packageType", "label": "Type" },
          { "path": "packageCount", "label": "Count", "widthPx": 90 },
          { "path": "grossWeightKg", "label": "Gross (kg)", "widthPx": 110 },
          { "path": "netWeightKg", "label": "Net (kg)", "widthPx": 110 }
        ]
      },
      {
        "path": "items",
        "title": "Items",
        "columns": [
          { "path": "itemReference", "label": "Ref", "widthPx": 140 },
          { "path": "designation", "label": "Designation" },
          { "path": "quantity", "label": "Qty", "widthPx": 90 },
          { "path": "uom", "label": "UoM", "widthPx": 90 },
          { "path": "packageRef", "label": "Pkg Ref", "widthPx": 140 }
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