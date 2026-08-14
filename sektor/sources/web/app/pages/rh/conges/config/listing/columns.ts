import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

export function buildCongeColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (!v) return '—';
    const d = new Date(v as string);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(locale);
  };
  return [
    {
      key: 'numero', label: tr('rh.conge.columns.numero'), field: 'numero',
      type: 'text', sortable: true, width: '140px',
    },
    {
      key: 'employeNom', label: tr('rh.conge.columns.employe'), field: 'employeNom',
      type: 'text', sortable: true,
      transform: (v: unknown) => String(v ?? '—'),
    },
    {
      key: 'type', label: tr('rh.conge.columns.type'), field: 'type',
      type: 'badge', sortable: true,
      transform: (v: unknown) => {
        const value = String(v ?? '');
        const k = `rh.conge.types.${value}`;
        const translated = t.instant(k);
        return translated === k ? value : translated;
      },
      badgeVariant: (v: unknown) => {
        const map: Record<string, 'info' | 'warning' | 'info' | 'default' | 'default'> = {
          ANNUEL: 'info', MALADIE: 'warning', MATERNITE: 'info',
          SANS_SOLDE: 'default', EXCEPTIONNEL: 'default',
        };
        return map[String(v)] ?? 'default';
      },
    },
    {
      key: 'dateDebut', label: tr('rh.conge.columns.debut'), field: 'dateDebut',
      type: 'text', sortable: true, width: '120px',
      transform: fmtDate,
    },
    {
      key: 'dateFin', label: tr('rh.conge.columns.fin'), field: 'dateFin',
      type: 'text', sortable: true, width: '120px',
      transform: fmtDate,
    },
    {
      key: 'nombreJours', label: tr('rh.conge.columns.jours'), field: 'nombreJours',
      type: 'number', width: '80px',
    },
    {
      key: 'status', label: tr('rh.conge.columns.statut'), field: 'status',
      type: 'badge', sortable: true, width: '120px',
      transform: (v: unknown) => {
        const value = String(v ?? '');
        const k = `rh.conge.statuses.${value}`;
        const translated = t.instant(k);
        return translated === k ? value : translated;
      },
      badgeVariant: (v: unknown) => {
        const map: Record<string, 'info' | 'success' | 'danger' | 'info' | 'default'> = {
          DEMANDE: 'info', APPROUVE: 'success', REFUSE: 'danger',
          EN_COURS: 'info', SOLDE: 'default',
        };
        return map[String(v)] ?? 'default';
      },
    },
  ];
}
