import type { DetailSectionConfig } from '@lib/anatomy/types';

export const SECTIONS: DetailSectionConfig[] = [
  {
    id: 'identification',
    title: 'Identification',
    icon: 'building',
    fields: ['nom', 'code', 'type', 'ice', 'rc', 'actif'],
    columns: 2,
  },
  {
    id: 'coordonnees',
    title: 'Coordonnées',
    icon: 'map-pin',
    fields: ['adresse', 'ville', 'codePostal', 'telephone', 'email'],
    columns: 2,
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: 'user',
    fields: ['contactNom', 'contactPoste'],
    columns: 2,
  },
  {
    id: 'commercial',
    title: 'Commercial',
    icon: 'credit-card',
    fields: ['conditionPaiementLabel', 'plafondCredit', 'notes'],
    columns: 2,
  },
];
