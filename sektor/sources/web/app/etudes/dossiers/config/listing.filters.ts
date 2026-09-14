import type { FilterFieldConfig, LookupItem } from '@platform/lib/anatomy/types';

import { DOSSIER_STATUT_LABELS } from '../utils/dossier-status.util';

export function buildDossierListingFilters(ingenieurs: LookupItem[] = []): FilterFieldConfig[] {
  return [
    {
      key: 'status',
      label: 'État',
      type: 'select',
      placeholder: 'Tous',
      options: Object.entries(DOSSIER_STATUT_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'delaiDepot',
      label: 'Délai de dépôt',
      type: 'select',
      placeholder: 'Tous',
      options: [
        { value: 'EN_RETARD', label: 'En retard' },
        { value: 'J7', label: 'Échéance 7 jours' },
        { value: 'CE_MOIS', label: 'Dépôt ce mois' },
        { value: 'SANS_DATE', label: 'Sans date limite' },
      ],
    },
    {
      key: 'clientId',
      label: 'Client',
      type: 'select',
      lookupKey: 'clients',
      placeholder: 'Tous les clients',
    },
    {
      key: 'affectation',
      label: 'Affectation',
      type: 'select',
      placeholder: 'Toutes',
      options: [
        { value: 'MOI', label: 'Mes études' },
        { value: 'NON_AFFECTE', label: 'Non affectées' },
      ],
    },
    {
      key: 'chargeEtudeUserId',
      label: "Chargé d'étude",
      type: 'select',
      placeholder: 'Tous',
      options: ingenieurs.map((i) => ({ value: i.key, label: i.value })),
    },
    {
      key: 'aoType',
      label: 'Type AO',
      type: 'select',
      placeholder: 'Tous',
      options: [
        { value: 'PUBLIC', label: 'Public' },
        { value: 'PRIVE', label: 'Privé' },
      ],
    },
    {
      key: 'attente',
      label: 'File d’attente',
      type: 'select',
      placeholder: 'Toutes',
      options: [{ value: 'OUI', label: 'En attente d’action' }],
    },
  ];
}

export const DOSSIER_LISTING_QUERY_KEYS = [
  'status',
  'delaiDepot',
  'affectation',
  'clientId',
  'chargeEtudeUserId',
  'aoType',
  'attente',
] as const;

export function readDossierListingFilters(
  get: (key: string) => string | null,
): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const key of DOSSIER_LISTING_QUERY_KEYS) {
    const value = get(key);
    if (value) filters[key] = value;
  }
  return filters;
}

