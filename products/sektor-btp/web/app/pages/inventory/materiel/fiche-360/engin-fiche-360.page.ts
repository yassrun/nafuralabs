import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, from, map, of, switchMap } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';

import type {
  AffectationChantier,
  CatalogueMateriel,
  ControleReglementaire,
  OrdreTravail,
  PlanMaintenance,
  PleinCarburant,
} from '@applications/erp/inventory/models';
import { MaterielGmaoFacadeService } from '@applications/erp/inventory/services/materiel-gmao-facade.service';
import {
  MaterielAffectationApiService,
  apiToAffectationChantier,
} from '@applications/erp/inventory/services/materiel-affectation-api.service';
import { MaterielApiService } from '../../catalogue/materiel/services/materiel-api.service';

export interface EnginFicheVm {
  engine: CatalogueMateriel | undefined;
  plans: PlanMaintenance[];
  ots: OrdreTravail[];
  pleins: PleinCarburant[];
  controles: ControleReglementaire[];
  affectations: AffectationChantier[];
  blocked: boolean;
}

const EMPTY_ENGIN_FICHE_VM: EnginFicheVm = {
  engine: undefined,
  plans: [],
  ots: [],
  pleins: [],
  controles: [],
  affectations: [],
  blocked: false,
};

@Component({
  selector: 'app-engin-fiche-360',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, PageShellComponent, PageHeaderComponent],
  template: `
    <nf-page-shell [scroll]="true">
      @if (vm(); as m) {
        @if (m.engine; as eng) {
          <nf-page-header [config]="header(eng)"></nf-page-header>

          <section class="tabs">
            <a class="tab" [class.active]="tab() === 'id'" (click)="setTab('id')">{{
              'materielGmao.fiche360.tabIdentity' | translate
            }}</a>
            <a class="tab" [class.active]="tab() === 'aff'" (click)="setTab('aff')">{{
              'materielGmao.fiche360.tabAffectations' | translate
            }}</a>
            <a class="tab" [class.active]="tab() === 'maint'" (click)="setTab('maint')">{{
              'materielGmao.fiche360.tabMaintenance' | translate
            }}</a>
            <a class="tab" [class.active]="tab() === 'fuel'" (click)="setTab('fuel')">{{
              'materielGmao.fiche360.tabFuel' | translate
            }}</a>
            <a class="tab" [class.active]="tab() === 'ctrl'" (click)="setTab('ctrl')">{{
              'materielGmao.fiche360.tabControles' | translate
            }}</a>
          </section>

          @if (m.blocked) {
            <div class="warn">{{ 'materielGmao.fiche360.blockedVgp' | translate }}</div>
          }

          @if (tab() === 'maint' || tab() === 'fuel' || tab() === 'ctrl') {
            <div class="v2-stub">V2 — données de démonstration (maintenance / carburant / contrôles)</div>
          }

          @if (tab() === 'id') {
            <div class="card">
              <p>{{ eng.description }}</p>
              <p>
                <strong>{{ 'inventory.materiel.fields.marque' | translate }}:</strong> {{ eng.marque }} —
                {{ eng.modele }}
              </p>
              <p>
                <strong>{{ 'inventory.materiel.fields.numeroSerie' | translate }}:</strong> {{ eng.numeroSerie }}
              </p>
              <p>
                <strong>{{ 'inventory.materiel.fields.puissanceCapacite' | translate }}:</strong>
                {{ eng.puissanceCapacite }}
              </p>
            </div>
          }

          @if (tab() === 'aff') {
            <ul class="card list">
              @for (a of m.affectations; track a.id) {
                <li>{{ a.chantierRef }} · {{ a.dateDebut }} → {{ a.dateFin || ('materielGmao.labels.ongoing' | translate) }}</li>
              } @empty {
                <li>{{ 'materielGmao.empty.affectations' | translate }}</li>
              }
            </ul>
          }

          @if (tab() === 'maint') {
            <p>
              <a [routerLink]="['/materiel/maintenance/historique', eng.id]">{{
                'materielGmao.actions.otHistory' | translate
              }}</a>
            </p>
            <ul class="card list">
              @for (p of m.plans; track p.id) {
                <li>{{ p.typeIntervention }} — {{ p.declencheur }} ({{ p.prochaineEcheanceIso || p.prochainSeuil }})</li>
              } @empty {
                <li>{{ 'materielGmao.empty.plans' | translate }}</li>
              }
            </ul>
            <h4>{{ 'materielGmao.ot.listTitle' | translate }}</h4>
            <ul class="card list">
              @for (o of m.ots; track o.id) {
                <li>
                  <a [routerLink]="['/materiel/maintenance/ot', o.id]">{{ o.numero }}</a> — {{ o.status }}
                </li>
              } @empty {
                <li>{{ 'materielGmao.empty.ot' | translate }}</li>
              }
            </ul>
          }

          @if (tab() === 'fuel') {
            <ul class="card list">
              @for (pl of m.pleins; track pl.id) {
                <li>{{ pl.date }} — {{ pl.litres }} L @if (pl.anomalie) { ({{ 'materielGmao.fuel.anomaly' | translate }}) }</li>
              } @empty {
                <li>{{ 'materielGmao.empty.pleins' | translate }}</li>
              }
            </ul>
          }

          @if (tab() === 'ctrl') {
            <ul class="card list">
              @for (c of m.controles; track c.id) {
                <li>
                  {{ c.type }} — {{ c.libelle }} · {{ 'materielGmao.controles.expire' | translate }} {{ c.dateExpiration }}
                  @if (c.bloqueAffectationSiExpire) {
                    <span class="badge">{{ 'materielGmao.controles.blocking' | translate }}</span>
                  }
                </li>
              } @empty {
                <li>{{ 'materielGmao.empty.controles' | translate }}</li>
              }
            </ul>
          }
        } @else {
          <p>{{ 'materielGmao.empty.engine' | translate }}</p>
        }
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-bottom: 0.75rem;
      }
      .tab {
        padding: 0.35rem 0.65rem;
        border-radius: 0.35rem;
        border: 1px solid var(--nf-color-border);
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--nf-text-primary);
        text-decoration: none;
      }
      .tab.active {
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
        border-color: var(--nf-color-primary-700);
      }
      .card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        background: var(--nf-color-surface);
      }
      .list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .list li {
        padding: 0.35rem 0;
        border-bottom: 1px solid var(--nf-color-bg-muted);
      }
      .warn {
        background: var(--nf-color-danger-50);
        color: var(--nf-color-danger-700);
        padding: 0.5rem 0.65rem;
        border-radius: 0.35rem;
        margin-bottom: 0.65rem;
        font-weight: 600;
      }
      .v2-stub {
        background: var(--nf-color-warning-50);
        color: var(--nf-color-warning-700);
        padding: 0.5rem 0.65rem;
        border-radius: 0.35rem;
        margin-bottom: 0.65rem;
        font-size: 0.85rem;
      }
      .badge {
        margin-left: 0.35rem;
        font-size: 0.7rem;
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-700);
        padding: 0.1rem 0.35rem;
        border-radius: 0.25rem;
      }
    `,
  ],
})
/** GMAO tabs (maintenance, carburant, contrôles) — HTTP-first via {@link MaterielGmaoFacadeService}. */
export class EnginFiche360Page {
  private readonly route = inject(ActivatedRoute);
  private readonly materielApi = inject(MaterielApiService);
  private readonly affectationApi = inject(MaterielAffectationApiService);
  private readonly gmao = inject(MaterielGmaoFacadeService);
  private readonly translate = inject(TranslateService);

