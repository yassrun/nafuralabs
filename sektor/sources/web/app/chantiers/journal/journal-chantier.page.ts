import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FilterResetComponent } from '@platform/lib/anatomy/components/molecules/filter-reset/filter-reset.component';

import {
  ButtonComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  ScreenComponent,
  ToastService,
  type LookupSearchFn,
  type NfSelectOption,
} from '@platform/lib/anatomy';
import { MadCurrencyPipe } from '@platform/lib/anatomy/pipes/mad-currency.pipe';
import { AuthFacade } from '@platform/core/security/services/auth.facade';
import { JOURNAL_EVENT_TYPE_KEYS } from '@app/socle/shell/i18n-labels';
import type { Chantier } from '@app/chantiers/models';
import { ChantierApiService } from '../services/chantier-api.service';
import { JournalChantierApiService } from '../services/journal-chantier-api.service';

type JournalEventType = 'VISITE_MOA' | 'INTEMPERIE' | 'LIVRAISON' | 'INCIDENT' | 'ORDRE_SERVICE' | 'REUNION' | 'CONSTAT' | 'AUTRE';

interface JournalEntry {
  id: string;
  chantierId: string;
  chantierCode: string;
  date: string;
  heure?: string;
  type: JournalEventType;
  titre: string;
  description: string;
  participants?: string[];
  impactDelai?: number;
  impactCout?: number;
  auteur: string;
  pieceJointe?: string;
}

const TYPE_CSS: Record<JournalEventType, string> = {
  VISITE_MOA:    'event--moa',
  INTEMPERIE:    'event--weather',
  LIVRAISON:     'event--delivery',
  INCIDENT:      'event--incident',
  ORDRE_SERVICE: 'event--os',
  REUNION:       'event--meeting',
  CONSTAT:       'event--constat',
  AUTRE:         'event--autre',
};

const TYPE_ICON: Record<JournalEventType, string> = {
  VISITE_MOA: '👔', INTEMPERIE: '⛈', LIVRAISON: '🚚',
  INCIDENT: '⚠️', ORDRE_SERVICE: '📋', REUNION: '📝',
  CONSTAT: '🔍', AUTRE: '📌',
};

const BACKEND_TYPE_MAP: Record<string, JournalEventType> = {
  VISITE_MOA: 'VISITE_MOA',
  INTEMPERIE: 'INTEMPERIE',
  LIVRAISON: 'LIVRAISON',
  INCIDENT: 'INCIDENT',
  ORDRE_SERVICE: 'ORDRE_SERVICE',
  REUNION: 'REUNION',
  CONSTAT: 'CONSTAT',
  AUTRE: 'AUTRE',
  NOTE: 'AUTRE',
};

