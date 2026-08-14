import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const TYPE_VARIANTS: Record<string, 'default' | 'info' | 'warning'> = {
  DEPOT: 'info',
  ENTREPOT: 'info',
  CHANTIER: 'warning',
  TRANSIT: 'default',
  VIRTUEL: 'default',
};

function formatCapacite(row: Record<string, unknown>, locale: string): string {
  const m3 = row['capaciteM3'] as number | undefined;
  const t = row['capaciteTonnes'] as number | undefined;
  const parts: string[] = [];
  if (m3 != null && m3 > 0) parts.push(`${m3.toLocaleString(locale)} m³`);
  if (t != null && t > 0) parts.push(`${t.toLocaleString(locale)} t`);
  return parts.length ? parts.join(' · ') : '—';
}

export function buildDepotColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  return [
    {
      key: 'code',
      label: tr('inventory.configuration.depot.list.columns.code'),
      field: 'code',
      type: 'text',
      sortable: true,
      width: '120px',
    },
    {
      key: 'name',
      label: tr('inventory.configuration.depot.list.columns.name'),
      field: 'name',
      type: 'text',
      sortable: true,
    },
    {
      key: 'type',
      label: tr('inventory.configuration.depot.list.columns.type'),
      field: 'type',
      type: 'badge',
      width: '130px',
      badgeVariant: (value: unknown) => TYPE_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => {
        const key = `inventory.enums.locationType.${String(value)}`;
        const resolved = t.instant(key);
        return resolved === key ? String(value ?? '') : resolved;
      },
    },
    {
      key: 'ville',
      label: tr('inventory.configuration.depot.list.columns.ville'),
      field: 'ville',
      type: 'text',
      width: '130px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'capacite',
      label: tr('inventory.configuration.depot.list.columns.capacite'),
      field: 'capaciteM3',
      type: 'text',
      width: '140px',
      transform: (_v: unknown, item: unknown) =>
        item && typeof item === 'object' ? formatCapacite(item as Record<string, unknown>, locale) : '—',
    },
    {
      key: 'responsableNom',
      label: tr('inventory.configuration.depot.list.columns.responsableNom'),
      field: 'responsableNom',
      type: 'text',
      width: '160px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'projectRef',
      label: tr('inventory.configuration.depot.list.columns.projectRef'),
      field: 'projectRef',
      type: 'text',
      width: '150px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'isActive',
      label: tr('inventory.configuration.depot.list.columns.isActive'),
      field: 'isActive',
      type: 'badge',
      width: '90px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('inventory.common.active') : tr('inventory.common.inactive')),
    },
  ];
}
