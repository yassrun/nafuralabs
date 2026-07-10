import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import type { Chantier } from '../../../../chantiers/models';
import { ChantierApiService } from '../../../chantiers/services/chantier-api.service';
import { PointageApiService } from '../services/pointage-api.service';
import type { Pointage } from '../models';
import { MODE_CSS, MODE_EMOJI } from '../models';
import { MODE_KEYS } from '@applications/erp/shell/i18n-labels';

@Component({
  selector: 'app-pointage-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, RouterLink, PageShellComponent, PageHeaderComponent, FilterResetComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="controls">
        <select [value]="chantierId()" (change)="chantierId.set($any($event.target).value)">
          <option value="">{{ 'rh.pointage.listing.controls.tousChantiers' | translate }}</option>
          @for (c of chantiers(); track c.id) {
            <option [value]="c.id">{{ c.code }} — {{ c.name }}</option>
          }
        </select>
        <input type="month" [value]="mois()" (change)="mois.set($any($event.target).value)" />
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <span class="count">{{ 'rh.pointage.listing.controls.lignesCount' | translate: { count: rows().length } }}</span>
        <a class="btn-saisie" routerLink="/rh/pointage/saisie">{{ 'rh.pointage.listing.controls.btnSaisie' | translate }}</a>
        <a class="btn-val" routerLink="/rh/pointage/validation">{{ 'rh.pointage.listing.controls.btnValidation' | translate }}</a>
      </div>

      <!-- Pivot par employé -->
      @if (rows().length) {
        <div class="pivot-grid">
          @for (row of employeRows(); track row.employeId) {
            <article class="emp-card">
              <div class="emp-header">
                <strong>{{ row.employeNom }}</strong>
                <div class="emp-stats">
                  <span class="stat present">{{ 'rh.pointage.listing.stats.present' | translate: { count: row.presents } }}</span>
                  @if (row.absents > 0) { <span class="stat absent">{{ 'rh.pointage.listing.stats.absent' | translate: { count: row.absents } }}</span> }
                  @if (row.conges > 0) { <span class="stat conge">{{ 'rh.pointage.listing.stats.conge' | translate: { count: row.conges } }}</span> }
                  @if (row.malades > 0) { <span class="stat maladie">{{ 'rh.pointage.listing.stats.maladie' | translate: { count: row.malades } }}</span> }
                  <span class="stat heures">{{ 'rh.pointage.listing.stats.heures' | translate: { count: row.heuresTotal } }}</span>
                </div>
              </div>
              <div class="emp-days">
                @for (day of row.days; track day.date) {
                  <div class="day-cell {{ modeCss(day.mode) }}" [title]="day.date + ' — ' + modeLabel(day.mode)">
                    <span class="day-num">{{ day.dateNum }}</span>
                    <span class="day-emoji">{{ modeEmoji(day.mode) }}</span>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="empty">{{ 'rh.pointage.listing.empty' | translate }}</div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .controls { display: flex; gap: 10px; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .controls select, .controls input { padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface); }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .btn-saisie { margin-left: auto; padding: 7px 14px; background: var(--nf-color-primary-500); color: var(--nf-color-primary-contrast); border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; }
    .btn-saisie:hover { background: var(--nf-color-primary-600); }
    .btn-val { padding: 7px 14px; border: 1px solid var(--nf-color-primary-500); color: var(--nf-color-primary-600); border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; background: var(--nf-color-surface); }
    .btn-val:hover { background: var(--nf-color-primary-50); }

    .pivot-grid { display: flex; flex-direction: column; gap: 0.75rem; }

    .emp-card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; padding: 0.875rem 1rem; }
    .emp-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .emp-header strong { font-size: 0.95rem; color: var(--nf-color-text-primary); }
    .emp-stats { display: flex; gap: 6px; flex-wrap: wrap; }
    .stat { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .stat.present  { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .stat.absent   { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .stat.conge    { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .stat.maladie  { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .stat.heures   { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

    .emp-days { display: flex; gap: 4px; flex-wrap: wrap; }
    .day-cell { width: 38px; height: 38px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--nf-color-bg-muted); cursor: default; }
    .day-num { font-size: 9px; color: var(--nf-color-text-muted); line-height: 1; }
    .day-emoji { font-size: 14px; line-height: 1; }
    .mode--present .day-cell, .day-cell.mode--present   { background: var(--nf-color-success-100); }
    .day-cell.mode--absent   { background: var(--nf-color-danger-100); }
    .day-cell.mode--conge    { background: var(--nf-color-primary-100); }
    .day-cell.mode--maladie  { background: var(--nf-color-warning-100); }
    .day-cell.mode--formation{ background: var(--nf-color-primary-50); }

    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); }
  `],
})
export class PointageListingPage {
  private readonly pointageApi = inject(PointageApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly translate = inject(TranslateService);

  private readonly chantiersList = signal<Chantier[]>([]);
  private readonly pointagesList = signal<Pointage[]>([]);
  private readonly loading = signal(false);

  readonly mois = signal(new Date().toISOString().slice(0, 7));
  readonly chantierId = signal('');

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('rh.pointage.listing.title'),
    subtitle: this.translate.instant('rh.pointage.listing.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.pointage.title') },
    ],
  }));

  readonly chantiers = computed(() => this.chantiersList());

  constructor() {
    void this.chantierApi.getAll().then(({ items }) => {
      this.chantiersList.set(items.filter((c) => c.status === 'EN_COURS'));
    });

    effect(() => {
      const mois = this.mois();
      const chantierId = this.chantierId();
      void this.loadPointages(mois, chantierId);
    });
  }

  private async loadPointages(mois: string, chantierId: string): Promise<void> {
    this.loading.set(true);
    try {
      const rows = await this.pointageApi.listForMonth(chantierId || undefined, mois);
      this.pointagesList.set(rows);
    } catch {
      this.pointagesList.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  readonly rows = computed(() => this.pointagesList());

  readonly employeRows = computed(() => {
    const rows = this.rows();
    const byEmp = new Map<string, typeof rows>();
    rows.forEach(r => {
      const list = byEmp.get(r.employeId) ?? [];
      list.push(r);
      byEmp.set(r.employeId, list);
    });

    return [...byEmp.entries()].map(([eid, pts]) => {
      const presents = pts.filter(p => p.mode === 'PRESENT').length;
      const absents  = pts.filter(p => p.mode === 'ABSENT').length;
      const conges   = pts.filter(p => p.mode === 'CONGE').length;
      const malades  = pts.filter(p => p.mode === 'MALADIE').length;
      const heuresTotal = pts.reduce((s, p) => s + (p.heuresNormales ?? 0) + (p.heuresSup ?? 0), 0);
      const days = pts.map(p => ({
        date: p.date,
        dateNum: p.date.slice(8),
        mode: p.mode,
      })).sort((a, b) => a.date.localeCompare(b.date));
      return { employeId: eid, employeNom: pts[0].employeNom, presents, absents, conges, malades, heuresTotal, days };
    });
  });

  modeLabel(m: string): string {
    const key = MODE_KEYS[m as keyof typeof MODE_KEYS];
    return key ? this.translate.instant(key) : m;
  }
  modeEmoji(m: string): string { return MODE_EMOJI[m as keyof typeof MODE_EMOJI] ?? '•'; }
  modeCss(m: string): string { return MODE_CSS[m as keyof typeof MODE_CSS] ?? ''; }
  readonly hasFilter = computed(() => {
    const def = new Date().toISOString().slice(0, 7);
    return !!this.chantierId() || this.mois() !== def;
  });

  resetFilters(): void {
    this.chantierId.set('');
    this.mois.set(new Date().toISOString().slice(0, 7));
  }

}
