import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

export function buildEmployeColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtMad = (v: unknown): string => {
    if (v == null) return '—';
    return Number(v).toLocaleString(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });
  };
  return [
    {
      key: 'matricule', label: tr('rh.employe.columns.matricule'), field: 'matricule',
      type: 'text', sortable: true, width: '110px',
    },
    {
      key: 'nom', label: tr('rh.employe.columns.nomPrenom'), field: 'nom',
      type: 'text', sortable: true,
      transform: (_v: unknown, item: unknown) => {
        const row = (item as Record<string, unknown>) ?? {};
        return `${row['nom'] ?? ''} ${row['prenom'] ?? ''}`.trim();
      },
    },
    {
      key: 'poste', label: tr('rh.employe.columns.poste'), field: 'poste',
      type: 'text', sortable: true,
    },
    {
      key: 'categorie', label: tr('rh.employe.columns.categorie'), field: 'categorie',
      type: 'badge', sortable: true,
      transform: (v: unknown) => {
        const value = String(v ?? '');
        const k = `rh.employe.categories.${value}`;
        const translated = t.instant(k);
        return translated === k ? value.replace('_', ' ') : translated;
      },
      badgeVariant: (v: unknown) => {
        const map: Record<string, 'default' | 'info' | 'info' | 'success'> = {
          Ouvrier: 'default', Agent_maitrise: 'info', Cadre: 'info', Direction: 'success',
        };
        return map[String(v)] ?? 'default';
      },
    },
    {
      key: 'typeContrat', label: tr('rh.employe.columns.contrat'), field: 'typeContrat',
      type: 'badge', sortable: true,
      transform: (v: unknown) => {
        const value = String(v ?? '');
        const k = `rh.employe.types.${value}`;
        const translated = t.instant(k);
        return translated === k ? value : translated;
      },
      badgeVariant: (_v: unknown) => 'default',
    },
    {
      key: 'salaireBase', label: tr('rh.employe.columns.salaireBase'), field: 'salaireBase',
      type: 'text', sortable: true, width: '140px',
      transform: fmtMad,
    },
    {
      key: 'anciennete', label: tr('rh.employe.columns.anciennete'), field: 'anciennete',
      type: 'text', width: '100px',
      transform: (v: unknown) => {
        const n = Number(v ?? 0);
        return t.instant('rh.employe.anciennete.count', { count: n });
      },
    },
    {
      key: 'statut', label: tr('rh.employe.columns.statut'), field: 'statut',
      type: 'badge', sortable: true, width: '110px',
      transform: (v: unknown) => {
        const value = String(v ?? '');
        const k = `rh.employe.statuses.${value}`;
        const translated = t.instant(k);
        return translated === k ? value : translated;
      },
      badgeVariant: (v: unknown) => {
        const map: Record<string, 'success' | 'warning' | 'default'> = {
          ACTIF: 'success', SUSPENDU: 'warning', SOLDE: 'default',
        };
        return map[String(v)] ?? 'default';
      },
    },
  ];
}