  readonly tab = signal<'id' | 'aff' | 'maint' | 'fuel' | 'ctrl'>('id');

  readonly vm = signal<EnginFicheVm>({
    engine: undefined,
    plans: [],
    ots: [],
    pleins: [],
    controles: [],
    affectations: [],
    blocked: false,
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((pm) => {
          const id = pm.get('id') ?? '';
          if (!id) {
            return of({
              engine: undefined,
              plans: [],
              ots: [],
              pleins: [],
              controles: [],
              affectations: [],
              blocked: false,
            } satisfies EnginFicheVm);
          }
          return combineLatest([
            from(this.materielApi.getById(id)),
            this.gmao.getPlans(),
            this.gmao.getOrdresTravail(),
            this.gmao.getPleins(),
            this.gmao.getControles(),
            from(this.affectationApi.list({ materielId: id }).then((rows) => rows.map(apiToAffectationChantier))),
          ]).pipe(
            map(([engine, plans, ots, pleins, controles, affectations]) => {
              const today = new Date().toISOString().slice(0, 10);
              const blocked = this.gmao.isEngineBlockedForAssignment(id, today);
              return {
                engine,
                plans: plans.filter((p) => p.engineId === id),
                ots: ots.filter((o) => o.engineId === id),
                pleins: pleins.filter((p) => p.engineId === id),
                controles: controles.filter((c) => c.engineId === id),
                affectations,
                blocked,
              } satisfies EnginFicheVm;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((v) => this.vm.set(v));
  }

  setTab(t: 'id' | 'aff' | 'maint' | 'fuel' | 'ctrl'): void {
    this.tab.set(t);
  }

  header(eng: CatalogueMateriel) {
    return {
      title: eng.name,
      subtitle: eng.code,
      breadcrumbs: [
        { label: this.translate.instant('nav.stock'), route: '/inventory/suivi/etat-stock' },
        { label: this.translate.instant('nav.materiel'), route: '/materiel/parc' },
        { label: this.translate.instant('materielGmao.fiche360.title') },
      ],
    };
  }
}
