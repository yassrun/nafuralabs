import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import type { Chantier } from '../../../../chantiers/models';
import { ChantierApiService } from '../../../chantiers/services/chantier-api.service';
import { PointageApiService } from '../services/pointage-api.service';
import { MODE_KEYS } from '@applications/erp/shell/i18n-labels';
import { MODE_CSS, type Pointage } from '../models';

@Component({
  selector: 'app-pointage-validation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, RouterLink, PageShellComponent, PageHeaderComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="pageHeaderConfig()"></nf-page-header>

      <div class="controls">
        <label>{{ 'rh.pointage.validation.controls.date' | translate }}
          <input type="date" class="ctrl" [value]="date()" (change)="date.set($any($event.target).value)" />
        </label>
        <select class="ctrl" [value]="chantierId()" (change)="chantierId.set($any($event.target).value)">
          <option value="">{{ 'rh.pointage.validation.controls.tousChantiers' | translate }}</option>
          @for (c of chantiers(); track c.id) {
            <option [value]="c.id">{{ c.code }}</option>
          }
        </select>
        <a class="link" routerLink="/rh/pointage">{{ 'rh.pointage.validation.controls.linkListing' | translate }}</a>
      </div>

      <section class="panel">
        <h2>{{ 'rh.pointage.validation.brouillons.title' | translate }}</h2>
        @if (brouillons().length === 0) {
          <p class="muted">{{ 'rh.pointage.validation.brouillons.empty' | translate }}</p>
        } @else {
          <table class="tbl">
            <thead>
              <tr>
                <th>{{ 'rh.pointage.validation.brouillons.columns.employe' | translate }}</th>
                <th>{{ 'rh.pointage.validation.brouillons.columns.chantier' | translate }}</th>
                <th>{{ 'rh.pointage.validation.brouillons.columns.mode' | translate }}</th>
                <th>{{ 'rh.pointage.validation.brouillons.columns.heuresNorm' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of brouillons(); track p.id) {
                <tr>
                  <td>{{ p.employeNom }}</td>
                  <td>{{ p.chantierCode }}</td>
                  <td><span class="badge {{ modeCss(p.mode) }}">{{ modeLabel(p.mode) }}</span></td>
                  <td>{{ p.heuresNormales ?? 0 }}</td>
                  <td></td>
                </tr>
              }
            </tbody>
          </table>
          <nf-button variant="primary" (clicked)="valider()">{{ 'rh.pointage.validation.brouillons.validerTous' | translate }}</nf-button>
        }
      </section>

      <section class="panel">
        <h2>{{ 'rh.pointage.validation.cumuls.title' | translate: { mois: mois() } }}</h2>
        <table class="tbl">
          <thead>
            <tr>
              <th>{{ 'rh.pointage.validation.cumuls.columns.employe' | translate }}</th>
              <th>{{ 'rh.pointage.validation.cumuls.columns.presents' | translate }}</th>
              <th>{{ 'rh.pointage.validation.cumuls.columns.heures' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (r of cumuls(); track r.employeId) {
              <tr>
                <td>{{ r.employeNom }}</td>
                <td>{{ r.presents }}</td>
                <td><strong>{{ r.heures }}</strong> h</td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="muted">{{ 'rh.common.noData' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </section>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .controls { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 1rem; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); }
    .ctrl { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 14px; }
    .link { margin-left: auto; font-size: 13px; font-weight: 600; color: var(--nf-color-primary-600); text-decoration: none; }
    .panel { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1rem; margin: 0 0 0.75rem; color: var(--nf-color-text-primary); }
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th, .tbl td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); text-align: left; }
    .tbl th { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; }
    .muted { color: var(--nf-color-text-muted); font-size: 13px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .mode--present { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .mode--absent { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .btn { margin-top: 10px; padding: 8px 16px; background: var(--nf-color-primary-500); color: var(--nf-color-primary-contrast); border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `],
})
export class PointageValidationPage {
  private readonly pointageApi = inject(PointageApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly translate = inject(TranslateService);

  private readonly chantiersList = signal<Chantier[]>([]);
  private readonly dayPointages = signal<Pointage[]>([]);
  private readonly monthPointages = signal<Pointage[]>([]);

  readonly pageHeaderConfig = computed(() => ({
    title: this.translate.instant('rh.pointage.validation.title'),
    subtitle: this.translate.instant('rh.pointage.validation.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.pointage.title'), route: '/rh/pointage' },
      { label: this.translate.instant('rh.routes.pointageValidation.breadcrumb') },
    ],
  }));

  readonly date = signal('2026-05-10');
  readonly chantierId = signal('');

  readonly chantiers = computed(() => this.chantiersList());

  constructor() {
    void this.chantierApi.getAll().then(({ items }) => {
      this.chantiersList.set(items.filter((c) => c.status === 'EN_COURS'));
    });

    effect(() => {
      const d = this.date();
      const cid = this.chantierId();
      void this.loadDay(d, cid);
    });

    effect(() => {
      const m = this.mois();
      const cid = this.chantierId();
      void this.loadMonth(m, cid);
    });
  }

  private async loadDay(date: string, chantierId: string): Promise<void> {
    try {
      const rows = await this.pointageApi.listByDate(chantierId || undefined, date);
      this.dayPointages.set(rows);
    } catch {
      this.dayPointages.set([]);
    }
  }

  private async loadMonth(mois: string, chantierId: string): Promise<void> {
    try {
      const rows = await this.pointageApi.listForMonth(chantierId || undefined, mois);
      this.monthPointages.set(rows);
    } catch {
      this.monthPointages.set([]);
    }
  }

  readonly mois = computed(() => this.date().slice(0, 7));

  readonly brouillons = computed(() => {
    const cid = this.chantierId();
    return this.dayPointages().filter(
      (p: Pointage) => p.status === 'BROUILLON' && (!cid || p.chantierId === cid),
    );
  });

  readonly cumuls = computed(() => {
    const cid = this.chantierId();
    const rows = this.monthPointages().filter(
      (p: Pointage) => p.status === 'VALIDE' && (!cid || p.chantierId === cid),
    );
    const map = new Map<string, { employeId: string; employeNom: string; presents: number; heures: number }>();
    for (const p of rows) {
      const cur = map.get(p.employeId) ?? { employeId: p.employeId, employeNom: p.employeNom, presents: 0, heures: 0 };
      if (p.mode === 'PRESENT') cur.presents += 1;
      cur.heures += (p.heuresNormales ?? 0) + (p.heuresSup ?? 0);
      map.set(p.employeId, cur);
    }
    return [...map.values()].sort((a, b) => a.employeNom.localeCompare(b.employeNom));
  });

  async valider(): Promise<void> {
    const batchIds = [...new Set(
      this.brouillons()
        .map((p) => p.journeeBatchId)
        .filter((id): id is string => !!id),
    )];
    for (const batchId of batchIds) {
      await this.pointageApi.validateBatch(batchId);
    }
    await this.loadDay(this.date(), this.chantierId());
    await this.loadMonth(this.mois(), this.chantierId());
  }

  modeLabel(m: string): string {
    const key = MODE_KEYS[m as keyof typeof MODE_KEYS];
    return key ? this.translate.instant(key) : m;
  }
  modeCss(m: string): string { return MODE_CSS[m as keyof typeof MODE_CSS] ?? ''; }
}
