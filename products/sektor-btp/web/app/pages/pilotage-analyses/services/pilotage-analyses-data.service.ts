import { computed, inject, Injectable, signal } from '@angular/core';

import type { BalanceLigne, BalanceTotaux } from '@applications/erp/finance/models';
import { BalanceApiService } from '@applications/erp/finance/services/balance-api.service';
import type { Chantier } from '@applications/erp/chantiers/models';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import { AnalyticsApiService } from '@applications/erp/pages/analytics/services/analytics-api.service';
import {
  DashboardKpiApiService,
  type DashboardAllKpis,
} from '@applications/erp/pages/dashboard/services/dashboard-kpi-api.service';

import {
  PilotageChantierMargesService,
  type PilotageChantierMargeRow,
} from '../../pilotage/services/pilotage-chantier-marges.service';

export interface PilotageRentabiliteKpis {
  margeBruteYtd: number;
  margeNetteYtd: number;
  margeMoyennePct: number;
  top5: PilotageChantierMargeRow[];
  flop5: PilotageChantierMargeRow[];
}

export interface PilotageFinancierKpis {
  caYtd: number;
  caEncaisse: number;
  creancesOuvertes: number;
  dettesFournisseurs: number;
  bfr: number;
  ratioLiquidite: number;
}

export interface PilotageStockKpis {
  valeurStockTotale: number;
  rotationApprox: number;
  valeurChantier: number;
  valeurCentral: number;
  topArticles: { code: string; name: string; qty: number }[];
}

export interface PilotageAchatsKpis {
  volumeYtdHt: number;
  nbBc: number;
  topFournisseurs: { nom: string; volumeHt: number }[];
  economiesVsMarchePct: number;
  dependanceMaxPct: number;
}

export interface PilotageRhKpis {
  effectif: number;
  masseSalarialeYtd: number;
  absenteismePct: number;
  rotationPct: number;
  pyramideJeunesPct: number;
  heuresSupYtd: number;
}

const DEFAULT_RANGE = { from: '2026-01-01', to: '2026-05-08' };

