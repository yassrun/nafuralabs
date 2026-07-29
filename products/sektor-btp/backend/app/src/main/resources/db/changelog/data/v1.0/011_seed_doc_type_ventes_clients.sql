-- Liquibase: doc-extractor data v1.0
-- VENTES: Clients bulk import (Excel/PDF list)
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
  'd5e6f7a8-b9c0-4123-d456-789012345678',
  'ventes',
  'CLIENTS',
  1,
  'Import clients',
  'Bulk import of customer records from Excel, CSV or PDF lists with heterogeneous column layouts.',
  'You are a document extraction assistant. Extract customer/client records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with a "clients" array.
- Map any column headers (Nom, Raison sociale, Client, ICE, Email, Téléphone, Ville, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- raisonSociale is required per row; skip rows with no identifiable client name.

Field mapping hints:
- raisonSociale: company name, client name, "Nom", "Raison sociale", "Client"
- ice: ICE, Identifiant Commun de l''Entreprise
- email: Email, E-mail, Courriel
- telephone: Téléphone, Tel, GSM, Mobile
- ville: Ville, City',
  '{
    "type": "object",
    "required": ["clients"],
    "properties": {
      "clients": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["raisonSociale"],
          "properties": {
            "raisonSociale": { "type": ["string", "null"], "title": "Raison sociale" },
            "ice": { "type": ["string", "null"], "title": "ICE" },
            "email": { "type": ["string", "null"], "title": "Email" },
            "telephone": { "type": ["string", "null"], "title": "Téléphone" },
            "ville": { "type": ["string", "null"], "title": "Ville" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "importPolicy": "PARTIAL",
    "gridColumns": [
      { "path": "clients.length", "label": "Clients" }
    ],
    "arrays": [
      {
        "path": "clients",
        "title": "Clients",
        "columns": [
          { "path": "raisonSociale", "label": "Raison sociale" },
          { "path": "ice", "label": "ICE", "widthPx": 140 },
          { "path": "email", "label": "Email" },
          { "path": "telephone", "label": "Téléphone", "widthPx": 120 },
          { "path": "ville", "label": "Ville", "widthPx": 120 }
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
