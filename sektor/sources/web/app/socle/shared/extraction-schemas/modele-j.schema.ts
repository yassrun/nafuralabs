import type { ExtractionSchemaBundle } from './extraction-schema.types';

/**
 * Extrait modèle J (registre de commerce Maroc) / certificat ICE / statuts.
 * Une ligne = une personne morale.
 */
export const MODELE_J_EXTRACTION_SCHEMA: ExtractionSchemaBundle = {
  name: 'Import modèle J',
  description: 'Extract legal company identity from a Moroccan modèle J, ICE certificate or statutes PDF.',
  arrayPath: 'identites',
  instructions: `You are a document extraction assistant for Moroccan company registry documents
(extrait modèle J, certificat d'inscription au registre de commerce, attestation ICE, statuts).

Return ONLY valid JSON matching the provided JSON Schema.

CRITICAL INSTRUCTIONS:
- Output a single JSON object with an "identites" array (usually one item).
- Map denomination / raison sociale / nom commercial → raisonSociale.
- Map forme juridique (SARL, SA, SARL AU, SAS, …) → formeJuridique.
- ICE: 15 digits, digits only.
- Identifiant fiscal (IF), RC (tribunal + numéro), patente / taxe professionnelle, CNSS.
- Siège social → adresse + ville.
- Capital social → nombre (MAD), no currency symbol.
- Gérant / représentant légal → representantLegalNom + representantLegalQualite.
- Use null when a field is not present — do NOT invent values.`,
  dataSchema: {
    type: 'object',
    required: ['identites'],
    properties: {
      identites: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          required: ['raisonSociale'],
          properties: {
            raisonSociale: { type: ['string', 'null'], title: 'Raison sociale' },
            formeJuridique: { type: ['string', 'null'], title: 'Forme juridique' },
            ice: { type: ['string', 'null'], title: 'ICE' },
            identifiantFiscal: { type: ['string', 'null'], title: 'Identifiant fiscal' },
            rc: { type: ['string', 'null'], title: 'Registre de commerce' },
            patente: { type: ['string', 'null'], title: 'Taxe professionnelle' },
            cnss: { type: ['string', 'null'], title: 'CNSS' },
            tvaIntra: { type: ['string', 'null'], title: 'TVA intra' },
            capitalSocial: { type: ['number', 'string', 'null'], title: 'Capital social' },
            adresse: { type: ['string', 'null'], title: 'Adresse du siège' },
            ville: { type: ['string', 'null'], title: 'Ville' },
            representantLegalNom: { type: ['string', 'null'], title: 'Représentant légal' },
            representantLegalQualite: { type: ['string', 'null'], title: 'Qualité' },
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
        path: 'identites',
        title: 'Identité extraite',
        columns: [
          { path: 'raisonSociale', label: 'Raison sociale' },
          { path: 'formeJuridique', label: 'Forme', widthPx: 100 },
          { path: 'ice', label: 'ICE', widthPx: 150 },
          { path: 'identifiantFiscal', label: 'IF', widthPx: 100 },
          { path: 'rc', label: 'RC', widthPx: 140 },
          { path: 'ville', label: 'Ville', widthPx: 120 },
        ],
      },
    ],
  },
};
