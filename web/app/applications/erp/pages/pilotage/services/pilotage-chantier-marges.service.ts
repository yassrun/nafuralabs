import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { Chantier } from '../../../chantiers/models';
import type { Marche } from '../../marches/models';
import { ApiConfigService } from '@platform/core/config/api-config.service';
import { ChantierApiService } from '../../chantiers/services/chantier-api.service';
import { ContratMarcheApiService } from '../../marches/contrats/services/contrat-marche-api.service';

export interface ApiPilotageMargeRow {
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  status: string;
  montantMarcheHt: number;
  cumulFactureHt: number;
  pctFacture: number;
  avancementPercent: number;
  margeProjeteeHt: number;
  margePct: number;
}

/** Ligne pilotage marges / facturation / avancement (données mock + marché quand présent). */
export interface PilotageChantierMargeRow {
  chantierId: string;
  chantierCode: string;
  chantierNom: string;
  ville: string;
  status: string;
  montantMarcheHt: number;
  cumulFactureHt: number;
  pctFacture: number;
  avancementPercent: number;
  diffFactureAvancement: number;
  cumulEncaisseHt: number;
  margeProjeteeHt: number;
  margePct: number;
  alerteMarge: boolean;
  alerteDiff: boolean;
}

/** Classes CSS pour badges marge (&lt; 5% danger, 5–15% warning, sinon ok). */
export function margePilotageCssClass(pct: number): string {
  if (pct < 5) return 'marge--danger';
  if (pct < 15) return 'marge--warning';
  return 'marge--ok';
}

/**
 * Agrège marchés + chantiers pour les écrans pilotage marges / marge consolidée.
 * Hypothèse démo : marge projetée dérivée d’un taux de coût cible (voir constantes).
 */
export function buildPilotageMargeRows(
  chantiers: readonly Chantier[],
  marches: readonly Marche[],
): PilotageChantierMargeRow[] {
  const COUT_CIBLE_RATIO = 0.18;
  const FRAIS_GEN_RATIO = 0.02;

  return chantiers.map((c) => {
    const marche = marches.find((m) => m.chantierId === c.id);
    const montantMarcheHt = marche?.montantTotalHt ?? c.budgetHt;
    const cumulFactureHt = marche?.cumulFactureHt ?? c.facturesEmisesHt;
    const cumulEncaisseHt = marche?.cumulEncaisseHt ?? c.encaissementsTtc;
    const pctFacture = montantMarcheHt > 0 ? Math.round((cumulFactureHt / montantMarcheHt) * 100) : 0;
    const diffFactureAvancement = pctFacture - c.avancementPercent;
    const coutEstime = montantMarcheHt * (1 - COUT_CIBLE_RATIO);
    const margeProjeteeHt = Math.round(
      montantMarcheHt - coutEstime - (montantMarcheHt - coutEstime) * FRAIS_GEN_RATIO,
    );
    const margePct = montantMarcheHt > 0 ? Math.round((margeProjeteeHt / montantMarcheHt) * 1000) / 10 : 0;

    return {
      chantierId: c.id,
      chantierCode: c.code,
      chantierNom: c.name,
      ville: c.ville,
      status: c.status,
      montantMarcheHt,
      cumulFactureHt,
      pctFacture,
      avancementPercent: c.avancementPercent,
      diffFactureAvancement,
      cumulEncaisseHt,
      margeProjeteeHt,
      margePct,
      alerteMarge: margePct < 5,
      alerteDiff: Math.abs(diffFactureAvancement) > 10,
    };
  });
}

export type PilotageMargePivotAxis = 'CHANTIER' | 'BU' | 'CLIENT' | 'MOA' | 'TYPE_MARCHE';

export interface PilotageMargePivotRow {
  key: string;
  label: string;
  montantMarcheHt: number;
  cumulFactureHt: number;
  margeProjeteeHt: number;
  margePct: number;
}

function typeMarcheLabel(nature: string | undefined): string {
  if (!nature) return 'Non classé';
  if (nature.startsWith('PUBLIC')) return 'Marché public';
  if (nature.includes('PRIVE')) return 'Marché privé';
  return nature;
}

