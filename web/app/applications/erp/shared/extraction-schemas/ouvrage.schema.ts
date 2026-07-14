import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const OUVRAGE_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import ouvrages',
  description: 'Bulk import of price-library ouvrages (header only).',
  arrayPath: 'ouvrages',
  instructions: `You are a document extraction assistant. Extract construction price-library ouvrages (headers only) from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "ouvrages" array.
- Do NOT extract detailed BOM components — only header fields.
- code and designation are required per row.`,
  dataSchema: {
    type: 'object',
    required: ['ouvrages'],
    properties: {
      ouvrages: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['code', 'designation'],
          properties: {
            code: { type: ['string', 'null'], title: 'Code' },
            designation: { type: ['string', 'null'], title: 'Désignation' },
            category: { type: ['string', 'null'], title: 'Catégorie' },
            unite: { type: ['string', 'null'], title: 'Unité' },
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
        path: 'ouvrages',
        title: 'Ouvrages',
        columns: [
          { path: 'code', label: 'Code', widthPx: 100 },
          { path: 'designation', label: 'Désignation' },
          { path: 'category', label: 'Catégorie', widthPx: 120 },
          { path: 'unite', label: 'Unité', widthPx: 80 },
        ],
      },
    ],
  },
};
