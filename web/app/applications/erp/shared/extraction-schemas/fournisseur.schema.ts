import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const FOURNISSEUR_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import fournisseurs',
  description: 'Bulk import of supplier records from Excel, CSV or PDF lists.',
  arrayPath: 'fournisseurs',
  instructions: `You are a document extraction assistant. Extract supplier records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with a "fournisseurs" array.
- Map any column headers (Nom, Raison sociale, Société, ICE, Email, Téléphone, Ville, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- raisonSociale is required per row; skip rows with no identifiable supplier name.`,
  dataSchema: {
    type: 'object',
    required: ['fournisseurs'],
    properties: {
      fournisseurs: {
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
    sections: [],
    arrays: [
      {
        path: 'fournisseurs',
        title: 'Fournisseurs',
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
