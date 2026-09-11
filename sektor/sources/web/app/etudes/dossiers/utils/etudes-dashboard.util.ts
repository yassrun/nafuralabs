import type { DossierEtude } from '@app/etudes/models';

import { estOuvertPourDelai, kindDelaiListing } from './dossier-listing-delai.util';
import { estMesEtudes } from './dossier-responsables.util';
import {
  DOSSIER_STATUT_LABELS,
  PIPELINE_STATUTS,
  estEnAttente,
} from './dossier-status.util';

export type MotifAttention = 'EN_RETARD' | 'J7' | 'ATTENTE' | 'SUSPENDU';

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
  SUSPENDU: 'Suspendu',
};

const MOTIF_RANK: Record<MotifAttention, number> = {
  EN_RETARD: 0,
  J7: 1,
  ATTENTE: 2,
  SUSPENDU: 3,
};

export function motifAttention(
  item: Pick<DossierEtude, 'aoDateLimiteDepot' | 'status'>,
  today = new Date(),
): MotifAttention | null {
  const delai = kindDelaiListing(item, today);
  if (delai === 'EN_RETARD') return 'EN_RETARD';
  if (delai === 'J7') return 'J7';
  if (item.status === 'SUSPENDU') return 'SUSPENDU';
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
  const aAffecter = dossiers.filter((d) => d.status === 'A_DECIDER').length;
  const enChiffrage = dossiers.filter((d) => d.status === 'EN_ETUDE').length;
  const mesEtudes = dossiers.filter((d) =>
    estMesEtudes(d, currentUserId, currentUserEmail),
  ).length;
  const suspendus = dossiers.filter((d) => d.status === 'SUSPENDU').length;
  const avisExecution = dossiers.filter((d) => d.status === 'A_AVIS_EXECUTION').length;
  const rejetChiffrage = dossiers.filter((d) => d.status === 'REJETE_CHIFFRAGE').length;
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
      label: 'À affecter',
      count: aAffecter,
      variant: 'primary',
      icon: 'person_add',
      queryParams: { status: 'A_DECIDER' },
    },
    {
      id: 'en-chiffrage',
      label: 'En chiffrage',
      count: enChiffrage,
      variant: 'primary',
      icon: 'calculate',
      queryParams: { status: 'EN_ETUDE' },
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
      queryParams: { status: 'SUSPENDU' },
    },
    {
      id: 'avis',
      label: 'Avis d’exécution',
      count: avisExecution,
      variant: 'warning',
      icon: 'engineering',
      queryParams: { status: 'A_AVIS_EXECUTION' },
    },
    {
      id: 'rejet',
      label: 'Rejet chiffrage',
      count: rejetChiffrage,
      variant: 'danger',
      icon: 'undo',
      queryParams: { status: 'REJETE_CHIFFRAGE' },
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
      status: d.status,
      statusLabel: DOSSIER_STATUT_LABELS[d.status] ?? d.status,
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
    count: dossiers.filter((d) => d.status === status).length,
  }));

  return { ouverts, kpis, raccourcis, attention: attentionTop, pipeline };
}
