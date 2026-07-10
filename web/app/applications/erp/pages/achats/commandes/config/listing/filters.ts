import type { TranslateService } from '@ngx-translate/core';

import type { FilterFieldConfig } from '@lib/anatomy/types';
import { BC_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export function buildBcFilters(t: TranslateService): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'status', label: tr('achats.commande.list.filters.status'), type: 'select',
      options: [
        { value: 'BROUILLON', label: tr(BC_STATUS_KEYS.BROUILLON) },
        { value: 'VALIDE', label: tr(BC_STATUS_KEYS.VALIDE) },
        { value: 'ENVOYE', label: tr(BC_STATUS_KEYS.ENVOYE) },
        { value: 'ACCUSE_RECEPTION', label: tr(BC_STATUS_KEYS.ACCUSE_RECEPTION) },
        { value: 'PARTIELLEMENT_LIVRE', label: tr(BC_STATUS_KEYS.PARTIELLEMENT_LIVRE) },
        { value: 'LIVRE', label: tr(BC_STATUS_KEYS.LIVRE) },
        { value: 'FACTURE', label: tr(BC_STATUS_KEYS.FACTURE) },
        { value: 'CLOTURE', label: tr(BC_STATUS_KEYS.CLOTURE) },
        { value: 'ANNULE', label: tr(BC_STATUS_KEYS.ANNULE) },
      ],
    },
    { key: 'fournisseurId', label: tr('achats.commande.list.filters.fournisseur'), type: 'select', lookupKey: 'fournisseurs' },
    {
      key: 'rubrique', label: tr('achats.commande.list.filters.rubrique'), type: 'select',
      options: [
        { value: 'MATERIAUX', label: tr('achats.rubrique.MATERIAUX') },
        { value: 'SOUS_TRAITANCE', label: tr('achats.rubrique.SOUS_TRAITANCE') },
        { value: 'LOCATION_MATERIEL', label: tr('achats.rubrique.LOCATION_MATERIEL') },
        { value: 'CARBURANT', label: tr('achats.rubrique.CARBURANT') },
        { value: 'FRAIS_GENERAUX', label: tr('achats.rubrique.FRAIS_GENERAUX') },
      ],
    },
    { key: 'dateFrom', label: tr('achats.commande.list.filters.dateFrom'), type: 'date' },
    { key: 'dateTo', label: tr('achats.commande.list.filters.dateTo'), type: 'date' },
  ];
}
