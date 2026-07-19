import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const ARTICLE_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import articles',
  description: 'Bulk import of catalogue articles from Excel, CSV or PDF lists.',
  arrayPath: 'articles',
  instructions: `You are a document extraction assistant. Extract catalogue article / product records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "articles" array.
- Map column headers (Code, Référence, Nom, Désignation, Unité, Famille, Prix, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- code and name are required per row.`,
  dataSchema: {
    type: 'object',
    required: ['articles'],
    properties: {
      articles: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['code', 'name'],
          properties: {
            code: { type: ['string', 'null'], title: 'Code' },
            name: { type: ['string', 'null'], title: 'Nom' },
            articleType: { type: ['string', 'null'], title: 'Type' },
            uomCode: { type: ['string', 'null'], title: 'Unité' },
            familleName: { type: ['string', 'null'], title: 'Famille' },
            prixUnitaire: { type: ['number', 'null'], title: 'Prix unitaire' },
            stockMin: { type: ['number', 'null'], title: 'Stock min' },
          },
        },
      },
    },
  },
  presentationSchema: {
    importPolicy: 'PARTIAL',
    rootView: 'DATA_TABLE',
    sections: [],
    arrays: [
      {
        path: 'articles',
        title: 'Articles',
        columns: [
          { path: 'code', label: 'Code', widthPx: 100 },
          { path: 'name', label: 'Nom' },
          { path: 'uomCode', label: 'UoM', widthPx: 80 },
          { path: 'familleName', label: 'Famille' },
          { path: 'prixUnitaire', label: 'Prix', widthPx: 100 },
        ],
      },
    ],
  },
};
