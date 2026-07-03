import type { DetailFieldConfig } from '@lib/anatomy/types';

export const FIELDS: DetailFieldConfig[] = [
  // Section 1: Identification
  { key: 'nom', label: 'Nom *', type: 'text', required: true },
  { key: 'code', label: 'Code', type: 'text', readonly: true },
  {
    key: 'type', label: 'Forme juridique', type: 'select',
    options: [
      { value: 'SA', label: 'SA' },
      { value: 'SARL', label: 'SARL' },
      { value: 'SAS', label: 'SAS' },
      { value: 'Particulier', label: 'Particulier' },
      { value: 'Administration', label: 'Administration' },
      { value: 'Cooperative', label: 'Coopérative' },
    ],
  },
  { key: 'ice', label: 'ICE', type: 'ice', hint: '15 chiffres (identifiant fiscal Maroc)' },
  { key: 'ifFiscal', label: 'Identifiant fiscal (IF)', type: 'text' },
  { key: 'rc', label: 'RC', type: 'text' },
  { key: 'patente', label: 'Patente', type: 'text' },
  { key: 'actif', label: 'Actif', type: 'toggle', defaultValue: true },

  // Section 2: Coordonnées
  { key: 'adresse', label: 'Adresse', type: 'text' },
  { key: 'ville', label: 'Ville *', type: 'text', required: true },
  { key: 'codePostal', label: 'Code postal', type: 'text' },
  { key: 'telephone', label: 'Téléphone', type: 'phone-ma' },
  { key: 'email', label: 'Email', type: 'text' },

  // Section 3: Contact
  { key: 'contactNom', label: 'Nom du contact', type: 'text' },
  { key: 'contactPoste', label: 'Poste', type: 'text' },

  // Section 4: Commercial
  { key: 'conditionPaiementLabel', label: 'Conditions de paiement', type: 'text' },
  { key: 'plafondCredit', label: 'Plafond de crédit (MAD)', type: 'money-ma' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];