/** Agrège les marges par axe (TCD pilotage — M-PIL-02). */
export function buildPilotageMargePivotRows(
  chantiers: readonly Chantier[],
  marches: readonly Marche[],
  axis: PilotageMargePivotAxis,
): PilotageMargePivotRow[] {
  const base = buildPilotageMargeRows(chantiers, marches);
  const map = new Map<
    string,
    { label: string; marcheHt: number; factureHt: number; margeHt: number }
  >();

  for (const row of base) {
    const m = marches.find((x) => x.chantierId === row.chantierId);
    let key: string;
    let label: string;
    switch (axis) {
      case 'CHANTIER':
        key = row.chantierId;
        label = `${row.chantierCode} — ${row.chantierNom}`;
        break;
      case 'BU':
        key = 'bu-principale';
        label = 'Société principale';
        break;
      case 'CLIENT':
        key = m?.clientId ?? 'unknown';
        label = m?.clientNom ?? 'Client non affecté';
        break;
      case 'MOA':
        key = m?.clientId ?? 'unknown';
        label = m?.clientNom ?? 'MOA';
        break;
      case 'TYPE_MARCHE':
        key = m?.nature ?? 'NC';
        label = typeMarcheLabel(m?.nature);
        break;
      default:
        key = row.chantierId;
        label = row.chantierCode;
    }
    const cur = map.get(key) ?? { label, marcheHt: 0, factureHt: 0, margeHt: 0 };
    cur.marcheHt += row.montantMarcheHt;
    cur.factureHt += row.cumulFactureHt;
    cur.margeHt += row.margeProjeteeHt;
    cur.label = label;
    map.set(key, cur);
  }

  const out: PilotageMargePivotRow[] = [];
  for (const [k, v] of map) {
    const margePct = v.marcheHt > 0 ? Math.round((v.margeHt / v.marcheHt) * 1000) / 10 : 0;
    out.push({
      key: k,
      label: v.label,
      montantMarcheHt: v.marcheHt,
      cumulFactureHt: v.factureHt,
      margeProjeteeHt: v.margeHt,
      margePct,
    });
  }
  return out.sort((a, b) => b.margeProjeteeHt - a.margeProjeteeHt);
}

function mapApiMargeRows(api: ApiPilotageMargeRow[]): PilotageChantierMargeRow[] {
  return api.map((r) => ({
    chantierId: r.chantierId,
    chantierCode: r.chantierCode,
    chantierNom: r.chantierNom,
    ville: '',
    status: r.status,
    montantMarcheHt: Number(r.montantMarcheHt) || 0,
    cumulFactureHt: Number(r.cumulFactureHt) || 0,
    pctFacture: Number(r.pctFacture) || 0,
    avancementPercent: Number(r.avancementPercent) || 0,
    diffFactureAvancement: (Number(r.pctFacture) || 0) - (Number(r.avancementPercent) || 0),
    cumulEncaisseHt: 0,
    margeProjeteeHt: Number(r.margeProjeteeHt) || 0,
    margePct: Number(r.margePct) || 0,
    alerteMarge: (Number(r.margePct) || 0) < 5,
    alerteDiff: Math.abs((Number(r.pctFacture) || 0) - (Number(r.avancementPercent) || 0)) > 10,
  }));
}

@Injectable({ providedIn: 'root' })
export class PilotageChantierMargesService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly chantiersSig = signal<Chantier[]>([]);
  private readonly marchesSig = signal<Marche[]>([]);
  private readonly apiRowsSig = signal<PilotageChantierMargeRow[] | null>(null);

  constructor() {
    void this.chantierApi.getAll().then(({ items }) => this.chantiersSig.set(items));
    void this.contratApi.getAll().then(({ items }) => this.marchesSig.set(items)).catch(() => this.marchesSig.set([]));
    void this.loadMargesFromApi();
  }

  private async loadMargesFromApi(): Promise<void> {
    try {
      const base = this.apiConfig.getApiBaseUrl();
      const rows = await firstValueFrom(
        this.http.get<ApiPilotageMargeRow[]>(`${base}/api/v1/pilotage/marges`),
      );
      if (rows?.length) {
        this.apiRowsSig.set(mapApiMargeRows(rows));
      }
    } catch {
      this.apiRowsSig.set(null);
    }
  }

  /** Toutes les lignes chantier (avant filtres UI locaux). */
  readonly rows = computed(() => {
    const api = this.apiRowsSig();
    if (api?.length) {
      return api;
    }
    return buildPilotageMargeRows(this.chantiersSig(), this.marchesSig());
  });

  pivotRowsFor(axis: PilotageMargePivotAxis): PilotageMargePivotRow[] {
    return buildPilotageMargePivotRows(
      this.chantiersSig(),
      this.marchesSig(),
      axis,
    );
  }
}
