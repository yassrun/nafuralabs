/** Read model cockpit (SEKTOR-196/197) — instantané de lecture composé côté serveur. */
export interface CockpitIdentity {
  chantierId: string;
  code: string;
  nom: string;
  client: string;
  status: string;
  sourceVente?: string | null;
  devisNumero?: string | null;
  fraicheur?: string | null;
}

export interface CockpitMontant {
  montant?: number | null;
  devise?: string | null;
  base?: string | null;
  source?: string | null;
  fraicheur?: string | null;
  etat: 'AVAILABLE' | 'NOT_AVAILABLE' | 'FORBIDDEN';
  cause?: string | null;
}

export interface CockpitSchedule {
  dateDemarrage?: string | null;
  dateFinPrevue?: string | null;
  dateFinReelle?: string | null;
  osReference?: string | null;
  osDateEffet?: string | null;
  joursRestantsOuRetard?: number | null;
  enRetard: boolean;
  absence?: string | null;
}

export interface CockpitFinance {
  montantVenteActifHt?: CockpitMontant | null;
  debourseInitialHt?: CockpitMontant | null;
  budgetReviseHt?: CockpitMontant | null;
  margeProjeteeHt?: CockpitMontant | null;
  margeProjeteePct?: CockpitMontant | null;
}

export interface CockpitFluxMois {
  etape?: string | null;
  periode?: string | null;
  premiereAction?: string | null;
  actionnable: boolean;
}

export interface CockpitProgress {
  avancementPercent?: CockpitMontant | null;
  factureHt?: CockpitMontant | null;
  encaisseTtc?: CockpitMontant | null;
  fluxMois?: CockpitFluxMois | null;
}

export interface CockpitPreparation {
  code: string;
  etat: 'BLOQUANT' | 'A_FAIRE' | 'OK' | 'NON_APPLICABLE' | 'INDISPONIBLE';
  libelle: string;
  action: string;
  raison?: string | null;
}

export interface CockpitAlerte {
  code: string;
  severite: 'CRITICAL' | 'WARNING' | 'INFO';
  faitSource?: string | null;
  dateFait?: string | null;
  valeurObservee?: number | null;
  regle?: string | null;
  sourceId?: string | null;
  message: string;
  action?: string | null;
}

export interface CockpitNextAction {
  priorite: number;
  libelle: string;
  route: string;
  permission?: string | null;
}

export interface CockpitActivityFeed {
  date?: string | null;
  type?: string | null;
  auteur?: string | null;
  contenu?: string | null;
}

export interface CockpitChantier {
  identity?: CockpitIdentity | null;
  schedule?: CockpitSchedule | null;
  finance?: CockpitFinance | null;
  progress?: CockpitProgress | null;
  preparation: CockpitPreparation[];
  alerts: CockpitAlerte[];
  nextActions: CockpitNextAction[];
  activityFeed: CockpitActivityFeed[];
}
