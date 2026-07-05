-- Liquibase: doc-extractor data v1.0 (numbered seed; duplicate nested doc_types/**/seed.sql removed).
-- =============================================================================
-- CHANTIERS: Planning Gantt PDF (MS Project export)
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
  'b1c2d3e4-f5a6-4789-b012-3456789abcde',
  'chantiers',
  'PLANNING_GANTT_PDF',
  1,
  'Planning Gantt PDF',
  'MS Project / Gantt PDF export for chantier phases. Extract task list with dates; exclude payment milestones.',
  'You are a document extraction assistant. Extract data for a construction planning Gantt PDF (MS Project export).
Return ONLY valid JSON that matches the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output must be a single JSON object (no markdown, no explanations).
- Use null when a field is missing or not clearly readable.
- Do NOT invent tasks that are not visible in the document.
- Exclude payment milestones (Avance démarrage, Règlement %, financial milestones).
- Mark isPaymentMilestone=true for payment rows even if you include them.

Formatting rules:
- Dates must be YYYY-MM-DD.
- Numbers must be numbers (not strings).',
  '{
    "type": "object",
    "required": ["tasks"],
    "properties": {
      "tasks": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["numero", "designation", "dateDebut", "dateFin"],
          "properties": {
            "numero": { "type": ["number", "null"], "title": "Task number" },
            "designation": { "type": ["string", "null"], "title": "Task name" },
            "dateDebut": { "type": ["string", "null"], "format": "date", "title": "Start date" },
            "dateFin": { "type": ["string", "null"], "format": "date", "title": "End date" },
            "lotHint": { "type": ["string", "null"], "title": "Suggested lot code (L01-L10)" },
            "isPaymentMilestone": { "type": ["boolean", "null"], "title": "Payment milestone flag" },
            "parentNumero": { "type": ["number", "null"], "title": "Parent task number" }
          }
        }
      }
    }
  }'::jsonb,
  '{
    "gridColumns": [
      { "path": "tasks.length", "label": "Tasks" }
    ],
    "arrays": [
      {
        "path": "tasks",
        "title": "Planning tasks",
        "columns": [
          { "path": "numero", "label": "#", "widthPx": 60 },
          { "path": "designation", "label": "Designation" },
          { "path": "dateDebut", "label": "Start", "widthPx": 110 },
          { "path": "dateFin", "label": "End", "widthPx": 110 },
          { "path": "lotHint", "label": "Lot", "widthPx": 70 }
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
