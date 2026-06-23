import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

export function buildAvancementColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'date',
      label: tr('chantiers.avancement.listing.columns.date'),
      field: 'date',
      type: 'date',
      width: '110px',
      sortable: true,
    },
    {
      key: 'chantierCode',
      label: tr('chantiers.avancement.listing.columns.chantier'),
      field: 'chantierCode',
      type: 'custom',
      width: '140px',
      sortable: true,
      cellAction: 'ouvrir-chantier',
    },
    {
      key: 'lotCode',
      label: tr('chantiers.avancement.listing.columns.lot'),
      field: 'lotCode',
      width: '80px',
      sortable: true,
    },
    {
      key: 'lotDesignation',
      label: tr('chantiers.avancement.listing.columns.designation'),
      field: 'lotDesignation',
      width: '1fr',
      sortable: true,
    },
    {
      key: 'quantiteRealisee',
      label: tr('chantiers.avancement.listing.columns.qtePeriode'),
      field: 'quantiteRealisee',
      type: 'number',
      width: '110px',
      sortable: true,
    },
    {
      key: 'cumulQuantite',
      label: tr('chantiers.avancement.listing.columns.cumul'),
      field: 'cumulQuantite',
      type: 'number',
      width: '110px',
      sortable: true,
    },
    {
      key: 'pourcentage',
      label: tr('chantiers.avancement.listing.columns.pourcentageCumule'),
      field: 'pourcentage',
      type: 'custom',
      width: '150px',
      sortable: true,
    },
    {
      key: 'saisieParName',
      label: tr('chantiers.avancement.listing.columns.saisiPar'),
      field: 'saisieParName',
      width: '150px',
      sortable: true,
    },
    {
      key: 'photos',
      label: tr('chantiers.avancement.listing.columns.photos'),
      field: 'photosCount',
      type: 'custom',
      width: '90px',
      cellAction: 'voir-photos',
    },
  ];
}
