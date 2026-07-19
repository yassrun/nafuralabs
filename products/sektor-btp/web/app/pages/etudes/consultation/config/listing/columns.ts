import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  BROUILLON: 'default',
  EN_CHIFFRAGE: 'info',
  EN_VALIDATION: 'warning',
  TERMINE: 'success',
  A_VALIDER: 'warning',
  VALIDEE: 'success',
  CONVERTIE: 'info',
  ANNULEE: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_CHIFFRAGE: 'En chiffrage',
  EN_VALIDATION: 'En validation',
  TERMINE: 'Terminé',
  A_VALIDER: 'À valider',
  VALIDEE: 'Validée',
  CONVERTIE: 'Convertie',
  ANNULEE: 'Annulée',
};

export function buildConsultationColumns(t: TranslateService): ColumnConfig[] {
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown): string => {
    if (typeof v !== 'string' || !v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale);
  };
  return [
    {
      key: 'numero',
      label: 'N°',
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'objet',
      label: 'Objet',
      field: 'objet',
      type: 'text',
    },
    {
      key: 'chantierName',
      label: 'Chantier',
      field: 'chantierName',
      type: 'text',
      width: '220px',
      transform: (v: unknown) => (v as string) || '—',
    },
    {
      key: 'status',
      label: 'Statut',
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '130px',
      badgeVariant: (v: unknown) => STATUS_VARIANTS[String(v)] ?? 'default',
      transform: (v: unknown) => STATUS_LABELS[String(v)] ?? String(v ?? ''),
    },
    {
      key: 'createdAt',
      label: 'Créée le',
      field: 'createdAt',
      type: 'text',
      sortable: true,
      width: '130px',
      transform: fmtDate,
    },
  ];
}
