import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const ARTICLE_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import articles',
  description:
    'Import en masse depuis Excel, CSV ou PDF. Liste ou fiche unitaire — détection automatique.',
  arrayPath: 'articles',
  instructions: `You are a document extraction assistant. Extract catalogue article / product records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "articles" array (one element for a single product sheet).
- Map column headers (Code, Référence, Désignation, Nom, Unité, UoM, Famille, Prix, Prix cat., etc.) to schema fields.
- code and name (designation) are required on each row when visible in the source.
- When famille or unité is absent from the file, you MAY infer a reasonable value from the product designation or category context; use null only if no reasonable guess exists.
- Do NOT invent a code. Do NOT invent prices.`,
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
            code: {
              type: ['string', 'null'],
              title: 'Code',
              xNafura: { presence: 'extract' },
            },
            name: {
              type: ['string', 'null'],
              title: 'Désignation',
              xNafura: { presence: 'extract' },
            },
            nature: {
              type: ['string', 'null'],
              title: 'Nature',
              xNafura: { presence: 'infer' },
            },
            uomCode: {
              type: ['string', 'null'],
              title: 'Unité',
              xNafura: { presence: 'infer' },
            },
            familleName: {
              type: ['string', 'null'],
              title: 'Famille',
              xNafura: { presence: 'infer' },
            },
            prixUnitaire: {
              type: ['number', 'null'],
              title: 'Prix catalogue',
              xNafura: { presence: 'optional' },
            },
            stockMin: {
              type: ['number', 'null'],
              title: 'Stock min',
              xNafura: { presence: 'optional' },
            },
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
          { path: 'name', label: 'Désignation' },
          { path: 'uomCode', label: 'Unité', widthPx: 80 },
          { path: 'familleName', label: 'Famille' },
          { path: 'prixUnitaire', label: 'Prix cat.', widthPx: 100 },
        ],
      },
    ],
  },
};
