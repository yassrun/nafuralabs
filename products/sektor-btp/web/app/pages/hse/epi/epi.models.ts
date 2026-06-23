import { EPI_CATEGORIE_KEYS, EPI_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

export type EpiStatus = 'OK' | 'A_RENOUVELER' | 'EXPIRE' | 'PERDU';
export type EpiCategorie = 'TETE' | 'YEUX' | 'PIEDS' | 'MAINS' | 'CORPS' | 'RESPIRATION' | 'AUDITION' | 'CHUTE';

export interface EpiRecord {
  id: string;
  reference: string;
  designation: string;
  categorie: EpiCategorie;
  marque: string;
  normeCE?: string;
  employeId: string;
  employeNom: string;
  chantierId?: string;
  chantierCode?: string;
  dateAttribution: string;
  dateExpiration?: string;
  prixUnitaire: number;
  status: EpiStatus;
  dateDerniereVerification?: string;
  prochaineVerification?: string;
}

export type EpiVolet = 'reference' | 'attribution' | 'verification';

export const CAT_LABEL_KEYS: Record<EpiCategorie, string> = EPI_CATEGORIE_KEYS;

export const CAT_ICON: Record<EpiCategorie, string> = {
  TETE: '⛑️', YEUX: '🥽', PIEDS: '👟', MAINS: '🧤',
  CORPS: '🦺', RESPIRATION: '😷', AUDITION: '🎧', CHUTE: '🪝',
};

export const STATUS_CSS: Record<EpiStatus, string> = {
  OK: 'badge--success', A_RENOUVELER: 'badge--warning',
  EXPIRE: 'badge--danger', PERDU: 'badge--danger',
};

export const STATUS_LABEL_KEYS: Record<EpiStatus, string> = EPI_STATUS_KEYS;

export function daysUntilExpiry(date: string, ref = new Date().toISOString().slice(0, 10)): number {
  return Math.ceil((new Date(date).getTime() - new Date(ref).getTime()) / 86400000);
}

export function epiCatalogFrom(records: EpiRecord[]): EpiRecord[] {
  const seen = new Set<string>();
  const out: EpiRecord[] = [];
  for (const r of records) {
    if (seen.has(r.reference)) continue;
    seen.add(r.reference);
    out.push({ ...r });
  }
  return out;
}

export function filterByVolet(records: EpiRecord[], volet: EpiVolet): EpiRecord[] {
  if (volet === 'reference') return epiCatalogFrom(records);
  if (volet === 'attribution') return records;
  return records.filter((e) => e.dateDerniereVerification || e.prochaineVerification || e.status === 'EXPIRE' || e.status === 'PERDU');
}
