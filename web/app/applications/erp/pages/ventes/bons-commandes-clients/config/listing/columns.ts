import type { ColumnConfig } from '@lib/anatomy/types';
// Phase 1.2: centralised keys at `@applications/erp/shell/i18n-labels` → BCC_STATUS_KEYS.

// @i18n-exempt — @deprecated Phase 1.2 — see BCC_STATUS_KEYS in @applications/erp/shell/i18n-labels.
const BCC_STATUS_LABELS: Record<string, string> = {
  RECU: 'Reçu', EN_COURS: 'En cours', PARTIELLEMENT_FACTURE: 'Part. facturé',
  FACTURE: 'Facturé', CLOTURE: 'Clôturé', ANNULE: 'Annulé',
};

const BCC_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info' | 'info'> = {
  RECU: 'info', EN_COURS: 'info', PARTIELLEMENT_FACTURE: 'warning',
  FACTURE: 'success', CLOTURE: 'default', ANNULE: 'danger',
};

// @i18n-exempt — @deprecated Phase 1.2 column config (legacy COLUMNS const, no consumers).
//   Superseded by builder factories pattern (cf. Wave C). Kept for backward compat only.
const fmtDate = (v: unknown): string => {
  if (!v) return '—';
  const d = new Date(v as string);
  // eslint-disable-next-line no-hardcoded-string
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-MA');
};

const fmtMad = (v: unknown): string => {
  if (v == null) return '—';
  // eslint-disable-next-line no-hardcoded-string
  return Number(v).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });
};

export const COLUMNS: ColumnConfig[] = [
  { key: 'numero', label: 'N° BCC', field: 'numero', type: 'text', sortable: true, width: '140px' },
  { key: 'numeroClient', label: 'Réf. client', field: 'numeroClient', type: 'text', sortable: true, width: '160px', transform: (v) => String(v ?? '—') },
  { key: 'clientName', label: 'Client', field: 'clientName', type: 'text', sortable: true, transform: (v) => String(v ?? '—') },
  {
    key: 'chantierCode',
    label: 'Chantier',
    field: 'chantierCode',
    type: 'text',
    sortable: true,
    width: '140px',
    transform: (v) => String(v ?? '—'),
    cellAction: 'openChantier',
  },
  { key: 'dateReception', label: 'Réception', field: 'dateReception', type: 'text', sortable: true, width: '120px', transform: fmtDate },
  { key: 'montantHt', label: 'Montant HT', field: 'montantHt', type: 'text', sortable: true, width: '150px', transform: fmtMad },
  { key: 'montantFactureHt', label: 'Facturé HT', field: 'montantFactureHt', type: 'text', sortable: true, width: '150px', transform: fmtMad },
  {
    key: 'tauxFacturation', label: 'Avancement', field: 'tauxFacturation', type: 'text', width: '120px',
    transform: (v) => `${Number(v)}%`,
  },
  {
    key: 'status', label: 'Statut', field: 'status', type: 'badge', sortable: true, width: '140px',
    transform: (v) => BCC_STATUS_LABELS[String(v)] ?? String(v ?? ''),
    badgeVariant: (v) => BCC_STATUS_VARIANTS[String(v)] ?? 'default',
  },
];
