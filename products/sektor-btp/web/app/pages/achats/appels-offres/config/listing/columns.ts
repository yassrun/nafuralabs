import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { AO_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const AO_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  BROUILLON: 'default', PUBLIEE: 'info', CLOTUREE: 'warning',
  ATTRIBUEE: 'success', INFRUCTUEUSE: 'danger', ANNULEE: 'danger',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

export function buildAoColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown) => v ? new Date(v as string).toLocaleDateString(locale) : '—';
  const fmtMad = (v: unknown) =>
    v != null && Number(v) > 0
      ? Number(v).toLocaleString(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 })
      : '—';
  return [
    { key: 'numero', label: tr('achats.appelOffre.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '130px' },
    { key: 'objet', label: tr('achats.appelOffre.list.columns.objet'), field: 'objet', type: 'text', sortable: true },
    {
      key: 'chantierCode',
      label: tr('achats.appelOffre.list.columns.chantierCode'),
      field: 'chantierCode',
      type: 'text',
      width: '110px',
      transform: (v) => String(v ?? '—'),
      cellAction: 'openChantier',
    },
    { key: 'nbInvites', label: tr('achats.appelOffre.list.columns.nbInvites'), field: 'nbInvites', type: 'number', width: '70px' },
    { key: 'nbReponses', label: tr('achats.appelOffre.list.columns.nbReponses'), field: 'nbReponses', type: 'number', width: '80px' },
    { key: 'dateLimiteDepot', label: tr('achats.appelOffre.list.columns.dateLimiteDepot'), field: 'dateLimiteDepot', type: 'text', sortable: true, width: '120px', transform: fmtDate },
    { key: 'totalAttribueHt', label: tr('achats.appelOffre.list.columns.totalAttribueHt'), field: 'totalAttribueHt', type: 'text', width: '130px', transform: fmtMad },
    {
      key: 'status', label: tr('achats.appelOffre.list.columns.status'), field: 'status', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, AO_STATUS_KEYS[v as keyof typeof AO_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => AO_STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
