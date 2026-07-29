-- Liquibase: doc-extractor data v1.0
-- RH: Employés bulk import (Excel/PDF list)
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
  'e6f7a8b9-c0d1-4234-e567-890123456789',
  'rh',
  'EMPLOYES',
  1,
  'Import employés',
  'Bulk import of employee records from Excel, CSV or PDF lists with heterogeneous column layouts.',
  'You are a document extraction assistant. Extract employee records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "employes" array.
- Map any column headers (Nom, Prénom, CIN, Poste, Salaire, Date embauche, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- nom, prenom and cin are required per row; skip rows without an identifiable person.

Field mapping hints:
- nom: Nom, Last name, Family name
- prenom: Prénom, First name
- cin: CIN, Carte d''identité, ID card
- poste: Poste, Fonction, Job title
- dateEmbauche: Date embauche, Date d''entrée, Hire date (YYYY-MM-DD)
- salaireBase: Salaire, Salaire de base, Base salary (number)
- cnss: CNSS, Numéro CNSS
- typeContrat: Type contrat, CDI, CDD
- departement: Département, Service',
  '{
    "type": "object",
    "required": ["employes"],
    "properties": {
      "employes": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["nom", "prenom", "cin"],
          "properties": {
            "nom": { "type": ["string", "null"], "title": "Nom" },
            "prenom": { "type": ["string", "null"], "title": "Prénom" },
            "cin": { "type": ["string", "null"], "title": "CIN" },
            "poste": { "type": ["string", "null"], "title": "Poste" },
            "dateEmbauche": { "type": ["string", "null"], "title": "Date embauche" },
            "salaireBase": { "type": ["number", "null"], "title": "Salaire de base" },
            "cnss": { "type": ["string", "null"], "title": "CNSS" },
            "typeContrat": { "type": ["string", "null"], "title": "Type contrat" },
            "departement": { "type": ["string", "null"], "title": "Département" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "importPolicy": "PARTIAL",
    "gridColumns": [
      { "path": "employes.length", "label": "Employés" }
    ],
    "arrays": [
      {
        "path": "employes",
        "title": "Employés",
        "columns": [
          { "path": "nom", "label": "Nom" },
          { "path": "prenom", "label": "Prénom" },
          { "path": "cin", "label": "CIN", "widthPx": 120 },
          { "path": "poste", "label": "Poste" },
          { "path": "salaireBase", "label": "Salaire", "widthPx": 100 }
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
