import type { TranslateService } from '@ngx-translate/core';

import type { ColumnConfig } from '@platform/lib/anatomy/types';

import type { ConsultationAchat } from '../../services';

function panierLabel(row: ConsultationAchat): string {
  const cles = row.clesStables ?? [];
  if (!cles.length) return '—';
  const head = cles.slice(0, 2).join(', ');
  return `${head} (${cles.length})`;
}

function destinatairesLabel(row: ConsultationAchat): string {
  const names = (row.destinataires ?? [])
    .map((d) => (d.fournisseurNom || '').trim())
    .filter(Boolean);
  if (!names.length) return '—';
  return `${names.join(', ')} (${names.length})`;
}

function statutCodeLabel(statut: string, t: TranslateService): string {
  const code = (statut || 'PREPARATION').toUpperCase();
  switch (code) {
    case 'COMPLETE':
      return t.instant('achats.consultation.statut.complete');
    case 'PARTIELLE':
      return t.instant('achats.consultation.statut.partielle');
    case 'OUVERTE':
      return t.instant('achats.consultation.statut.ouverte');
    default:
      return t.instant('achats.consultation.statut.preparation');
  }
}

function avancementLabel(row: ConsultationAchat, t: TranslateService): string {
  const n = (row.destinataires ?? []).length;
  const k = row.devisRecus ?? 0;
  return `${k}/${n} · ${statutCodeLabel(row.statut, t)}`;
}

function statutBadge(row: ConsultationAchat): 'success' | 'warning' | 'info' | 'default' {
  const code = (row.statut || '').toUpperCase();
  if (code === 'COMPLETE') return 'success';
  if (code === 'PARTIELLE') return 'warning';
  if (code === 'OUVERTE') return 'info';
  return 'default';
}

function lienLabel(row: ConsultationAchat, t: TranslateService): string {
  return row.dossierEtudeId
    ? t.instant('achats.consultation.lien.liee')
    : t.instant('achats.consultation.lien.hors');
}

export function buildConsultationColumns(t: TranslateService): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'numero',
      label: tr('achats.consultation.list.columns.numero'),
      field: 'numero',
      type: 'text',
      sortable: true,
      width: '140px',
    },
    {
      key: 'destinataires',
      label: tr('achats.consultation.list.columns.destinataires'),
      field: 'destinatairesLabel',
      type: 'text',
      transform: (_v, item) => destinatairesLabel(item as ConsultationAchat),
    },
    {
      key: 'panier',
      label: tr('achats.consultation.list.columns.panier'),
      field: 'clesStables',
      type: 'text',
      transform: (_v, item) => panierLabel(item as ConsultationAchat),
    },
    {
      key: 'statut',
      label: tr('achats.consultation.list.columns.avancement'),
      field: 'statut',
      type: 'badge',
      width: '180px',
      transform: (_v, item) => avancementLabel(item as ConsultationAchat, t),
      badgeVariant: (_v, item) => statutBadge(item as ConsultationAchat),
    },
    {
      key: 'lien',
      label: tr('achats.consultation.list.columns.lien'),
      field: 'dossierEtudeId',
      type: 'text',
      width: '110px',
      transform: (_v, item) => lienLabel(item as ConsultationAchat, t),
    },
  ];
}
