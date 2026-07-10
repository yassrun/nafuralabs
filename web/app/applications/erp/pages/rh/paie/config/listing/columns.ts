import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

export function buildPaieColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtMad = (v: unknown): string => {
    if (v == null) return '—';
    return Number(v).toLocaleString(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });
  };
  return [
    {
      key: 'numero', label: tr('rh.paie.columns.numero'), field: 'numero',
      type: 'text', sortable: true, width: '140px',
    },
    {
      key: 'employeNom', label: tr('rh.paie.columns.employe'), field: 'employeNom',
      type: 'text', sortable: true,
      transform: (v: unknown) => String(v ?? '—'),
    },
    {
      key: 'mois', label: tr('rh.paie.columns.mois'), field: 'mois',
      type: 'text', sortable: true, width: '120px',
      transform: (v: unknown) => {
        const parts = String(v ?? '').split('-');
        return parts.length === 2 ? `${parts[1]}/${parts[0]}` : String(v ?? '—');
      },
    },
    {
      key: 'salaireBrut', label: tr('rh.paie.columns.brut'), field: 'salaireBrut',
      type: 'text', sortable: true, width: '140px',
      transform: fmtMad,
    },
    {
      key: 'totalRetenues', label: tr('rh.paie.columns.retenues'), field: 'totalRetenues',
      type: 'text', sortable: true, width: '130px',
      transform: fmtMad,
    },
    {
      key: 'igr', label: tr('rh.paie.columns.igr'), field: 'igr',
      type: 'text', sortable: true, width: '120px',
      transform: fmtMad,
    },
    {
      key: 'salaireNetAPayer', label: tr('rh.paie.columns.netAPayer'), field: 'salaireNetAPayer',
      type: 'text', sortable: true, width: '150px',
      transform: fmtMad,
    },
    {
      key: 'status', label: tr('rh.paie.columns.statut'), field: 'status',
      type: 'badge', sortable: true, width: '120px',
      transform: (v: unknown) => {
        const value = String(v ?? '');
        const k = `rh.paie.statuses.${value}`;
        const translated = t.instant(k);
        return translated === k ? value : translated;
      },
      badgeVariant: (v: unknown) => {
        const map: Record<string, 'default' | 'info' | 'success'> = {
          BROUILLON: 'default', VALIDEE: 'info', PAYEE: 'success',
        };
        return map[String(v)] ?? 'default';
      },
    },
  ];
}
