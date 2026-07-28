import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'info' | 'warning' | 'danger'> = {
  DISPONIBLE: 'success',
  AFFECTE: 'info',
  MAINTENANCE: 'warning',
  HORS_SERVICE: 'danger',
};

export function buildMaterielColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.catalogue.materiel.list.columns.code'),
      field: 'code',
      sortable: true,
    },
    {
      key: 'name',
      label: tr('inventory.catalogue.materiel.list.columns.name'),
      field: 'name',
      sortable: true,
    },
    {
      key: 'familleName',
      label: tr('inventory.catalogue.materiel.list.filters.famille'),
      field: 'familleName',
      sortable: true,
    },
    {
      key: 'marqueModele',
      label: tr('inventory.catalogue.materiel.list.columns.marque') + ' / ' + tr('inventory.catalogue.materiel.list.columns.modele'),
      field: 'marque',
      sortable: false,
    },
    {
      key: 'numeroSerie',
      label: tr('inventory.catalogue.materiel.list.columns.numeroSerie'),
      field: 'numeroSerie',
      sortable: true,
    },
    {
      key: 'status',
      label: tr('inventory.catalogue.materiel.list.columns.status'),
      field: 'status',
      type: 'badge',
      badgeVariant: (value: unknown) => STATUS_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const key = `inventory.enums.materielStatus.${String(value)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(value ?? '') : resolved;
      },
    },
    {
      key: 'chantierActuelName',
      label: tr('inventory.catalogue.materiel.list.columns.chantierActuelName'),
      field: 'chantierActuelName',
      sortable: false,
    },
  ];
}
