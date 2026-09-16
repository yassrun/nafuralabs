import type { ExtractionDefinition } from '@platform/app/document-extraction/smart-import';

/**
 * Showroom ExtractionDefinition for the Products listing mock.
 * Same shape as Sektor handlers — no API persistence here.
 */
export const PRODUCT_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'product',
  name: 'Import products',
  description:
    'Import magique showroom — Excel / CSV / PDF → lignes produit (code, name, status).',
  arrayPath: 'products',
  instructions: `Extract product / article rows from the uploaded file.
Return ONLY valid JSON matching the schema.
Output a single object with a "products" array (one element for a single sheet).
Map headers (Code, Référence, Name, Désignation, Status, Description) to fields.
code and name are required when present in the source. Do NOT invent a code.`,
  dataSchema: {
    type: 'object',
    required: ['products'],
    properties: {
      products: {
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
              title: 'Name',
              xNafura: { presence: 'extract' },
            },
            status: {
              type: ['string', 'null'],
              title: 'Status',
              xNafura: { presence: 'optional' },
            },
            description: {
              type: ['string', 'null'],
              title: 'Description',
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
        path: 'products',
        title: 'Products',
        columns: [
          { path: 'code', label: 'Code', widthPx: 100 },
          { path: 'name', label: 'Name' },
          { path: 'status', label: 'Status', widthPx: 90 },
          { path: 'description', label: 'Description' },
        ],
      },
    ],
  },
  dedupeKey: (row) => {
    const code = row['code'];
    return code && String(code).trim() ? String(code).trim() : null;
  },
};
