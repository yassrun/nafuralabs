import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

function categoryLabel(t: TranslateService, value: unknown): string {
  const key = 'chantiers.bibliothequePrix.families.' + String(value);
  const resolved = t.instant(key);
  if (resolved !== key) return resolved;
  return String(value ?? '');
}

export function buildOuvrageColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  return [
    {
      key: 'code',
      label: tr('chantiers.common.fields.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '130px',
    },
    {
      key: 'designation',
      label: tr('chantiers.common.fields.designation'),
      field: 'designation',
      type: 'text',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Catégorie',
      field: 'category',
      type: 'badge',
      sortable: true,
      width: '140px',
      transform: (v: unknown) => categoryLabel(t, v),
      badgeVariant: 'info',
    },
    {
      key: 'unite',
      label: tr('chantiers.common.fields.unite'),
      field: 'unite',
      type: 'text',
      width: '70px',
    },
    {
      key: 'prixUnitaireHt',
      label: 'PU HT (MAD)',
      field: 'prixUnitaireHt',
      type: 'currency',
      sortable: true,
      width: '140px',
    },
    {
      key: 'derniereMaj',
      label: 'Dernière MAJ',
      field: 'derniereMaj',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v: unknown) => {
        if (typeof v !== 'string' || !v) return '—';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
      },
    },
    {
      key: 'isActive',
      label: 'Actif',
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? 'Actif' : 'Inactif'),
    },
  ];
}
