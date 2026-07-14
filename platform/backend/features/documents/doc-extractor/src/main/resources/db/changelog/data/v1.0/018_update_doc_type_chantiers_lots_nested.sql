-- Upgrade existing LOTS v1 (already seeded flat) to nested BPDE-aligned schema.
UPDATE doc_type_definition
SET
  name = 'Import lots chantier (hiérarchique)',
  description = 'Import nested chantier structure: parent lots, optional sous-lots, and postes (articles) with quantities — BPDE-style bordereaux.',
  prompt_template = 'You are a document extraction assistant for construction bill of quantities (BPDE / bordereau des prix).
Return ONLY valid JSON matching the provided JSON Schema.

HIERARCHY (critical):
- "lots" = root / parent lots (e.g. headers "LOT 1 : Terrassement").
- Each lot may contain "sousLots" (section lines without unit) and/or "postes" (articles).
- "postes" = sellable articles with unit (and usually qty / unit price). Codes often look like "1.2".
- Do NOT flatten articles into the top-level lots array.
- Do NOT invent codes, quantities, or prices. Use null when absent.

Field mapping:
- Lot header: "LOT N : label" → code LNN (or provided code) + designation
- Sous-lot: designation (and optional code), no unit
- Poste/article: code, designation, unite, quantite, prixUnitaireHt

Parse numbers with "." or "," decimal separators.',
  json_schema = '{
    "type": "object",
    "required": ["lots"],
    "properties": {
      "lots": {
        "type": "array",
        "minItems": 0,
        "items": {
          "type": "object",
          "required": ["code", "designation"],
          "properties": {
            "code": { "type": ["string", "null"], "title": "Code lot" },
            "designation": { "type": ["string", "null"], "title": "Désignation lot" },
            "sousLots": {
              "type": "array",
              "title": "Sous-lots",
              "items": {
                "type": "object",
                "required": ["designation"],
                "properties": {
                  "code": { "type": ["string", "null"], "title": "Code sous-lot" },
                  "designation": { "type": ["string", "null"], "title": "Désignation sous-lot" },
                  "postes": {
                    "type": "array",
                    "title": "Postes / articles",
                    "items": {
                      "type": "object",
                      "required": ["code", "designation"],
                      "properties": {
                        "code": { "type": ["string", "null"], "title": "Code article" },
                        "designation": { "type": ["string", "null"], "title": "Désignation article" },
                        "unite": { "type": ["string", "null"], "title": "Unité" },
                        "quantite": { "type": ["number", "null"], "title": "Quantité" },
                        "prixUnitaireHt": { "type": ["number", "null"], "title": "PU HT" }
                      }
                    }
                  }
                }
              }
            },
            "postes": {
              "type": "array",
              "title": "Postes / articles",
              "items": {
                "type": "object",
                "required": ["code", "designation"],
                "properties": {
                  "code": { "type": ["string", "null"], "title": "Code article" },
                  "designation": { "type": ["string", "null"], "title": "Désignation article" },
                  "unite": { "type": ["string", "null"], "title": "Unité" },
                  "quantite": { "type": ["number", "null"], "title": "Quantité" },
                  "prixUnitaireHt": { "type": ["number", "null"], "title": "PU HT" }
                }
              }
            }
          }
        }
      }
    }
  }'::jsonb,
  ui_schema = '{
    "importPolicy": "PARTIAL",
    "gridColumns": [
      { "path": "lots.length", "label": "Lots" }
    ],
    "arrays": [
      {
        "path": "lots",
        "title": "Lots parents",
        "columns": [
          { "path": "code", "label": "Code lot", "widthPx": 120 },
          { "path": "designation", "label": "Désignation lot" }
        ]
      }
    ],
    "hierarchyHint": [
      { "level": "lot", "label": "Lot parent", "fields": ["code", "designation"] },
      { "level": "sousLot", "label": "Sous-lot", "fields": ["code", "designation"] },
      { "level": "poste", "label": "Poste / article", "fields": ["code", "designation", "unite", "quantite", "prixUnitaireHt"] }
    ]
  }'::jsonb,
  updated_at = CURRENT_TIMESTAMP,
  updated_by = 'system'
WHERE domain_key = 'chantiers'
  AND doc_type_key = 'LOTS'
  AND version = 1;
