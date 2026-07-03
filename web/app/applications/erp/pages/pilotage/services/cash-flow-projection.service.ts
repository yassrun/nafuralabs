import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { Chantier } from '../../../chantiers/models';
import { ApiConfigService } from '@platform/core/config/api-config.service';
import { ChantierApiService } from '../../chantiers/services/chantier-api.service';
import { FfApiService } from '../../achats/factures-fournisseur/services/ff-api.service';
import { FactureMarcheApiService } from '../../marches/factures/services/facture-marche-api.service';
import {
  DashboardKpiApiService,
  type RhKpiResponse,
} from '../../dashboard/services/dashboard-kpi-api.service';

export interface ApiCashFlowProjectionMois {
  mois: string;
  soldeOuverture: number;
  encaissements: number;
  decaissements: number;
  soldeCloture: number;
}

export interface CashFlowMoisProjectionDetail {
  encaissementsSituations: number;
  encaissementsChantiersActifs: number;
  decaissementsFacturesFournisseur: number;
  decaissementsMasseSalariale: number;
  decaissementsChargesSociales: number;
  decaissementsTraites: number;
}

export interface CashFlowMoisProjection {
  mois: string;
  label: string;
  encaissementsPrevus: number;
  decaissementsPrevus: number;
  soldeMensuel: number;
  soldeCumule: number;
  alerte: boolean;
  detail: CashFlowMoisProjectionDetail;
}

export const DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD = 2_000_000;

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function buildMoisLabelFr(yyyy: number, mm: number): string {
  return `${MOIS_FR[mm - 1]} ${yyyy}`;
}

export interface ProjectCashFlowFactureMarcheInput {
  dateEcheance: string;
  netAPayer: number;
  status: string;
}

export interface ProjectCashFlowFactureFournInput {
  dateEcheance: string;
  resteARegler: number;
  status: string;
}

export interface ProjectCashFlowInput {
  factures: readonly ProjectCashFlowFactureMarcheInput[];
  chantiers: readonly { status: string; budgetHt: number; avancementPercent: number }[];
  referenceDate: Date;
  horizonMonths?: number;
  soldeInitialMad?: number;
  seuilAlerteMad?: number;
  ratioEncaissementSituation?: number;
  facturesFourn?: readonly ProjectCashFlowFactureFournInput[];
  masseSalarialeNetteMensuelle?: number;
  chargesSocialesPatronalesMensuelle?: number;
  traitesMensuellesBase?: number;
}

export function projectCashFlowMonths(input: ProjectCashFlowInput): CashFlowMoisProjection[] {
  const {
    factures,
    chantiers,
    referenceDate,
    horizonMonths = 12,
    soldeInitialMad = 8_500_000,
    seuilAlerteMad = DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD,
    ratioEncaissementSituation = 1,
    facturesFourn = [],
    masseSalarialeNetteMensuelle = 520_000,
    chargesSocialesPatronalesMensuelle = 380_000,
    traitesMensuellesBase = 220_000,
  } = input;

  const rows: CashFlowMoisProjection[] = [];
  let soldeCumule = soldeInitialMad;

  for (let i = 0; i < horizonMonths; i++) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + i, 1);
    const yyyy = date.getFullYear();
    const mm = date.getMonth() + 1;
    const moisStr = `${yyyy}-${String(mm).padStart(2, '0')}`;

    const encSituations = factures
      .filter((f) => f.dateEcheance.startsWith(moisStr) && f.status !== 'PAYEE')
      .reduce((s, f) => s + f.netAPayer * ratioEncaissementSituation, 0);

    const phase = 1 + 0.04 * Math.sin(i / 2);
    const encChantiersActifs = chantiers
      .filter((c) => c.status === 'EN_COURS')
      .reduce(
        (s, c) =>
          s + ((c.budgetHt * Math.min(Math.max(c.avancementPercent, 0), 100)) / 100) * 0.008 * phase * (1 + (i % 3) * 0.03),
        0,
      );

    const encaissementsPrevus = Math.round(encSituations + encChantiersActifs);

    const decFf = facturesFourn
      .filter(
        (f) =>
          f.resteARegler > 0 &&
          f.status !== 'BROUILLON' &&
          f.status !== 'ANNULEE' &&
          f.dateEcheance.startsWith(moisStr),
      )
      .reduce((s, f) => s + f.resteARegler, 0);

    const decPaie = Math.round(masseSalarialeNetteMensuelle + 18_000 * Math.sin(i + 1));
    const decSoc = Math.round(chargesSocialesPatronalesMensuelle * (1 + 0.05 * ((i + 2) % 4)));
    const decTrait = Math.round(traitesMensuellesBase * (1 + 0.35 * (i % 5)) + 40_000 * (i % 2));

    const decaissementsPrevus = Math.round(decFf + decPaie + decSoc + decTrait);
    const soldeMensuel = encaissementsPrevus - decaissementsPrevus;
    soldeCumule = Math.round(soldeCumule + soldeMensuel);

    rows.push({
      mois: moisStr,
      label: buildMoisLabelFr(yyyy, mm),
      encaissementsPrevus,
      decaissementsPrevus,
      soldeMensuel,
      soldeCumule,
      alerte: soldeCumule < seuilAlerteMad,
      detail: {
        encaissementsSituations: Math.round(encSituations),
        encaissementsChantiersActifs: Math.round(encChantiersActifs),
        decaissementsFacturesFournisseur: Math.round(decFf),
        decaissementsMasseSalariale: decPaie,
        decaissementsChargesSociales: decSoc,
        decaissementsTraites: decTrait,
      },
    });
  }

  return rows;
}

