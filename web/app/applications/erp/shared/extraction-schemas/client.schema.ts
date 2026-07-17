import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const CLIENT_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import clients',
  description: 'Bulk import of customer records from Excel, CSV or PDF lists.',
  arrayPath: 'clients',
  instructions: `You are a document extraction assistant. Extract customer/client records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with a "clients" array.
- Map any column headers (Nom, Raison sociale, Client, ICE, Email, Téléphone, Ville, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- raisonSociale is required per row; skip rows with no identifiable client name.`,
  dataSchema: {
    type: 'object',
    required: ['clients'],
    properties: {
      clients: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['raisonSociale'],
          properties: {
            raisonSociale: { type: ['string', 'null'], title: 'Raison sociale' },
            ice: { type: ['string', 'null'], title: 'ICE' },
            email: { type: ['string', 'null'], title: 'Email' },
            telephone: { type: ['string', 'null'], title: 'Téléphone' },
            ville: { type: ['string', 'null'], title: 'Ville' },
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
        path: 'clients',
        title: 'Clients',
        columns: [
          { path: 'raisonSociale', label: 'Raison sociale' },
          { path: 'ice', label: 'ICE', widthPx: 140 },
          { path: 'email', label: 'Email' },
          { path: 'telephone', label: 'Téléphone', widthPx: 120 },
          { path: 'ville', label: 'Ville', widthPx: 120 },
        ],
      },
    ],
  },
};
