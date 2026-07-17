import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const EMPLOYE_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import employés',
  description: 'Bulk import of employee records from Excel, CSV or PDF lists.',
  arrayPath: 'employes',
  instructions: `You are a document extraction assistant. Extract employee records from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "employes" array.
- Map any column headers (Nom, Prénom, CIN, Poste, Salaire, Date embauche, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- nom, prenom and cin are required per row; skip rows without an identifiable person.`,
  dataSchema: {
    type: 'object',
    required: ['employes'],
    properties: {
      employes: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['nom', 'prenom', 'cin'],
          properties: {
            nom: { type: ['string', 'null'], title: 'Nom' },
            prenom: { type: ['string', 'null'], title: 'Prénom' },
            cin: { type: ['string', 'null'], title: 'CIN' },
            poste: { type: ['string', 'null'], title: 'Poste' },
            dateEmbauche: { type: ['string', 'null'], title: 'Date embauche' },
            salaireBase: { type: ['number', 'null'], title: 'Salaire de base' },
            cnss: { type: ['string', 'null'], title: 'CNSS' },
            typeContrat: { type: ['string', 'null'], title: 'Type contrat' },
            departement: { type: ['string', 'null'], title: 'Département' },
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
        path: 'employes',
        title: 'Employés',
        columns: [
          { path: 'nom', label: 'Nom' },
          { path: 'prenom', label: 'Prénom' },
          { path: 'cin', label: 'CIN', widthPx: 120 },
          { path: 'poste', label: 'Poste' },
          { path: 'salaireBase', label: 'Salaire', widthPx: 100 },
        ],
      },
    ],
  },
};