export const DEMO_CASHFLOW_REFERENCE_DATE = new Date('2026-05-09T12:00:00');

function estimatePayrollFromRhKpi(rh: RhKpiResponse | null): {
  masseSalarialeNetteMensuelle: number;
  chargesSocialesPatronalesMensuelle: number;
} {
  if (!rh?.masseSalarialeYTD) {
    return { masseSalarialeNetteMensuelle: 520_000, chargesSocialesPatronalesMensuelle: 380_000 };
  }
  const masseSalarialeNetteMensuelle = Math.round(rh.masseSalarialeYTD / 5);
  const chargesSocialesPatronalesMensuelle = Math.round(masseSalarialeNetteMensuelle * 0.45);
  return { masseSalarialeNetteMensuelle, chargesSocialesPatronalesMensuelle };
}

function mapApiToProjection(rows: ApiCashFlowProjectionMois[]): CashFlowMoisProjection[] {
  return rows.map((r) => {
    const [yyyy, mm] = r.mois.split('-').map(Number);
    const encaissementsPrevus = Number(r.encaissements) || 0;
    const decaissementsPrevus = Number(r.decaissements) || 0;
    const soldeMensuel = encaissementsPrevus - decaissementsPrevus;
    const soldeCumule = Number(r.soldeCloture) || 0;
    return {
      mois: r.mois,
      label: buildMoisLabelFr(yyyy, mm),
      encaissementsPrevus,
      decaissementsPrevus,
      soldeMensuel,
      soldeCumule,
      alerte: soldeCumule < DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD,
      detail: {
        encaissementsSituations: encaissementsPrevus,
        encaissementsChantiersActifs: 0,
        decaissementsFacturesFournisseur: Math.round(decaissementsPrevus * 0.35),
        decaissementsMasseSalariale: Math.round(decaissementsPrevus * 0.35),
        decaissementsChargesSociales: Math.round(decaissementsPrevus * 0.2),
        decaissementsTraites: Math.round(decaissementsPrevus * 0.1),
      },
    };
  });
}

@Injectable({ providedIn: 'root' })
export class CashFlowProjectionService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly factureMarcheApi = inject(FactureMarcheApiService);
  private readonly ffApi = inject(FfApiService);
  private readonly dashboardKpi = inject(DashboardKpiApiService);

  private readonly chantiersSig = signal<Chantier[]>([]);
  private readonly apiMonthsSig = signal<CashFlowMoisProjection[] | null>(null);
  private readonly facturesMarcheSig = signal<ProjectCashFlowFactureMarcheInput[]>([]);
  private readonly facturesFournSig = signal<ProjectCashFlowFactureFournInput[]>([]);
  private readonly rhKpiSig = signal<RhKpiResponse | null>(null);

  constructor() {
    void this.chantierApi.getAll().then(({ items }) => this.chantiersSig.set(items));
    void this.loadFromApi();
    void this.loadProjectionInputs();
  }

  private async loadFromApi(): Promise<void> {
    try {
      const base = this.apiConfig.getApiBaseUrl();
      const rows = await firstValueFrom(
        this.http.get<ApiCashFlowProjectionMois[]>(`${base}/api/v1/pilotage/cash-flow-projection`, {
          params: { from: '2026-05', to: '2027-05' },
        }),
      );
      if (rows?.length) {
        this.apiMonthsSig.set(mapApiToProjection(rows));
      }
    } catch {
      this.apiMonthsSig.set(null);
    }
  }

  private async loadProjectionInputs(): Promise<void> {
    try {
      const { items } = await this.factureMarcheApi.getAll();
      this.facturesMarcheSig.set(
        items.map((f) => ({
          dateEcheance: f.dateEcheance ?? f.dateEmission,
          netAPayer: f.netAPayer ?? f.netTtc ?? 0,
          status: f.status,
        })),
      );
    } catch {
      this.facturesMarcheSig.set([]);
    }
    try {
      const ff = await this.ffApi.list();
      this.facturesFournSig.set(
        ff.map((f) => ({
          dateEcheance: f.dateEcheance,
          resteARegler: f.resteARegler ?? 0,
          status: f.status,
        })),
      );
    } catch {
      this.facturesFournSig.set([]);
    }
    try {
      const kpis = await this.dashboardKpi.fetchAll({ from: '2026-01-01', to: '2026-05-08' });
      this.rhKpiSig.set(kpis.rh);
    } catch {
      this.rhKpiSig.set(null);
    }
  }

  readonly months = computed(() => {
    const api = this.apiMonthsSig();
    if (api?.length) {
      return api;
    }
    const payroll = estimatePayrollFromRhKpi(this.rhKpiSig());
    return projectCashFlowMonths({
      factures: this.facturesMarcheSig(),
      facturesFourn: this.facturesFournSig(),
      chantiers: this.chantiersSig().map((c) => ({
        status: c.status,
        budgetHt: c.budgetHt,
        avancementPercent: c.avancementPercent,
      })),
      referenceDate: DEMO_CASHFLOW_REFERENCE_DATE,
      masseSalarialeNetteMensuelle: payroll.masseSalarialeNetteMensuelle,
      chargesSocialesPatronalesMensuelle: payroll.chargesSocialesPatronalesMensuelle,
    });
  });
}
