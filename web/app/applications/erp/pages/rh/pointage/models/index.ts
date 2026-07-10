export type PointageMode = 'PRESENT' | 'ABSENT' | 'CONGE' | 'MALADIE' | 'FORMATION' | 'AUTRE';
export type PointageStatus = 'BROUILLON' | 'VALIDE' | 'CONTESTE';
export type SyncStatus = 'LOCAL' | 'SYNCED' | 'CONFLICT';
export type PointageSignatureMode = 'COLLECTIF' | 'INDIVIDUEL';

export interface Pointage {
  id: string;
  date: string;                     // YYYY-MM-DD
  chantierId: string;
  chantierCode: string;
  employeId: string;
  employeNom: string;
  mode: PointageMode;
  heureArrivee?: string;            // HH:mm
  heureDepart?: string;
  heuresNormales?: number;
  heuresSup?: number;
  pointePar: string;
  geoloc?: { lat: number; lng: number };
  notes?: string;
  status: PointageStatus;
  syncStatus: SyncStatus;
  /** Fingerprint fields last acknowledged as synced (offline conflict detection). */
  lastSyncedFingerprint?: string;
  /** Regroupe une journée pointée équipe (même lot offline). */
  journeeBatchId?: string;
  signatureMode?: PointageSignatureMode;
  /** PNG data URL (léger) — collectif ou individuel selon `signatureMode`. */
  signatureDataUrl?: string;
}

// @i18n-exempt — @deprecated Phase 1.2 — see MODE_KEYS in @applications/erp/shell/i18n-labels.
export const MODE_LABELS: Record<PointageMode, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent',
  CONGE: 'Congé',
  MALADIE: 'Maladie',
  FORMATION: 'Formation',
  AUTRE: 'Autre',
};

export const MODE_EMOJI: Record<PointageMode, string> = {
  PRESENT: '✅',
  ABSENT: '❌',
  CONGE: '🏖',
  MALADIE: '🤒',
  FORMATION: '📚',
  AUTRE: '•',
};

export const MODE_CSS: Record<PointageMode, string> = {
  PRESENT: 'mode--present',
  ABSENT: 'mode--absent',
  CONGE: 'mode--conge',
  MALADIE: 'mode--maladie',
  FORMATION: 'mode--formation',
  AUTRE: 'mode--autre',
};

export interface AffectationEmploye {
  id: string;
  employeId: string;
  employeNom: string;
  chantierId: string;
  chantierCode: string;
  dateDebut: string;
  dateFin?: string;
  fonctionSurChantier?: string;
  /** Part temps multi-chantiers (100 = plein temps). */
  pourcentageTemps?: number;
}
