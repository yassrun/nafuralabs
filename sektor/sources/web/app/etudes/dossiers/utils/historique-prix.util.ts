import type { HistoriquePrixComposantLigne } from '../services/dossier-etude-api.service';

export const HISTORIQUE_PRIX_PREVIEW = 3;

export interface HistoriquePrixGroupe {
  key: string;
  partenaire: string;
  ligne: HistoriquePrixComposantLigne;
  count: number;
  minPu: number;
  maxPu: number;
}

function partnerKey(row: HistoriquePrixComposantLigne): string {
  const name = (row.fournisseur || '').trim().toLowerCase();
  if (name) return name;
  return (row.sourceRefId || row.libelle || 'inconnu').trim().toLowerCase();
}

function rank(row: HistoriquePrixComposantLigne): number {
  if (row.kind === 'ACHATS' && row.detail === 'FACTURE') return 0;
  if (row.kind === 'ACHATS') return 1;
  if (row.kind === 'CONSULTATION') return 2;
  if (row.kind === 'TARIF') return 3;
  return 4;
}

function dateMs(row: HistoriquePrixComposantLigne): number {
  if (!row.dateSource) return 0;
  const t = Date.parse(row.dateSource);
  return Number.isFinite(t) ? t : 0;
}

function dedupe(rows: HistoriquePrixComposantLigne[]): HistoriquePrixComposantLigne[] {
  const seen = new Set<string>();
  const out: HistoriquePrixComposantLigne[] = [];
  for (const row of rows) {
    const key = [
      row.kind,
      row.detail ?? '',
      row.fournisseur ?? '',
      row.prixUnitaire,
      row.dateSource ?? '',
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function pickBest(rows: HistoriquePrixComposantLigne[]): HistoriquePrixComposantLigne {
  return [...rows].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const byDate = dateMs(b) - dateMs(a);
    if (byDate !== 0) return byDate;
    return a.prixUnitaire - b.prixUnitaire;
  })[0];
}

/** Une ligne par partenaire — le plus pertinent (achat > devis récent). */
export function compactHistoriquePrix(
  lignes: HistoriquePrixComposantLigne[] | null | undefined,
): HistoriquePrixGroupe[] {
  const byPartner = new Map<string, HistoriquePrixComposantLigne[]>();
  for (const row of lignes ?? []) {
    const key = partnerKey(row);
    const bucket = byPartner.get(key) ?? [];
    bucket.push(row);
    byPartner.set(key, bucket);
  }
  const groupes: HistoriquePrixGroupe[] = [];
  for (const [key, rows] of byPartner) {
    const unique = dedupe(rows);
    if (!unique.length) continue;
    const ligne = pickBest(unique);
    const pus = unique.map((r) => r.prixUnitaire);
    groupes.push({
      key,
      partenaire: (ligne.fournisseur || '').trim() || 'Sans partenaire',
      ligne,
      count: unique.length,
      minPu: Math.min(...pus),
      maxPu: Math.max(...pus),
    });
  }
  groupes.sort((a, b) => {
    const byRank = rank(a.ligne) - rank(b.ligne);
    if (byRank !== 0) return byRank;
    return dateMs(b.ligne) - dateMs(a.ligne);
  });
  return groupes;
}

export function historiquePrixPreview<T>(rows: T[], expanded: boolean, limit = HISTORIQUE_PRIX_PREVIEW): T[] {
  if (expanded || rows.length <= limit) return rows;
  return rows.slice(0, limit);
}
