import type { DossierEtude } from '@app/etudes/models';

import { estOuvertPourDelai, kindDelaiListing } from './dossier-listing-delai.util';
import { estMesEtudes } from './dossier-responsables.util';
import {
  DOSSIER_STATUT_LABELS,
  PIPELINE_STATUTS,
  estEnAttente,
  normalizeStatutDossier,
} from './dossier-status.util';

export type MotifAttention = 'EN_RETARD' | 'J7' | 'ATTENTE' | 'SUSPENDED';

export interface EtudesDashboardKpi {
  id: string;
  label: string;
  count: number;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  icon: string;
  queryParams: Record<string, string>;
}

export interface EtudesDashboardAttention {
  id: string;
  numero: string;
  objet: string;
  clientNom: string;
  status: string;
  statusLabel: string;
  chargeEtudeNom: string;
  aoDateLimiteDepot: string | null;
  motif: MotifAttention;
  motifLabel: string;
}

export interface EtudesDashboardPipeline {
  status: string;
  label: string;
  count: number;
}

export interface EtudesDashboardVm {
  ouverts: number;
  kpis: EtudesDashboardKpi[];
  raccourcis: EtudesDashboardKpi[];
  attention: EtudesDashboardAttention[];
  pipeline: EtudesDashboardPipeline[];
}

const MOTIF_LABEL: Record<MotifAttention, string> = {
  EN_RETARD: 'En retard',
  J7: 'Échéance 7 j',
  ATTENTE: 'En attente',
  SUSPENDED: 'Suspendu',
};

const MOTIF_RANK: Record<MotifAttention, number> = {
  EN_RETARD: 0,
  J7: 1,
  ATTENTE: 2,
  SUSPENDED: 3,
};

export function motifAttention(
  item: Pick<DossierEtude, 'aoDateLimiteDepot' | 'status'>,
  today = new Date(),
): MotifAttention | null {
  const delai = kindDelaiListing(item, today);
  if (delai === 'EN_RETARD') return 'EN_RETARD';
  if (delai === 'J7') return 'J7';
  if (normalizeStatutDossier(item.status) === 'SUSPENDED') return 'SUSPENDED';
  if (estEnAttente(item.status)) return 'ATTENTE';
  return null;
}

