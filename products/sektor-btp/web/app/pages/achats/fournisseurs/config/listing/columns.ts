import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';

const NOTATION_LABELS: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★', 4: '★★★★', 5: '★★★★★' };

export function buildFournisseurColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    { key: 'code', label: tr('achats.fournisseur.list.columns.code'), field: 'code', type: 'text', sortable: true, width: '90px' },
    { key: 'raisonSociale', label: tr('achats.fournisseur.list.columns.raisonSociale'), field: 'raisonSociale', type: 'text', sortable: true },
    { key: 'ice', label: tr('achats.fournisseur.list.columns.ice'), field: 'ice', type: 'text', width: '155px', transform: (v) => String(v ?? '—') },
    {
      key: 'categories', label: tr('achats.fournisseur.list.columns.categories'), field: 'categories', type: 'text',
      transform: (v) => Array.isArray(v) ? (v as string[]).join(', ') : '—',
    },
    { key: 'ville', label: tr('achats.fournisseur.list.columns.ville'), field: 'ville', type: 'text', sortable: true, width: '110px', transform: (v) => String(v ?? '—') },
    {
      key: 'notation', label: tr('achats.fournisseur.list.columns.notation'), field: 'notation', type: 'badge', sortable: true, width: '100px',
      transform: (v) => NOTATION_LABELS[Number(v)] ?? '—',
      badgeVariant: (v) => {
        const n = Number(v);
        if (n >= 4) return 'success';
        if (n >= 3) return 'warning';
        return 'danger';
      },
    },
    {
      key: 'delaiLivraisonMoyen', label: tr('achats.fournisseur.list.columns.delaiLivraisonMoyen'), field: 'delaiLivraisonMoyen', type: 'text',
      sortable: true, width: '110px',
      transform: (v) => v != null ? tr('achats.fournisseur.list.transform.joursSuffix').replace('{n}', String(v)) : '—',
    },
    {
      key: 'isActive', label: tr('achats.fournisseur.list.columns.status'), field: 'isActive', type: 'badge', sortable: true, width: '90px',
      transform: (v) => v
        ? tr('achats.fournisseur.list.transform.actif')
        : tr('achats.fournisseur.list.transform.inactif'),
      badgeVariant: (v) => v ? 'success' : 'default',
    },
  ];
}
