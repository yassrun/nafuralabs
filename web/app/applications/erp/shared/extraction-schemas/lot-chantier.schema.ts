import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const LOT_CHANTIER_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import lots chantier (hiérarchique)',
  description: 'Import nested chantier structure: lots, sous-lots and postes.',
  arrayPath: 'lots',
  instructions: `You are a document extraction assistant for construction bill of quantities (BPDE / bordereau des prix).
Return ONLY valid JSON matching the provided JSON Schema.

HIERARCHY (critical):
- "lots" = root / parent lots (e.g. headers "LOT 1 : Terrassement").
- Each lot may contain "sousLots" (section lines without unit) and/or "postes" (articles).
- "postes" = sellable articles with unit (and usually qty / unit price).
- Do NOT flatten articles into the top-level lots array.
- Do NOT invent codes, quantities, or prices. Use null when absent.`,
  dataSchema: {
    type: 'object',
    required: ['lots'],
    properties: {
      lots: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['code', 'designation'],
          properties: {
            code: { type: ['string', 'null'], title: 'Code lot' },
            designation: { type: ['string', 'null'], title: 'Désignation lot' },
            sousLots: {
              type: 'array',
              title: 'Sous-lots',
              items: {
                type: 'object',
                required: ['designation'],
                properties: {
                  code: { type: ['string', 'null'], title: 'Code sous-lot' },
                  designation: { type: ['string', 'null'], title: 'Désignation sous-lot' },
                  postes: {
                    type: 'array',
                    title: 'Postes / articles',
                    items: {
                      type: 'object',
                      required: ['code', 'designation'],
                      properties: {
                        code: { type: ['string', 'null'], title: 'Code article' },
                        designation: { type: ['string', 'null'], title: 'Désignation article' },
                        unite: { type: ['string', 'null'], title: 'Unité' },
                        quantite: { type: ['number', 'null'], title: 'Quantité' },
                        prixUnitaireHt: { type: ['number', 'null'], title: 'PU HT' },
                      },
                    },
                  },
                },
              },
            },
            postes: {
              type: 'array',
              title: 'Postes / articles',
              items: {
                type: 'object',
                required: ['code', 'designation'],
                properties: {
                  code: { type: ['string', 'null'], title: 'Code article' },
                  designation: { type: ['string', 'null'], title: 'Désignation article' },
                  unite: { type: ['string', 'null'], title: 'Unité' },
                  quantite: { type: ['number', 'null'], title: 'Quantité' },
                  prixUnitaireHt: { type: ['number', 'null'], title: 'PU HT' },
                },
              },
            },
          },
        },
      },
    },
  },
  presentationSchema: {
    importPolicy: 'PARTIAL',
    sections: [],
    arrays: [
      {
        path: 'lots',
        title: 'Lots parents',
        columns: [
          { path: 'code', label: 'Code lot', widthPx: 120 },
          { path: 'designation', label: 'Désignation lot' },
        ],
      },
    ],
    hierarchyHint: [
      { level: 'lot', label: 'Lot parent', fields: ['code', 'designation'] },
      { level: 'sousLot', label: 'Sous-lot', fields: ['code', 'designation'] },
      {
        level: 'poste',
        label: 'Poste / article',
        fields: ['code', 'designation', 'unite', 'quantite', 'prixUnitaireHt'],
      },
    ],
  },
};