function mapBackendType(raw: string | undefined): JournalEventType {
  if (!raw) return 'AUTRE';
  const key = raw.trim().toUpperCase();
  return BACKEND_TYPE_MAP[key] ?? 'AUTRE';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-journal-chantier',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ScreenComponent,
    MadCurrencyPipe,
    FilterResetComponent,
    ButtonComponent,
    NfSelectComponent,
    TranslateModule,
  ],
  template: `
    <nf-screen [header]="headerConfig" [scroll]="true">

      <div class="toolbar">
        <input class="search" type="search" placeholder="Chantier, titre, type…"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <nf-select
          class="toolbar-select"
          [options]="typeFilterOptions()"
          [ngModel]="filterType()"
          (ngModelChange)="filterType.set($event)"
          [placeholder]="'chantiers.journal.filters.allTypes' | translate"
        />
        @if (filteredChantierCode()) {
          <span class="context-chip">{{ 'chantiers.common.fields.chantier' | translate }}: {{ filteredChantierCode() }}</span>
          <button type="button" class="context-link" (click)="clearChantierFilter()">{{ 'chantiers.common.actions.clearChantierFilter' | translate }}</button>
        }
        <span class="count">{{ entries().length <= 1 ? entries().length + ' événement' : entries().length + ' événements' }}</span>
        <nf-filter-reset [active]="hasFilter()" (reset)="resetFilters()"></nf-filter-reset>
        <nf-button variant="primary" iconLibrary="lucide" icon="plus" (clicked)="openCreateForm()">
          {{ 'chantiers.journal.create.cta' | translate }}
        </nf-button>
      </div>

      @if (showCreateForm()) {
        <div class="create-panel">
          <h3>{{ 'chantiers.journal.create.title' | translate }}</h3>
          <label>{{ 'chantiers.journal.create.fields.chantier' | translate }}</label>
          <nf-select
            lookupKey="chantiers"
            [lookupSearch]="searchChantiers"
            [(ngModel)]="createDraft.chantierId"
            name="chantierId"
            [selectedLabel]="createChantierLabel()"
            [placeholder]="'chantiers.journal.create.fields.chantierPlaceholder' | translate"
            (ngModelChange)="onCreateChantierChange($event)"
          />
          <label>{{ 'chantiers.journal.create.fields.type' | translate }}</label>
          <nf-select
            class="fld"
            [options]="typeCreateOptions()"
            [(ngModel)]="createDraft.type"
            name="type"
          />
          <label>{{ 'chantiers.journal.create.fields.date' | translate }}</label>
          <input class="fld" type="date" [(ngModel)]="createDraft.date" name="date" required />
          <label>{{ 'chantiers.journal.create.fields.contenu' | translate }}</label>
          <textarea class="fld" [(ngModel)]="createDraft.contenu" name="contenu" rows="3" required></textarea>
          <div class="create-actions">
            <nf-button variant="secondary" (clicked)="closeCreateForm()">
              {{ 'chantiers.common.actions.cancel' | translate }}
            </nf-button>
            <nf-button variant="primary" [disabled]="creating()" (clicked)="submitCreate()">
              {{ 'chantiers.journal.create.submit' | translate }}
            </nf-button>
          </div>
        </div>
      }

      @if (loading()) {
        <p class="loading">…</p>
      } @else {
        <div class="timeline">
          @for (entry of entries(); track entry.id) {
            <article class="event-card {{ typeClass(entry.type) }}">
              <div class="event-icon">{{ typeIcon(entry.type) }}</div>
              <div class="event-body">
                <div class="event-header">
                  <div class="event-meta">
                    <span class="event-date">{{ entry.date | date:'dd/MM/yyyy' }}{{ entry.heure ? ' à ' + entry.heure : '' }}</span>
                    <span class="sep">·</span>
                    <strong class="chantier-code">{{ entry.chantierCode }}</strong>
                    <span class="type-tag">{{ typeLabel(entry.type) }}</span>
                  </div>
                  <div class="event-impacts">
                    @if (entry.impactDelai) {
                      <span class="impact impact--delay">+{{ entry.impactDelai }} j</span>
                    }
                    @if (entry.impactCout) {
                      <span class="impact impact--cost">+{{ entry.impactCout | mad }}</span>
                    }
                  </div>
                </div>
                <h3 class="event-titre">{{ entry.titre }}</h3>
                <p class="event-desc">{{ entry.description }}</p>
                @if (entry.participants?.length) {
                  <p class="event-participants">Participants : {{ entry.participants!.join(', ') }}</p>
                }
                <p class="event-auteur">{{ 'chantiers.journal.labels.saisiPar' | translate }} {{ entry.auteur }}</p>
              </div>
            </article>
          } @empty {
            <div class="empty">{{ 'chantiers.journal.empty' | translate }}</div>
          }
        </div>
      }
    </nf-screen>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .toolbar-select { min-width: 160px; }
    .context-chip { padding: 4px 10px; border-radius: 999px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-size: 12px; font-weight: 600; }
    .context-link { border: none; background: transparent; color: var(--nf-color-primary-600); cursor: pointer; font-size: 12px; font-weight: 600; }
    .context-link:hover { text-decoration: underline; }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .create-panel {
      background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem;
      padding: 1rem 1.25rem; margin-bottom: 1rem; display: grid; gap: 0.5rem;
    }
    .create-panel h3 { margin: 0 0 0.25rem; font-size: 0.95rem; color: var(--nf-text-primary); }
    .create-panel label { font-size: 0.8rem; font-weight: 600; color: var(--nf-color-text-secondary); }
    .fld { width: 100%; padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .create-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.5rem; }
    .loading { color: var(--nf-color-text-secondary); padding: 2rem; text-align: center; }
    .timeline { display: flex; flex-direction: column; gap: 0.75rem; }
    .event-card { display: flex; gap: 0.875rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1rem 1.25rem; border-left: 4px solid var(--nf-color-border); }
    .event--moa      { border-left-color: var(--nf-color-primary-500); }
    .event--weather  { border-left-color: var(--nf-color-text-secondary); }
    .event--delivery { border-left-color: var(--nf-color-primary-500); }
    .event--incident { border-left-color: var(--nf-color-danger-600); }
    .event--os       { border-left-color: var(--nf-color-primary-700); }
    .event--meeting  { border-left-color: var(--nf-color-warning-600); }
    .event--constat  { border-left-color: var(--nf-color-primary-500); }
    .event-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
    .event-body { flex: 1; min-width: 0; }
    .event-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.35rem; flex-wrap: wrap; }
    .event-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; flex-wrap: wrap; }
    .event-date { color: var(--nf-color-text-secondary); }
    .sep { color: var(--nf-color-border); }
    .chantier-code { color: var(--nf-color-primary-600); font-weight: 700; }
    .type-tag { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .event-impacts { display: flex; gap: 6px; }
    .impact { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .impact--delay { background: var(--nf-color-warning-50, #fef9c3); color: var(--nf-color-warning-700, #92400e); }
    .impact--cost  { background: var(--nf-color-danger-50, #fee2e2); color: var(--nf-color-danger-700); }
    .event-titre { margin: 0 0 0.35rem; font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary); }
    .event-desc { margin: 0 0 0.4rem; font-size: 0.87rem; color: var(--nf-color-text-secondary); line-height: 1.6; }
    .event-participants { margin: 0 0 0.25rem; font-size: 0.8rem; color: var(--nf-color-text-secondary); }
    .event-auteur { margin: 0; font-size: 0.75rem; color: var(--nf-color-text-muted); }
    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); }
  `],
})
export class JournalChantierPage implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly journalApi = inject(JournalChantierApiService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly search = signal('');
  readonly filterType = signal<JournalEventType | ''>('');
  readonly filteredChantierId = signal(this.route.snapshot.queryParamMap.get('chantierId')?.trim() ?? '');
  readonly loading = signal(true);
  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createChantierLabel = signal('');
  readonly chantiers = signal<Chantier[]>([]);
  private readonly all = signal<JournalEntry[]>([]);
  readonly filteredChantierCode = computed(() => {
    const chantierId = this.filteredChantierId();
    if (!chantierId) return '';
    return this.chantiers().find((chantier) => chantier.id === chantierId)?.code
      ?? this.all().find((entry) => entry.chantierId === chantierId)?.chantierCode
      ?? chantierId;
  });

  readonly searchChantiers: LookupSearchFn = (q) =>
    this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]);

  createDraft = {
    chantierId: '',
    type: 'AUTRE' as JournalEventType,
    date: todayIso(),
    contenu: '',
  };

  readonly headerConfig = {
    title: this.translate.instant('chantiers.journal.title'),
    subtitle: 'Événements, visites, OS, intempéries',
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.translate.instant('chantiers.routes.journalCrumb') },
    ],
  };

  ngOnInit(): void {
    void this.loadEntries();
  }

  private async loadEntries(): Promise<void> {
    this.loading.set(true);
    try {
      const chantiers = await this.chantierApi.getAll();
      this.chantiers.set(chantiers.items);
      const aggregated: JournalEntry[] = [];
      for (const chantier of chantiers.items) {
        const rows = await this.journalApi.listForChantier(chantier.id);
        for (const row of rows) {
          const firstLine = row.contenu?.split('\n')[0]?.trim() ?? '';
          aggregated.push({
            id: row.id,
            chantierId: row.chantierId,
            chantierCode: chantier.code,
            date: row.date,
            type: mapBackendType(row.type),
            titre: firstLine || this.typeLabel(mapBackendType(row.type)),
            description: row.contenu ?? '',
            auteur: row.auteur,
          });
        }
      }
      this.all.set(aggregated);
    } catch {
      this.all.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  openCreateForm(): void {
    const chantierId = this.filteredChantierId() || '';
    this.createDraft = {
      chantierId,
      type: 'AUTRE',
      date: todayIso(),
      contenu: '',
    };
    const known = chantierId ? this.chantiers().find((c) => c.id === chantierId) : undefined;
    this.createChantierLabel.set(
      known ? `${known.code} — ${known.name}` : (chantierId ? this.filteredChantierCode() : ''),
    );
    this.showCreateForm.set(true);
  }

  onCreateChantierChange(chantierId: string): void {
    this.createDraft.chantierId = chantierId ?? '';
    if (!chantierId) {
      this.createChantierLabel.set('');
      return;
    }
    const known = this.chantiers().find((c) => c.id === chantierId);
    if (known) {
      this.createChantierLabel.set(`${known.code} — ${known.name}`);
      return;
    }
    void this.chantierApi.getById(chantierId).then(
      (c) => this.createChantierLabel.set(`${c.code} — ${c.name}`),
      () => this.createChantierLabel.set(chantierId),
    );
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
  }

  async submitCreate(): Promise<void> {
    const { chantierId, type, date, contenu } = this.createDraft;
    if (!chantierId || !date || !contenu.trim()) {
      this.toast.error(this.translate.instant('chantiers.journal.create.errors.required'));
      return;
    }
    this.creating.set(true);
    try {
      await this.journalApi.createForChantier(chantierId, {
        date,
        type,
        contenu: contenu.trim(),
        auteur: this.auth.displayName(),
      });
      this.toast.success(this.translate.instant('chantiers.journal.create.success'));
      this.showCreateForm.set(false);
      await this.loadEntries();
    } catch {
      this.toast.error(this.translate.instant('chantiers.journal.create.errors.failed'));
    } finally {
      this.creating.set(false);
    }
  }

  private trEnum(type: JournalEventType): string {
    const key = (JOURNAL_EVENT_TYPE_KEYS as Record<string, string>)[type];
    if (!key) return type;
    const resolved = this.translate.instant(key);
    return resolved === key ? type : resolved;
  }

  readonly typeEntries = computed<[JournalEventType, string][]>(() => {
    const types: JournalEventType[] = ['VISITE_MOA', 'INTEMPERIE', 'LIVRAISON', 'INCIDENT', 'ORDRE_SERVICE', 'REUNION', 'CONSTAT', 'AUTRE'];
    return types.map((t) => [t, this.trEnum(t)]);
  });

  readonly typeFilterOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.journal.filters.allTypes') },
    ...this.typeEntries().map(([value, label]) => ({ value, label })),
  ]);

  readonly typeCreateOptions = computed<NfSelectOption[]>(() =>
    this.typeEntries().map(([value, label]) => ({ value, label })),
  );

  readonly entries = computed(() => {
    const q = this.search().toLowerCase().trim();
    const t = this.filterType();
    const chantierId = this.filteredChantierId();
    let list = [...this.all()].sort((a, b) => b.date.localeCompare(a.date));
    if (chantierId) list = list.filter(e => e.chantierId === chantierId);
    if (t) list = list.filter(e => e.type === t);
    if (!q) return list;
    return list.filter(e =>
      e.chantierCode.toLowerCase().includes(q) ||
      e.titre.toLowerCase().includes(q) ||
      this.trEnum(e.type).toLowerCase().includes(q),
    );
  });

  typeLabel(t: JournalEventType): string { return this.trEnum(t); }
  typeIcon(t: JournalEventType): string { return TYPE_ICON[t] ?? '📌'; }
  typeClass(t: JournalEventType): string { return TYPE_CSS[t] ?? 'event--autre'; }
  readonly hasFilter = computed(() => !!this.search() || !!this.filterType());

  resetFilters(): void {
    this.search.set('');
    this.filterType.set('');
  }

  clearChantierFilter(): void {
    this.filteredChantierId.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chantierId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