@Injectable({ providedIn: 'root' })
export class PilotageAnalysesDataService {
  private readonly balanceApi = inject(BalanceApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly dashboardKpi = inject(DashboardKpiApiService);
  private readonly margesSvc = inject(PilotageChantierMargesService);

  private readonly balanceSig = signal<{ lignes: BalanceLigne[]; totaux: BalanceTotaux } | null>(null);
  private readonly achatsApiSig = signal<{ volumeYtdHt: number; dependanceMaxPct: number } | null>(null);
  private readonly financeApiSig = signal<{ caYtd: number; creances: number; dettes: number } | null>(null);
  private readonly dashboardSig = signal<DashboardAllKpis | null>(null);
  private readonly chantiersSig = signal<Chantier[]>([]);

  constructor() {
    void this.balanceApi
      .getBalance({ dateDebut: DEFAULT_RANGE.from, dateFin: DEFAULT_RANGE.to })
      .then((b) => this.balanceSig.set(b))
      .catch(() => this.balanceSig.set(null));
    void this.chantierApi.getAll().then(({ items }) => this.chantiersSig.set(items));
    void this.loadPartialAnalytics();
    void this.dashboardKpi
      .fetchAll(DEFAULT_RANGE)
      .then((k) => this.dashboardSig.set(k))
      .catch(() => this.dashboardSig.set(null));
  }

  private async loadPartialAnalytics(): Promise<void> {
    try {
      const achats = await this.analyticsApi.getBuckets('achats', { metrics: 'volumeHt' });
      const rows = achats.rows ?? [];
      const volumeYtdHt = this.analyticsApi.sumMetric(rows, 'volumeHt');
      const top = rows[0]?.metrics?.['volumeHt'] as number | undefined;
      const dependanceMaxPct =
        volumeYtdHt > 0 && top != null ? Math.round((top / volumeYtdHt) * 1000) / 10 : 0;
      this.achatsApiSig.set({ volumeYtdHt, dependanceMaxPct });
    } catch {
      this.achatsApiSig.set(null);
    }
    try {
      const fin = await this.analyticsApi.getBuckets('finance', {
        metrics: 'caFactureHt,creancesOuvertes,dettesFournisseurs',
      });
      const rows = fin.rows ?? [];
      this.financeApiSig.set({
        caYtd: this.analyticsApi.sumMetric(rows, 'caFactureHt'),
        creances: this.analyticsApi.sumMetric(rows, 'creancesOuvertes'),
        dettes: this.analyticsApi.sumMetric(rows, 'dettesFournisseurs'),
      });
    } catch {
      this.financeApiSig.set(null);
    }
  }

  readonly balance = this.balanceSig.asReadonly();

  readonly rentabilite = computed((): PilotageRentabiliteKpis | null => {
    const rows = this.margesSvc.rows();
    if (rows.length === 0) return null;
    const margeBruteYtd = rows.reduce((s, r) => s + r.margeProjeteeHt, 0);
    const margeNetteYtd = Math.round(margeBruteYtd * 0.92);
    const ca = rows.reduce((s, r) => s + r.montantMarcheHt, 0);
    const margeMoyennePct = ca > 0 ? Math.round((margeBruteYtd / ca) * 1000) / 10 : 0;
    const sorted = [...rows].sort((a, b) => b.margePct - a.margePct);
    const top5 = sorted.slice(0, 5);
    const flop5 = [...rows].sort((a, b) => a.margePct - b.margePct).slice(0, 5);
    return { margeBruteYtd, margeNetteYtd, margeMoyennePct, top5, flop5 };
  });

  readonly financier = computed((): PilotageFinancierKpis | null => {
    const b = this.balanceSig();
    const dash = this.dashboardSig();
    const apiFin = this.financeApiSig();
    if (!b && !apiFin && !dash) return null;

    const creances =
      apiFin?.creances ??
      dash?.ventes.creancesOuvertes ??
      (b?.lignes.filter((l) => l.compteCode.startsWith('3421')).reduce((s, l) => s + l.soldeDebit, 0) ?? 0);
    const dettes =
      apiFin?.dettes ??
      dash?.finance.dettesFournisseurs ??
      (b?.lignes.filter((l) => l.compteCode.startsWith('4411')).reduce((s, l) => s + l.soldeCredit, 0) ?? 0);
    const stocks =
      b?.lignes
        .filter((l) => l.compteCode.startsWith('3') && l.classe === 3 && !l.compteCode.startsWith('3421'))
        .reduce((s, l) => s + l.soldeDebit - l.soldeCredit, 0) ?? dash?.stock.valorisationStock ?? 0;
    const tresorerie =
      b?.lignes
        .filter((l) => l.compteCode.startsWith('514') || l.compteCode.startsWith('516'))
        .reduce((s, l) => s + l.soldeDebit - l.soldeCredit, 0) ?? dash?.finance.tresorerieCourante ?? 0;

    const caYtd = apiFin?.caYtd ?? dash?.ventes.caCumule ?? 0;
    const caEncaisse = dash?.ventes.caEncaisse ?? 0;
    const bfr = dash?.finance.bfr ?? Math.round(creances + stocks - dettes);
    const passifCourant = Math.max(1, dettes + Math.abs(Math.min(0, tresorerie)));
    const ratioLiquidite =
      dash?.finance.ratioLiquidite ??
      Math.round(((tresorerie + creances) / passifCourant) * 100) / 100;

    return {
      caYtd,
      caEncaisse,
      creancesOuvertes: Math.round(creances),
      dettesFournisseurs: Math.round(dettes),
      bfr,
      ratioLiquidite: Number.isFinite(ratioLiquidite) ? ratioLiquidite : 0,
    };
  });

  readonly stock = computed((): PilotageStockKpis => {
    const dash = this.dashboardSig();
    const valeurStockTotale = dash?.stock.valorisationStock ?? 0;
    const valeurChantier = dash?.stock.valoMagasinChantier ?? 0;
    const valeurCentral = Math.max(0, valeurStockTotale - valeurChantier);
    const rotationApprox = dash?.stock.rotation ?? 0;

    return {
      valeurStockTotale: Math.round(valeurStockTotale),
      rotationApprox,
      valeurChantier: Math.round(valeurChantier),
      valeurCentral: Math.round(valeurCentral),
      topArticles: [],
    };
  });

  readonly achatsKpis = computed((): PilotageAchatsKpis => {
    const apiAchats = this.achatsApiSig();
    const dash = this.dashboardSig();
    const volumeYtdHt = apiAchats?.volumeYtdHt ?? dash?.achats.volumeAchatsYTD ?? 0;
    const dependanceMaxPct =
      apiAchats?.dependanceMaxPct ?? dash?.achats.dependanceTop3 ?? 0;
    return {
      volumeYtdHt,
      nbBc: dash?.achats.nbBcEnCours ?? 0,
      topFournisseurs: [],
      economiesVsMarchePct: dash?.achats.economiesYTD ?? 0,
      dependanceMaxPct,
    };
  });

  readonly rhKpis = computed((): PilotageRhKpis => {
    const rh = this.dashboardSig()?.rh;
    return {
      effectif: rh?.effectifs ?? 0,
      masseSalarialeYtd: rh?.masseSalarialeYTD ?? 0,
      absenteismePct: rh?.absenteisme ?? 0,
      rotationPct: rh?.rotationAnnuelle ?? 0,
      pyramideJeunesPct: 0,
      heuresSupYtd: 0,
    };
  });

  readonly hydrated = computed(() => this.balanceSig() !== null || this.dashboardSig() !== null);

  readonly opexCapex = computed((): { opexMouv: number; capexMouv: number } | null => {
    const b = this.balanceSig();
    if (!b) return null;
    let opexMouv = 0;
    let capexMouv = 0;
    for (const l of b.lignes) {
      if (l.classe === 6) {
        opexMouv += l.mouvementsDebit;
      }
      if (l.classe === 2) {
        capexMouv += l.mouvementsDebit;
      }
    }
    return { opexMouv: Math.round(opexMouv), capexMouv: Math.round(capexMouv) };
  });

  readonly groupe = computed((): {
    ca: number;
    marge: number;
    ebitdaApprox: number;
    tresorerieNet: number;
  } | null => {
    const fin = this.financier();
    const rent = this.rentabilite();
    if (!fin || !rent) return null;
    const ebitdaApprox = Math.round(rent.margeBruteYtd * 0.55 - fin.dettesFournisseurs * 0.02);
    const tresorerieNet = fin.bfr;
    return {
      ca: fin.caYtd,
      marge: rent.margeBruteYtd,
      ebitdaApprox,
      tresorerieNet,
    };
  });
}
