import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {PageHeaderComponent, PageShellComponent, ToastService, ButtonComponent } from '@lib/anatomy';
import { resolveLocale } from '@lib/anatomy/pipes/_locale-resolver';
import { DAY_KEYS_ORDERED } from '@applications/erp/shell/i18n-labels';
import type { Chantier } from '../../../chantiers/models';
import { ChantierApiService } from '../../chantiers/services/chantier-api.service';
import { ErpLookupService } from '@applications/erp/shared/services/erp-lookup.service';
import type { AffectationEmploye } from '../pointage/models';
import { PlanningApiService, type PlanningEntry } from './services/planning-api.service';

const CHANTIER_COLORS: Record<string, string> = {
  'ch-001': 'var(--nf-color-primary-500)',
  'ch-002': 'var(--nf-color-primary-500)',
};

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function overlapsWeek(a: AffectationEmploye, weekStart: Date, weekEnd: Date): boolean {
  const start = new Date(a.dateDebut);
  const end = a.dateFin ? new Date(a.dateFin) : new Date('2099-12-31');
  return start <= weekEnd && end >= weekStart;
}

@Component({
  selector: 'app-planning-equipes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink, PageShellComponent, PageHeaderComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="filters">
        <label>{{ 'rh.planning.filters.chantier' | translate }}
          <select class="ctrl" [value]="filterChantierId()" (change)="onFilterChantier($any($event.target).value)">
            <option value="">{{ 'rh.common.actions.all' | translate }}</option>
            @for (c of chantiers(); track c.id) {
              <option [value]="c.id">{{ c.code }}</option>
            }
          </select>
        </label>
        <label>{{ 'rh.planning.filters.employe' | translate }}
          <select class="ctrl" [value]="filterEmployeId()" (change)="onFilterEmploye($any($event.target).value)">
            <option value="">{{ 'rh.common.actions.all' | translate }}</option>
            @for (e of employeOptions(); track e.id) {
              <option [value]="e.id">{{ e.nom }}</option>
            }
          </select>
        </label>
        <nf-button variant="primary" (clicked)="openDialog.set(true)">{{ 'rh.planning.filters.btnNew' | translate }}</nf-button>
      </div>

      @if (conflictMessages().length) {
        <div class="alert" role="status">
          @for (m of conflictMessages(); track m) {
            <div>{{ m }}</div>
          }
        </div>
      }

      <div class="week-nav">
        <nf-button variant="secondary" size="sm" type="button" (clicked)="prevWeek()">{{ 'rh.planning.weekNav.prev' | translate }}</nf-button>
        <span class="week-label">{{ 'rh.planning.weekNav.label' | translate: { start: formatDay(weekStart()), end: formatDay(weekDays().at(-1)!) } }}</span>
        <nf-button variant="secondary" size="sm" type="button" (clicked)="nextWeek()">{{ 'rh.planning.weekNav.next' | translate }}</nf-button>
      </div>

      <div class="legend">
        @for (c of chantiers(); track c.id) {
          <span class="legend-item" [style.background]="chantierColor(c.id) + '22'" [style.border-color]="chantierColor(c.id)">
            <span class="legend-dot" [style.background]="chantierColor(c.id)"></span>
            {{ c.code }}
          </span>
        }
      </div>

      <div class="planning-wrap">
        <table class="planning-table">
          <thead>
            <tr>
              <th class="emp-col">{{ 'rh.planning.table.ouvrier' | translate }}</th>
              @for (day of weekDays(); track day.toISOString(); let i = $index) {
                <th class="day-col" [class.weekend]="i >= 5">
                  {{ dayLabel(i) }} {{ formatDay(day) }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (aff of filteredAffectations(); track aff.id) {
              <tr>
                <td class="emp-cell">
                  <strong>{{ aff.employeNom }}</strong>
                  <span class="fonction">{{ 'rh.planning.table.fonctionPct' | translate: { role: aff.fonctionSurChantier, pct: aff.pourcentageTemps ?? 100 } }}</span>
                </td>
                @for (day of weekDays(); track day.toISOString(); let i = $index) {
                  <td class="day-cell" [class.weekend]="i >= 5" [class.active]="cellActive(aff, day)"
                      [style.background]="cellActive(aff, day) ? chantierColor(aff.chantierId) + '22' : ''"
                      [style.border-left]="cellActive(aff, day) ? '3px solid ' + chantierColor(aff.chantierId) : ''">
                    @if (cellActive(aff, day)) {
                      <a [routerLink]="['/chantiers', aff.chantierId]" class="chantier-link" [style.color]="chantierColor(aff.chantierId)">
                        {{ aff.chantierCode }}
                      </a>
                    } @else { <span class="muted">{{ 'rh.common.dash' | translate }}</span> }
                  </td>
                }
              </tr>
            } @empty {
              <tr><td [colSpan]="8" class="empty">{{ 'rh.planning.table.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <p class="note">{{ 'rh.planning.note' | translate }}</p>
    </nf-page-shell>

    @if (openDialog()) {
      <div class="dialog-backdrop" (click)="openDialog.set(false)"></div>
      <div class="dialog" role="dialog" aria-modal="true">
        <h3>{{ 'rh.planning.dialog.title' | translate }}</h3>
        <label>{{ 'rh.planning.dialog.employe' | translate }}
          <select class="ctrl" [(ngModel)]="formEmployeId">
            @for (e of employeOptions(); track e.id) {
              <option [value]="e.id">{{ e.nom }}</option>
            }
          </select>
        </label>
        <label>{{ 'rh.planning.dialog.chantier' | translate }}
          <select class="ctrl" [(ngModel)]="formChantierId">
            @for (c of chantiers(); track c.id) {
              <option [value]="c.id">{{ c.code }}</option>
            }
          </select>
        </label>
        <label>{{ 'rh.planning.dialog.dateDebut' | translate }}
          <input class="ctrl" type="date" [(ngModel)]="formDateDebut" />
        </label>
        <label>{{ 'rh.planning.dialog.role' | translate }}
          <input class="ctrl" type="text" [(ngModel)]="formRole" />
        </label>
        <label>{{ 'rh.planning.dialog.pctTemps' | translate }}
          <input class="ctrl" type="number" min="1" max="100" [(ngModel)]="formPct" />
        </label>
        <div class="dialog-actions">
          <nf-button variant="ghost" (clicked)="openDialog.set(false)">{{ 'rh.planning.dialog.cancel' | translate }}</nf-button>
          <nf-button variant="primary" (clicked)="submitAffectation()">{{ 'rh.planning.dialog.save' | translate }}</nf-button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 0.75rem; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .ctrl { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 14px; min-width: 200px; }
    .btn { padding: 8px 14px; border-radius: 6px; border: none; background: var(--nf-color-primary-500); color: var(--nf-color-primary-contrast); font-weight: 700; cursor: pointer; font-size: 13px; }
    .alert { margin-bottom: 0.75rem; padding: 0.65rem 1rem; border-radius: 8px; background: var(--nf-color-warning-50); border: 1px solid var(--nf-color-warning-300); color: var(--nf-color-warning-800); font-size: 13px; font-weight: 600; }
    .week-nav { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.875rem; flex-wrap: wrap; }
    .btn-nav { padding: 6px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; background: var(--nf-color-surface); font-size: 13px; cursor: pointer; }
    .btn-nav:hover { background: var(--nf-color-bg-subtle); }
    .week-label { font-size: 0.9rem; font-weight: 600; color: var(--nf-color-text-primary); }
    .legend { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 5px; border: 1px solid; font-size: 12px; font-weight: 600; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .planning-wrap { overflow-x: auto; border: 1px solid var(--nf-color-border); border-radius: 8px; background: var(--nf-color-surface); }
    .planning-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px; }
    th { padding: 9px 10px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: center; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    th.emp-col { text-align: left; min-width: 160px; }
    th.day-col { min-width: 90px; }
    th.weekend { color: var(--nf-color-text-muted); background: var(--nf-color-bg-subtle); }
    td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); vertical-align: middle; }
    td.emp-cell { display: flex; flex-direction: column; gap: 1px; }
    td.emp-cell strong { font-weight: 600; color: var(--nf-color-text-primary); }
    .fonction { font-size: 11px; color: var(--nf-color-text-secondary); }
    td.day-cell { text-align: center; }
    td.weekend { background: var(--nf-color-bg-subtle) !important; }
    td.active { font-weight: 600; }
    .chantier-link { font-size: 12px; font-weight: 700; text-decoration: none; }
    .chantier-link:hover { text-decoration: underline; }
    .muted { color: var(--nf-color-border); font-size: 12px; }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    .note { font-size: 11px; color: var(--nf-color-text-muted); margin-top: 0.5rem; }
    .dialog-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.35); z-index: 80; }
    .dialog { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 90; background: var(--nf-color-surface); border-radius: 12px; padding: 1.25rem; width: min(420px, 92vw); box-shadow: 0 12px 40px rgba(0,0,0,0.15); display: flex; flex-direction: column; gap: 10px; }
    .dialog h3 { margin: 0 0 4px; font-size: 1.05rem; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .btn-ghost { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--nf-color-border); background: var(--nf-color-surface); cursor: pointer; }
  `],
})
export class PlanningEquipesPage {
  private readonly planningApi = inject(PlanningApiService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  private readonly chantiersList = signal<Chantier[]>([]);
  private readonly employeOptionsList = signal<{ id: string; nom: string }[]>([]);
  private readonly affectationsList = signal<AffectationEmploye[]>([]);
  private readonly planningEntriesList = signal<PlanningEntry[]>([]);

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('rh.planning.page.title'),
    subtitle: this.translate.instant('rh.planning.page.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.planning.title') },
    ],
  }));

  readonly weekStart = signal(getMondayOf(new Date('2026-05-09')));
  readonly weekDays = computed(() => getWeekDays(this.weekStart()));
  readonly filterChantierId = signal('');
  readonly filterEmployeId = signal('');
  readonly openDialog = signal(false);

  formEmployeId = '';
  formChantierId = '';
  formDateDebut = '2026-05-12';
  formRole = 'Ouvrier qualifié';
  formPct = 50;

  readonly chantiers = computed(() => this.chantiersList());

  readonly employeOptions = computed(() => this.employeOptionsList());

  constructor() {
    void Promise.all([
      this.chantierApi.getAll(),
      this.erpLookup.employes('ACTIF'),
    ]).then(([chantiersRes, employees]) => {
      const active = chantiersRes.items.filter((c) => c.status === 'EN_COURS');
      this.chantiersList.set(active);
      const options = employees.map((e) => ({
        id: String(e.key),
        nom: e.value,
      }));
      this.employeOptionsList.set(options);
      if (options.length) this.formEmployeId = options[0].id;
      if (active.length) this.formChantierId = active[0].id;
    });

    effect(() => {
      const ws = this.weekStart();
      const fc = this.filterChantierId();
      const fe = this.filterEmployeId();
      void this.reloadPlanning(ws, fc, fe);
    });
  }

  readonly filteredAffectations = computed(() => {
    let list = this.affectationsList();
    const fc = this.filterChantierId();
    const fe = this.filterEmployeId();
    if (fc) list = list.filter(a => a.chantierId === fc);
    if (fe) list = list.filter(a => a.employeId === fe);
    return list;
  });

  readonly conflictMessages = computed(() => {
    const ws = this.weekStart();
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const aff = this.affectationsList().filter(a => overlapsWeek(a, ws, we));
    const byEmp = new Map<string, AffectationEmploye[]>();
    for (const a of aff) {
      const arr = byEmp.get(a.employeId) ?? [];
      arr.push(a);
      byEmp.set(a.employeId, arr);
    }
    const msgs: string[] = [];
    for (const [, rows] of byEmp) {
      if (rows.length < 2) continue;
      const sum = rows.reduce((s, r) => s + (r.pourcentageTemps ?? 100), 0);
      if (sum > 100) {
        msgs.push(this.translate.instant('rh.planning.conflict', { nom: rows[0].employeNom, pct: sum }));
      }
    }
    return msgs;
  });

  cellActive(aff: AffectationEmploye, day: Date): boolean {
    const d = ymd(day);
    return this.planningEntriesList().some(
      e => e.employeId === aff.employeId && e.chantierId === aff.chantierId && e.dateJour === d,
    );
  }

  chantierColor(id: string): string { return CHANTIER_COLORS[id] ?? 'var(--nf-color-text-secondary)'; }

  onFilterChantier(value: string): void {
    this.filterChantierId.set(value);
  }

  onFilterEmploye(value: string): void {
    this.filterEmployeId.set(value);
  }

  dayLabel(index: number): string {
    return this.translate.instant(DAY_KEYS_ORDERED[index]);
  }

  formatDay(d: Date): string {
    const bcp47 = resolveLocale(this.translate);
    return new Intl.DateTimeFormat(bcp47, { day: '2-digit', month: '2-digit' }).format(d);
  }

  prevWeek(): void {
    this.weekStart.update(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }
  nextWeek(): void {
    this.weekStart.update(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  }

  submitAffectation(): void {
    this.openDialog.set(false);
    this.toast.info('Création d\'affectation — fonctionnalité à venir.');
  }

  private async reloadPlanning(weekStart: Date, chantierId: string, employeId: string): Promise<void> {
    const days = getWeekDays(weekStart);
    const from = ymd(days[0]);
    const to = ymd(days[6]);
    try {
      const result = await this.planningApi.getPlanning({
        from,
        to,
        chantierId: chantierId || undefined,
        employeId: employeId || undefined,
      });
      this.affectationsList.set(result.affectations ?? []);
      this.planningEntriesList.set(result.entries ?? []);
    } catch {
      this.affectationsList.set([]);
      this.planningEntriesList.set([]);
    }
  }
}
