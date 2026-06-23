import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { DA_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const DA_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  BROUILLON: 'default', SOUMISE: 'warning',
  APPROUVEE: 'success', REJETEE: 'danger', CONVERTIE: 'info',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildDemandeColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  const fmtMad = (v: unknown): string => {
    if (v == null) return '—';
    return Number(v).toLocaleString(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });
  };
  return [
    { key: 'numero', label: tr('achats.demande.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '130px' },
    {
      key: 'chantierCode',
      label: tr('achats.demande.list.columns.chantierCode'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '120px',
      transform: (v) => String(v ?? '—'),
      cellAction: 'openChantier',
    },
    { key: 'chantierName', label: tr('achats.demande.list.columns.chantierName'), field: 'chantierName', type: 'text', sortable: true, transform: (v) => String(v ?? '—') },
    { key: 'dateBesoin', label: tr('achats.demande.list.columns.dateBesoin'), field: 'dateBesoin', type: 'text', sortable: true, width: '110px', transform: fmtDate },
    { key: 'demandeurName', label: tr('achats.demande.list.columns.demandeur'), field: 'demandeurName', type: 'text', sortable: true, width: '140px', transform: (v) => String(v ?? '—') },
    { key: 'nbLignes', label: tr('achats.demande.list.columns.nbLignes'), field: 'nbLignes', type: 'number', width: '70px' },
    { key: 'totalEstimeHt', label: tr('achats.demande.list.columns.totalEstimeHt'), field: 'totalEstimeHt', type: 'text', sortable: true, width: '140px', transform: fmtMad },
    {
      key: 'status', label: tr('achats.demande.list.columns.status'), field: 'status', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, DA_STATUS_KEYS[v as keyof typeof DA_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => DA_STATUS_VARIANTS[String(v)] ?? 'default',
    },
    {
      key: 'delaiAttente', label: tr('achats.demande.list.columns.delaiAttente'), field: 'delaiAttente', type: 'badge', width: '100px',
      transform: (v) => v != null ? tr('achats.demande.list.transform.joursSuffix').replace('{n}', String(v)) : '—',
      badgeVariant: (v) => {
        if (v == null) return 'default';
        const n = Number(v);
        return n > 14 ? 'danger' : n > 7 ? 'warning' : 'success';
      },
    },
  ];
}
