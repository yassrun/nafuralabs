import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@lib/anatomy/types';
import { BC_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';

const BC_STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info'> = {
  BROUILLON: 'default', VALIDE: 'info', ENVOYE: 'info', ACCUSE_RECEPTION: 'info',
  PARTIELLEMENT_LIVRE: 'warning', LIVRE: 'success', FACTURE: 'success', CLOTURE: 'default', ANNULE: 'danger',
};

function translateOrEmpty(t: TranslateService, key: string): string {
  if (!key) return '';
  const resolved = t.instant(key);
  return resolved === key ? '' : resolved;
}

const RUBRIQUE_KEYS: Record<string, string> = {
  MATERIAUX: 'achats.rubrique.MATERIAUX',
  SOUS_TRAITANCE: 'achats.rubrique.SOUS_TRAITANCE',
  LOCATION_MATERIEL: 'achats.rubrique.LOCATION_MATERIEL_SHORT',
  CARBURANT: 'achats.rubrique.CARBURANT',
  FRAIS_GENERAUX: 'achats.rubrique.FRAIS_GENERAUX_SHORT',
};

export function buildBcColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const locale = resolveLocale(t);
  const fmtDate = (v: unknown) => v ? new Date(v as string).toLocaleDateString(locale) : '—';
  const fmtMad = (v: unknown) =>
    v != null ? Number(v).toLocaleString(locale, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }) : '—';
  return [
    { key: 'numero', label: tr('achats.commande.list.columns.numero'), field: 'numero', type: 'text', sortable: true, width: '140px' },
    { key: 'fournisseurName', label: tr('achats.commande.list.columns.fournisseur'), field: 'fournisseurName', type: 'text', sortable: true },
    {
      key: 'chantierCode',
      label: tr('achats.commande.list.columns.chantierCode'),
      field: 'chantierCode',
      type: 'text',
      sortable: true,
      width: '110px',
      transform: (v) => String(v ?? '—'),
      cellAction: 'openChantier',
    },
    {
      key: 'rubrique', label: tr('achats.commande.list.columns.rubrique'), field: 'rubrique', type: 'badge', sortable: true, width: '120px',
      transform: (v) => translateOrEmpty(t, RUBRIQUE_KEYS[String(v ?? '')] ?? '') || '—',
      badgeVariant: () => 'info',
    },
    { key: 'dateCreation', label: tr('achats.commande.list.columns.dateCreation'), field: 'dateCreation', type: 'text', sortable: true, width: '100px', transform: fmtDate },
    { key: 'dateLivraisonPrevue', label: tr('achats.commande.list.columns.dateLivraisonPrevue'), field: 'dateLivraisonPrevue', type: 'text', sortable: true, width: '120px', transform: fmtDate },
    { key: 'totalHt', label: tr('achats.commande.list.columns.totalHt'), field: 'totalHt', type: 'text', sortable: true, width: '130px', transform: fmtMad },
    {
      key: 'totalLivrePercent', label: tr('achats.commande.list.columns.totalLivrePercent'), field: 'totalLivrePercent', type: 'badge', sortable: true, width: '110px',
      transform: (v) => v != null ? `${v}%` : '—',
      badgeVariant: (v) => { const n = Number(v); return n >= 95 ? 'success' : n >= 30 ? 'info' : 'warning'; },
    },
    {
      key: 'status', label: tr('achats.commande.list.columns.status'), field: 'status', type: 'badge', sortable: true, width: '130px',
      transform: (v) => translateOrEmpty(t, BC_STATUS_KEYS[v as keyof typeof BC_STATUS_KEYS] ?? '') || String(v ?? ''),
      badgeVariant: (v) => BC_STATUS_VARIANTS[String(v)] ?? 'default',
    },
  ];
}
