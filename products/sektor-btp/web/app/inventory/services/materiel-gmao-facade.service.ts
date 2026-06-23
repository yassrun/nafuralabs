import { inject, Injectable } from '@angular/core';
import { catchError, from, map, type Observable, of } from 'rxjs';

import type {
  AffectationChantier,
  CarnetCarburant,
  ControleReglementaire,
  ContratLocation,
  EtatContradictoire,
  OrdreTravail,
  PlanMaintenance,
  PleinCarburant,
  PointageEngin,
} from '../models';
import {
  apiToAffectationChantier,
  MaterielAffectationApiService,
} from './materiel-affectation-api.service';

/**
 * HTTP-first GMAO read model. Maintenance / carburant / contrôles APIs are not wired yet —
 * lists start empty; affectations load from `/api/v1/materiel-affectations`.
 */
@Injectable({ providedIn: 'root' })
export class MaterielGmaoFacadeService {
  private readonly affectationApi = inject(MaterielAffectationApiService);

  private plans: PlanMaintenance[] = [];
  private ordres: OrdreTravail[] = [];
  private carnets: CarnetCarburant[] = [];
  private pleins: PleinCarburant[] = [];
  private contrats: ContratLocation[] = [];
  private etats: EtatContradictoire[] = [];
  private controles: ControleReglementaire[] = [];
  private pointages: PointageEngin[] = [];
  private planningOverrides = new Map<string, Partial<Pick<AffectationChantier, 'dateDebut' | 'dateFin'>>>();

  getPlans(): Observable<PlanMaintenance[]> {
    return of([...this.plans]);
  }

  upsertPlan(plan: PlanMaintenance): void {
    const i = this.plans.findIndex((p) => p.id === plan.id);
    if (i >= 0) this.plans[i] = { ...plan };
    else this.plans = [...this.plans, { ...plan }];
  }

  getOrdresTravail(): Observable<OrdreTravail[]> {
    return of(this.ordres.map((o) => ({ ...o, piecesConsommees: o.piecesConsommees.map((x) => ({ ...x })) })));
  }

  getOrdreTravail(id: string): Observable<OrdreTravail | undefined> {
    const o = this.ordres.find((x) => x.id === id);
    return of(
      o ? { ...o, piecesConsommees: o.piecesConsommees.map((x) => ({ ...x })) } : undefined,
    );
  }

  saveOrdreTravail(patch: OrdreTravail): void {
    const i = this.ordres.findIndex((o) => o.id === patch.id);
    if (i >= 0) this.ordres[i] = { ...patch };
    else this.ordres = [...this.ordres, patch];
  }

  getCarnets(): Observable<CarnetCarburant[]> {
    return of([...this.carnets]);
  }

  getPleins(): Observable<PleinCarburant[]> {
    return of([...this.pleins]);
  }

  addPlein(input: Omit<PleinCarburant, 'id' | 'total' | 'anomalie'> & { id?: string }): PleinCarburant {
    const total = Math.round(input.litres * input.prixLitre * 100) / 100;
    const row: PleinCarburant = {
      ...input,
      id: input.id ?? `pl-${Date.now()}`,
      total,
      anomalie: false,
    };
    this.pleins = [row, ...this.pleins];
    return row;
  }

  getContrats(): Observable<ContratLocation[]> {
    return of(this.contrats.map((c) => ({ ...c, documents: [...c.documents] })));
  }

  getEtats(): Observable<EtatContradictoire[]> {
    return of(this.etats.map((e) => ({ ...e, photos: [...e.photos] })));
  }

  getControles(): Observable<ControleReglementaire[]> {
    return of([...this.controles]);
  }

  getPointages(): Observable<PointageEngin[]> {
    return of([...this.pointages]);
  }

  addPointage(row: PointageEngin): void {
    this.pointages = [{ ...row }, ...this.pointages];
  }

  isEngineBlockedForAssignment(_engineId: string, _onDateIso: string): boolean {
    return false;
  }

  getWeeklyMaintenanceDueCount(_now = new Date()): number {
    return 0;
  }

  getMergedAffectations(): Observable<AffectationChantier[]> {
    return from(this.affectationApi.list()).pipe(
      map((rows) =>
        rows.map((row) => {
          const base = apiToAffectationChantier(row);
          const override = this.planningOverrides.get(base.id);
          return override ? { ...base, ...override } : base;
        }),
      ),
      catchError(() => of([])),
    );
  }

  patchPlanningDates(
    affectationId: string,
    patch: Partial<Pick<AffectationChantier, 'dateDebut' | 'dateFin'>>,
  ): void {
    const cur = this.planningOverrides.get(affectationId) ?? {};
    this.planningOverrides.set(affectationId, { ...cur, ...patch });
  }

  exportPleinsCsv(): string {
    const header = 'date,engineId,litres,prixLitre,total,anomalie,chantierId';
    const lines = this.pleins.map(
      (p) =>
        `${p.date},${p.engineId},${p.litres},${p.prixLitre},${p.total},${p.anomalie ? '1' : '0'},${p.chantierId ?? ''}`,
    );
    return [header, ...lines].join('\n');
  }
}
