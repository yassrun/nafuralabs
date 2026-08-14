import type { BadgeVariant } from '../../../types';

export interface StatusDef {
  label: string;
  variant: BadgeVariant;
  icon?: string;
  tooltip: string;
}

export type StatusMap = Record<string, StatusDef>;

/**
 * Platform-owned status maps only.
 * Product entity statuses (chantier, marché, BC, …) belong to the product app.
 */
export const STATUS_MAPPING: Record<string, StatusMap> = {
  APPROBATION: {
    EN_ATTENTE: { label: 'En attente', variant: 'warning', tooltip: 'En attente de décision' },
    APPROUVE:   { label: 'Approuvé',   variant: 'success', tooltip: 'Approuvé' },
    REJETE:     { label: 'Rejeté',     variant: 'danger',  tooltip: 'Rejeté' },
    EXPIRE:     { label: 'Expiré',     variant: 'default', tooltip: 'SLA dépassé' },
  },
};

export function resolveStatus(entityType: string, status: string): StatusDef {
  return STATUS_MAPPING[entityType]?.[status] ?? {
    label: status,
    variant: 'default' as BadgeVariant,
    tooltip: status,
  };
}
