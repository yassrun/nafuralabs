import type { ExtractionSchemaBundle } from './extraction-schema.types';

export const DEVIS_CONSULTATION_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import devis fournisseur',
  description: 'Extract quote lines (identity / label, quantity, unit price) from a supplier devis file.',
  arrayPath: 'lignes',
  instructions: `You are a document extraction assistant. Extract supplier quote / devis lines from the uploaded file.
Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with a "lignes" array.
- Each line is a priced item: identity (code / référence / cle_stable), libellé, quantité, unité, prix unitaire.
- Map headers (Référence, Code, Désignation, Libellé, Qté, Quantité, Unité, PU, Prix, Prix unitaire, etc.) to schema fields.
- Use null when a field is not present — do NOT invent values.
- Do NOT create catalogue articles. These are quote lines only.
- A line needs at least identite or libelle.`,
  dataSchema: {
    type: 'object',
    required: ['lignes'],
    properties: {
      lignes: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          properties: {
            identite: { type: ['string', 'null'], title: 'Identité' },
            libelle: { type: ['string', 'null'], title: 'Libellé' },
            quantite: { type: ['number', 'null'], title: 'Quantité' },
            unite: { type: ['string', 'null'], title: 'Unité' },
            prixUnitaire: { type: ['number', 'null'], title: 'Prix unitaire' },
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
        path: 'lignes',
        title: 'Lignes du devis',
        columns: [
          { path: 'identite', label: 'Identité', widthPx: 140 },
          { path: 'libelle', label: 'Libellé' },
          { path: 'quantite', label: 'Qté', widthPx: 80 },
          { path: 'unite', label: 'Unité', widthPx: 80 },
          { path: 'prixUnitaire', label: 'PU', widthPx: 100 },
        ],
      },
    ],
  },
};