export function buildEtudesDashboard(
  dossiers: DossierEtude[],
  currentUserId: string | null | undefined,
  today = new Date(),
  currentUserEmail?: string | null,
): EtudesDashboardVm {
  const ouverts = dossiers.filter((d) => estOuvertPourDelai(d.status)).length;
  const enRetard = dossiers.filter((d) => kindDelaiListing(d, today) === 'EN_RETARD').length;
  const j7 = dossiers.filter((d) => kindDelaiListing(d, today) === 'J7').length;
  const enAttente = dossiers.filter((d) => estEnAttente(d.status)).length;
  const aAffecter = dossiers.filter((d) => normalizeStatutDossier(d.status) === 'PENDING_ASSIGNMENT').length;
  const enChiffrage = dossiers.filter((d) => normalizeStatutDossier(d.status) === 'IN_PROGRESS').length;
  const mesEtudes = dossiers.filter((d) =>
    estMesEtudes(d, currentUserId, currentUserEmail),
  ).length;
  const suspendus = dossiers.filter((d) => normalizeStatutDossier(d.status) === 'SUSPENDED').length;
  const avisExecution = dossiers.filter((d) => normalizeStatutDossier(d.status) === 'COMPLETED').length;
  const rejetChiffrage = dossiers.filter((d) => normalizeStatutDossier(d.status) === 'STUDY_REJECTED').length;
  const nonAffectes = dossiers.filter((d) => !d.chargeEtudeUserId).length;

  const kpis: EtudesDashboardKpi[] = [
    {
      id: 'en-retard',
      label: 'En retard',
      count: enRetard,
      variant: 'danger',
      icon: 'warning',
      queryParams: { delaiDepot: 'EN_RETARD' },
    },
    {
      id: 'j7',
      label: 'Échéance 7 j',
      count: j7,
      variant: 'warning',
      icon: 'event',
      queryParams: { delaiDepot: 'J7' },
    },
    {
      id: 'en-attente',
      label: 'En attente',
      count: enAttente,
      variant: 'warning',
      icon: 'hourglass_empty',
      queryParams: { attente: 'OUI' },
    },
    {
      id: 'a-affecter',
      label: 'En attente d’affectation',
      count: aAffecter,
      variant: 'primary',
      icon: 'person_add',
      queryParams: { status: 'PENDING_ASSIGNMENT' },
    },
    {
      id: 'en-chiffrage',
      label: 'En chiffrage',
      count: enChiffrage,
      variant: 'primary',
      icon: 'calculate',
      queryParams: { status: 'IN_PROGRESS' },
    },
    {
      id: 'mes-etudes',
      label: 'Mes études',
      count: mesEtudes,
      variant: 'default',
      icon: 'assignment_ind',
      queryParams: { affectation: 'MOI' },
    },
  ];

  const raccourcis: EtudesDashboardKpi[] = [
    {
      id: 'suspendus',
      label: 'Suspendus',
      count: suspendus,
      variant: 'warning',
      icon: 'pause',
      queryParams: { status: 'SUSPENDED' },
    },
    {
      id: 'avis',
      label: 'Chiffrages terminés',
      count: avisExecution,
      variant: 'warning',
      icon: 'engineering',
      queryParams: { status: 'COMPLETED' },
    },
    {
      id: 'rejet',
      label: 'Refusées par l’étude',
      count: rejetChiffrage,
      variant: 'danger',
      icon: 'undo',
      queryParams: { status: 'STUDY_REJECTED' },
    },
    {
      id: 'non-affecte',
      label: 'Non affectées',
      count: nonAffectes,
      variant: 'default',
      icon: 'person_off',
      queryParams: { affectation: 'NON_AFFECTE' },
    },
    {
      id: 'ce-mois',
      label: 'Dépôt ce mois',
      count: dossiers.filter((d) => {
        const kind = kindDelaiListing(d, today);
        if (kind === 'CLOS' || kind === 'SANS_DATE') return false;
        const day = d.aoDateLimiteDepot?.slice(0, 10);
        if (!day) return false;
        const [y, m] = day.split('-').map(Number);
        return y === today.getFullYear() && m === today.getMonth() + 1;
      }).length,
      variant: 'default',
      icon: 'calendar_month',
      queryParams: { delaiDepot: 'CE_MOIS' },
    },
  ];

  const attention: EtudesDashboardAttention[] = [];
  for (const d of dossiers) {
    const motif = motifAttention(d, today);
    if (!motif) continue;
    attention.push({
      id: d.id,
      numero: d.numero,
      objet: d.objet,
      clientNom: d.clientNom ?? '—',
      status: normalizeStatutDossier(d.status) || d.status,
      statusLabel: DOSSIER_STATUT_LABELS[normalizeStatutDossier(d.status)] ?? d.status,
      chargeEtudeNom: d.chargeEtudeNom ?? '—',
      aoDateLimiteDepot: d.aoDateLimiteDepot ?? null,
      motif,
      motifLabel: MOTIF_LABEL[motif],
    });
  }
  attention.sort((a, b) => {
    const rank = MOTIF_RANK[a.motif] - MOTIF_RANK[b.motif];
    if (rank !== 0) return rank;
    return (a.aoDateLimiteDepot ?? '').localeCompare(b.aoDateLimiteDepot ?? '');
  });
  const attentionTop = attention.slice(0, 8);

  const pipeline: EtudesDashboardPipeline[] = PIPELINE_STATUTS.map((status) => ({
    status,
    label: DOSSIER_STATUT_LABELS[status] ?? status,
    count: dossiers.filter((d) => normalizeStatutDossier(d.status) === status).length,
  }));

  return { ouverts, kpis, raccourcis, attention: attentionTop, pipeline };
}
