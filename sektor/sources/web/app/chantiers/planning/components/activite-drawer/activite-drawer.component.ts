import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  BadgeComponent,
  ButtonComponent,
  DrawerComponent,
  NfSelectComponent,
  type NfSelectOption,
} from '@platform/lib/anatomy/components';

import { ActiviteApiService, type ActiviteForme, type PrecedenceType } from '../../../services/activite-api.service';
import { naturesForForme } from '../../services/planning-natures';
import { PlanningFacade, toIsoDate } from '../../services/planning.facade';
import { PlanningNeedsComponent } from '../planning-needs.component';

@Component({
  selector: 'app-activite-drawer',
  standalone: true,
  imports: [PlanningNeedsComponent, DrawerComponent, BadgeComponent, ButtonComponent, NfSelectComponent, FormsModule, TranslateModule],
  template: `
    <nf-drawer
      [open]="facade.drawerOpen()"
      [title]="drawerTitle()"
      size="md"
      (closed)="facade.closeDrawer()">
      @if (facade.drawerOpen() && facade.draft(); as draft) {
        <form class="activite-drawer" data-testid="activite-drawer" (submit)="$event.preventDefault(); onSave()">
          <p class="activite-drawer__eyebrow">{{ chantierLine() }}</p>
          @if(detail()?.activite?.planningRemainder;as remainder){
            <section class="activite-drawer__block" aria-label="Reprise et reste à faire">
              <h3>Reprise prévue le {{ formatDate(remainder.resumeStart) }}</h3>
              <p>{{ remainder.minutes/60 }} h restantes estimées au {{ formatDate(remainder.statusDate) }}. Début et avancement conservés.</p>
              <p>Les réservations sont libérées pendant les pauses. Pour modifier la reprise, ouvrez Ressources → Équipes et semaine → Reporter des activités.</p>
            </section>
          }

          <div class="activite-drawer__formes" data-testid="activite-forme">
            <span>Type de ligne</span>
            <div class="activite-drawer__forme-row">
              @for (f of formes; track f) {
                <button
                  type="button"
                  class="activite-drawer__forme"
                  [class.activite-drawer__forme--on]="draft.forme === f"
                  [attr.data-testid]="'activite-forme-' + f"
                  [disabled]="!!detail()?.activite?.planningRemainder"
                  (click)="facade.patchForme(f)">
                  {{ ('chantiers.planning.formes.' + formeKey(f)) | translate }}
                </button>
              }
            </div>
          </div>

          <label class="activite-drawer__field">
            <span>{{ 'chantiers.planning.drawer.libelle' | translate }}</span>
            <input
              data-testid="activite-libelle"
              type="text"
              [ngModel]="draft.libelle"
              (ngModelChange)="facade.patchDraft({ libelle: $event })"
              name="libelle"
              required />
          </label>

          <label class="activite-drawer__field">
            <span>{{ 'chantiers.planning.drawer.nature' | translate }}</span>
            <nf-select
              data-testid="activite-nature"
              [options]="natureOptions()"
              [ngModel]="draft.natureCode"
              (ngModelChange)="facade.patchDraft({ natureCode: $event })"
              name="natureCode"
            />
          </label>

          <div class="activite-drawer__row">
            <label class="activite-drawer__field">
              <span>{{ 'chantiers.planning.drawer.debut' | translate }}</span>
              <input
                type="date"
                [ngModel]="draft.dateDebut"
                (ngModelChange)="onDebutChange($event)"
                name="dateDebut" [disabled]="!!detail()?.activite?.planningRemainder" />
            </label>
            @if (draft.forme === 'ACTIVITE') {
              <label class="activite-drawer__field">
                <span>{{ 'chantiers.planning.drawer.duree' | translate }}</span>
                <input
                  data-testid="activite-duree-heures"
                  type="number"
                  min="0.5"
                  step="0.5"
                  [ngModel]="dureeHeures()"
                  (ngModelChange)="onDureeHeures($event)"
                  name="dureeHeures" [disabled]="!!detail()?.activite?.planningRemainder" />
              </label>
            } @else if (draft.forme === 'JALON') {
              <p class="activite-drawer__hint" data-testid="activite-jalon-hint">
                {{ 'chantiers.planning.drawer.jalonHint' | translate }}
              </p>
            } @else {
              <p class="activite-drawer__hint">{{ 'chantiers.planning.drawer.phaseHint' | translate }}</p>
            }
          </div>
          <p class="activite-drawer__hint" data-testid="activite-convention">
            {{ 'chantiers.planning.convention' | translate:{ hours: facade.calendarContext().heuresParJour } }}
            @if (draft.forme === 'ACTIVITE' && dureeHeures() > 0) {
              — {{ dureeJoursHint() }}
            }
          </p>

          @if (detail(); as saved) {
            <p class="activite-drawer__hint">Dates enregistrées : <strong>{{ saved.activite.dateDebut }} → {{ saved.activite.dateFin }}</strong>. {{ saved.activite.planningRemainder ? 'Fin issue du report validé ; durée ci-dessus = durée initiale.' : 'La fin est recalculée lors de l’enregistrement.' }}</p>
          }
          @if (draft.forme === 'ACTIVITE' && !detail()?.activite?.planningRemainder) {
            <section class="activite-drawer__block">
              <h3>Calendrier de travail</h3>
              <p class="activite-drawer__hint">{{ draft.calendrierSpecifique ? 'Calendrier spécifique à cette activité' : 'Hérité du chantier' }}</p>
              <nf-button variant="secondary" (clicked)="facade.openCalendar('activite')">Programmer un calendrier spécifique</nf-button>
              @if (draft.calendrierSpecifique && facade.capacites().administrerCalendrier) {
                <nf-button variant="secondary" (clicked)="facade.patchDraft({ calendrierSpecifique: null })">Revenir au calendrier du chantier</nf-button>
              }
            </section>
            <div class="activite-drawer__block" aria-live="polite">
              <span>Fin calculée</span>
              @if (previewLoading()) { <strong>Calcul en cours…</strong> }
              @else if (previewDate()) { <strong>{{ formatDate(previewDate()) }}</strong> }
              @else { <span class="activite-drawer__hint">{{ previewError() || 'Renseignez le début et une durée positive.' }}</span> }
            </div>
          }
          <section class="activite-drawer__block">
            <h3>Prédécesseurs et liaisons</h3>
            @if (draft.activiteId) {
              @for (link of detail()?.predecessors; track link.id) {
                <div class="activite-drawer__row"><span>{{ activityName(link.predActiviteId) }} · {{ link.typeLien }}</span>
                  <nf-button variant="secondary" size="sm" [disabled]="facade.saving() || !facade.capacites().editerStructure" (clicked)="facade.changePrecedence('', 'FD', link.id)">Retirer</nf-button>
                </div>
              } @empty { <p class="activite-drawer__hint">Aucun prédécesseur.</p> }
              @if (facade.capacites().editerStructure) {
                <label class="activite-drawer__field"><span>Activité précédente</span>
                  <nf-select name="predecessor" [options]="predecessorOptions()" [ngModel]="predecessor()" (ngModelChange)="predecessor.set($event)" />
                </label>
                <label class="activite-drawer__field"><span>Liaison logique</span>
                  <nf-select name="linkType" [options]="linkTypes" [ngModel]="linkType()" (ngModelChange)="linkType.set($event)" />
                </label>
                <nf-button variant="secondary" [disabled]="!predecessor() || facade.saving()" (clicked)="addPredecessor()">Ajouter le prédécesseur</nf-button>
              }
              <p class="activite-drawer__hint">Les liaisons sont enregistrées immédiatement. Utilisez « Simuler les liaisons et le chemin critique » dans le planning pour vérifier puis appliquer les dates.</p>
            } @else { <p class="activite-drawer__hint">Enregistrez l’activité pour ajouter ses prédécesseurs.</p> }
          </section>
          <label class="activite-drawer__field">
            <span>Regrouper sous</span>
            <nf-select
              [options]="parentOptions()"
              [ngModel]="draft.parentActiviteId"
              (ngModelChange)="facade.patchDraft({ parentActiviteId: $event })"
              name="parentActiviteId"
            />
          </label>

          <label class="activite-drawer__field">
            <span>{{ 'chantiers.planning.drawer.zone' | translate }}</span>
            <nf-select
              [options]="zoneOptions()"
              [ngModel]="draft.zoneId"
              (ngModelChange)="facade.patchDraft({ zoneId: $event })"
              name="zoneId"
            />
          </label>

          @if (facade.drawerMode() === 'create') {
            <p class="activite-drawer__hint">Les postes du bordereau peuvent être associés après l’enregistrement.</p>
          }

          @if (facade.drawerMode() === 'edit') {
            @if(facade.selectedActiviteDetail()?.activite; as activity) {
              @if(activity.forme === 'ACTIVITE') {
                <details class="activite-drawer__block"><summary>Ressources et besoins</summary><app-planning-needs [activityId]="activity.id" /></details>
              }
            }
            <details class="activite-drawer__block" data-testid="activite-travaux">
              <summary>{{ 'chantiers.planning.drawer.travauxLies' | translate }}</summary>
              @if (rattachements().length) {
                <ul class="activite-drawer__list">
                  @for (r of rattachements(); track r.id) {
                    <li>
                      <span>{{ facade.rattachementLabel(r) }}</span>
                      <nf-button variant="ghost" size="sm" (clicked)="onDetacher(r.id)">
                        {{ 'chantiers.planning.drawer.detacher' | translate }}
                      </nf-button>
                    </li>
                  }
                </ul>
              } @else {
                <p class="activite-drawer__hint">{{ 'chantiers.planning.drawer.aucunRattachement' | translate }}</p>
              }

              <label class="activite-drawer__field">
                <span>{{ 'chantiers.planning.drawer.ajouterPoste' | translate }}</span>
                <nf-select
                  data-testid="activite-noeud-picker"
                  [options]="noeudOptions()"
                  [ngModel]="noeudId()"
                  (ngModelChange)="noeudId.set($event)"
                  name="noeudId"
                />
              </label>
              <label class="activite-drawer__field">
                <span>{{ 'chantiers.planning.drawer.quantitePrevue' | translate }}</span>
                <input
                  data-testid="activite-qte-prevue"
                  type="number"
                  min="0"
                  step="0.01"
                  [ngModel]="quantitePrevue()"
                  (ngModelChange)="quantitePrevue.set(+$event)"
                  name="quantitePrevue" />
              </label>
              <nf-button variant="secondary" size="sm" [disabled]="facade.saving()" (clicked)="onRattacher()">
                {{ 'chantiers.planning.drawer.lier' | translate }}
              </nf-button>
            </details>

            <details class="activite-drawer__block" data-testid="activite-avancement">
              <summary>{{ 'chantiers.planning.drawer.avancement' | translate }}</summary>
              @if (rattachements().length) {
                <label class="activite-drawer__field">
                  <span>{{ 'chantiers.planning.drawer.quantiteFaite' | translate }}</span>
                  <input
                    data-testid="activite-qte-faite"
                    type="number"
                    min="0"
                    step="0.01"
                    [ngModel]="quantiteFaite()"
                    (ngModelChange)="quantiteFaite.set(+$event)"
                    name="quantiteFaite" />
                </label>
              } @else {
                <label class="activite-drawer__field">
                  <span>{{ 'chantiers.planning.drawer.percentJalon' | translate }}</span>
                  <input
                    data-testid="activite-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    [ngModel]="avancementPercent()"
                    (ngModelChange)="avancementPercent.set(+$event)"
                    name="avancementPercent" />
                </label>
              }
              <label class="activite-drawer__field">
                <span>{{ 'chantiers.planning.drawer.date' | translate }}</span>
                <input
                  type="date"
                  [ngModel]="dateAvancement()"
                  (ngModelChange)="dateAvancement.set($event)"
                  name="dateAvancement" />
              </label>
              <nf-button variant="secondary" size="sm" [disabled]="facade.saving()" (clicked)="onAvancer()">
                {{ 'chantiers.planning.drawer.declarer' | translate }}
              </nf-button>
            </details>
          }

          @if (facade.drawerError(); as err) {
            <p class="activite-drawer__error" data-testid="activite-drawer-error" role="alert">{{ err }}</p>
          }

          @if (detail(); as d) {
            <nf-badge [variant]="badgeVariant()">{{ d.activite.status }}</nf-badge>
          }

          <div class="activite-drawer__footer">
            <nf-button variant="secondary" (clicked)="facade.closeDrawer()">
              {{ 'chantiers.planning.drawer.cancel' | translate }}
            </nf-button>
            @if (facade.drawerMode() === 'create') {
              <nf-button variant="secondary" [disabled]="facade.saving()" (clicked)="onSave(false)">Enregistrer et détailler</nf-button>
            }
            <nf-button variant="primary" data-testid="activite-save" [disabled]="facade.saving()" (clicked)="onSave()">
              {{ 'chantiers.planning.drawer.save' | translate }}
            </nf-button>
          </div>
        </form>
      }
    </nf-drawer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .activite-drawer { display: grid; gap: 0.9rem; }
      .activite-drawer__eyebrow { margin: 0; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nf-text-secondary, var(--nf-color-text-secondary)); }
      .activite-drawer__field { display: grid; gap: 0.3rem; }
      .activite-drawer__field span { font-size: 0.78rem; font-weight: 600; color: var(--nf-color-text-secondary); }
      .activite-drawer__field input {
        min-height: 2.6rem;
        border: 1px solid color-mix(in srgb, var(--nf-primary, var(--nf-color-primary-600)) 14%, var(--nf-color-border));
        border-radius: 0.75rem;
        background: var(--nf-color-surface);
        padding: 0.55rem 0.75rem;
        font: inherit;
        color: var(--nf-text-primary);
      }
      .activite-drawer__row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: end; }
      .activite-drawer__formes { display: grid; gap: 0.35rem; }
      .activite-drawer__formes > span { font-size: 0.78rem; font-weight: 600; color: var(--nf-color-text-secondary); }
      .activite-drawer__forme-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .activite-drawer__forme {
        border: 1px solid var(--nf-color-border, #e2e8f0);
        background: var(--nf-color-surface);
        border-radius: 999px;
        padding: 0.35rem 0.75rem;
        font: inherit;
        font-size: 0.82rem;
        cursor: pointer;
      }
      .activite-drawer__forme--on {
        border-color: var(--nf-color-primary-600, #0f766e);
        background: color-mix(in srgb, var(--nf-color-primary-600, #0f766e) 12%, transparent);
        font-weight: 600;
      }
      .activite-drawer__hint { margin: 0; font-size: 0.82rem; color: var(--nf-color-text-secondary); }
      .activite-drawer__block { display: grid; gap: 0.65rem; padding-top: 0.4rem; border-top: 1px solid var(--nf-color-border, #e2e8f0); }
      summary { cursor:pointer; font-weight:600; padding:.5rem 0; }
      details[open] > :not(summary) { margin-top:.7rem; }
      .activite-drawer__block h3 { margin: 0; font-size: 0.92rem; }
      .activite-drawer__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.4rem; }
      .activite-drawer__list li { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; font-size: 0.86rem; }
      .activite-drawer__error { margin: 0; padding: 0.7rem 0.85rem; border-radius: 0.75rem; background: color-mix(in srgb, var(--nf-color-danger-600, #dc2626) 12%, transparent); color: var(--nf-color-danger-600, #b91c1c); font-size: 0.86rem; }
      .activite-drawer__footer { position:sticky; bottom:0; background:var(--nf-color-surface, white); flex-wrap:wrap; display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.4rem; }
      @media (max-width: 640px) {
        .activite-drawer__row { grid-template-columns: 1fr; }
        .activite-drawer__footer { flex-direction: column-reverse; }
      }
    `,
  ],
})
export class ActiviteDrawerComponent {
  readonly facade = inject(PlanningFacade);
  private readonly translate = inject(TranslateService);

  private readonly api = inject(ActiviteApiService);
  readonly previewLoading = signal(false);
  readonly previewDate = signal('');
  readonly previewError = signal('');
  constructor() {
    effect((cleanup) => {
      const draft = this.facade.draft();
      const open = this.facade.drawerOpen();
      const remainder = this.detail()?.activite?.planningRemainder;
      this.previewDate.set(''); this.previewError.set(''); this.previewLoading.set(false);
      if (!open || remainder || draft?.forme !== 'ACTIVITE' || !draft.dateDebut || !(draft.dureeMinutesOuvrees! > 0)) return;
      let active = true;
      this.previewLoading.set(true);
      const timer = setTimeout(() => {
        void this.api.previewFin(draft.chantierId, draft.dateDebut, draft.dureeMinutesOuvrees!, draft.calendrierSpecifique).then(result => {
          if (active) this.previewDate.set(result.dateFin);
        }).catch(() => {
          if (active) this.previewError.set('Aperçu indisponible. La date de fin sera calculée à l’enregistrement.');
        }).finally(() => { if (active) this.previewLoading.set(false); });
      }, 300);
      cleanup(() => { active = false; clearTimeout(timer); });
    });
  }
  formatDate(value: string): string {
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr', { dateStyle: 'long' }).format(date);
  }
  readonly predecessor = signal('');
  readonly linkType = signal<PrecedenceType>('FD');
  readonly linkTypes: NfSelectOption[] = [
    { value: 'FD', label: 'Fin → Début (FD)' }, { value: 'DD', label: 'Début → Début (DD)' },
    { value: 'FF', label: 'Fin → Fin (FF)' }, { value: 'DF', label: 'Début → Fin (DF)' },
  ];
  readonly predecessorOptions = computed<NfSelectOption[]>(() => {
    const draft = this.facade.draft();
    const existing = new Set(this.detail()?.predecessors.map(p => p.predActiviteId));
    return [{ value: '', label: 'Choisir une activité' }, ...this.facade.activites()
      .filter(a => a.chantierId === draft?.chantierId && a.id !== draft?.activiteId && a.forme !== 'PHASE' && !existing.has(a.id))
      .map(a => ({ value: a.id, label: a.libelle }))];
  });
  activityName(id: string): string { return this.facade.activites().find(a => a.id === id)?.libelle || id; }
  async addPredecessor(): Promise<void> {
    if (await this.facade.changePrecedence(this.predecessor(), this.linkType())) this.predecessor.set('');
  }
  readonly formes: ActiviteForme[] = ['ACTIVITE', 'JALON', 'PHASE'];
  readonly noeudId = signal('');
  readonly quantitePrevue = signal(0);
  readonly quantiteFaite = signal(0);
  readonly avancementPercent = signal(0);
  readonly dateAvancement = signal(toIsoDate(new Date()));

  readonly rattachements = computed(() => this.facade.selectedActiviteDetail()?.activite.rattachements ?? []);
  readonly detail = computed(() => this.facade.selectedActiviteDetail());

  readonly parentOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.planning.drawer.parentNone') },
    ...this.facade.parentOptions().map((opt) => ({ value: opt.id, label: opt.libelle })),
  ]);

  readonly zoneOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.planning.drawer.zoneNone') },
    ...this.facade.zoneOptions().map((zone) => ({ value: zone.id, label: zone.designation })),
  ]);

  readonly noeudOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: this.translate.instant('chantiers.planning.drawer.choisirArbre') },
    ...this.facade.noeudOptions().map((n) => ({
      value: n.id,
      label: `${n.code} ${n.designation} · restants ${n.reste} ${n.unite}`,
    })),
  ]);

  readonly natureOptions = computed<NfSelectOption[]>(() => {
    const forme = this.facade.draft()?.forme ?? 'ACTIVITE';
    return [
      { value: '', label: this.translate.instant('chantiers.planning.drawer.natureNone') },
      ...naturesForForme(forme).map((n) => ({ value: n.code, label: this.translate.instant(n.labelKey) })),
    ];
  });

  readonly dureeHeures = computed(() => {
    const minutes = this.facade.draft()?.dureeMinutesOuvrees;
    return minutes != null ? minutes / 60 : 0;
  });

  readonly dureeJoursHint = computed(() => {
    const hours = this.dureeHeures();
    const perDay = this.facade.calendarContext().heuresParJour || 8;
    const days = hours / perDay;
    return this.translate.instant('chantiers.planning.drawer.dureeHint', {
      hours,
      days: Number.isInteger(days) ? days : days.toFixed(1),
      perDay,
    });
  });

  readonly drawerTitle = computed(() => {
    if (this.facade.drawerMode() === 'create') {
      const forme = this.facade.draft()?.forme ?? 'ACTIVITE';
      return this.translate.instant(`chantiers.planning.drawer.create.${this.formeKey(forme)}`);
    }
    return this.facade.draft()?.libelle || this.translate.instant('chantiers.planning.drawer.title');
  });

  formeKey(forme: ActiviteForme): 'activite' | 'jalon' | 'phase' {
    return forme === 'JALON' ? 'jalon' : forme === 'PHASE' ? 'phase' : 'activite';
  }

  onDebutChange(value: string): void {
    const draft = this.facade.draft();
    this.facade.patchDraft({
      dateDebut: value,
      dateFin: draft?.forme === 'JALON' ? value : draft?.dateFin,
    });
  }

  onDureeHeures(hours: number): void {
    const value = Number(hours);
    this.facade.patchDraft({
      dureeMinutesOuvrees: Number.isFinite(value) ? Math.round(value * 60) : null,
    });
  }

  readonly chantierLine = computed(() => {
    const id = this.facade.draft()?.chantierId;
    const chantier = this.facade.chantiers().find((c) => c.id === id);
    return chantier ? `${chantier.code} · ${chantier.name}` : '';
  });

  readonly badgeVariant = computed(() => {
    const status = this.detail()?.activite.status;
    if (status === 'EN_RETARD') return 'warning';
    if (status === 'EN_COURS') return 'success';
    if (status === 'TERMINE') return 'default';
    return 'info';
  });

  async onSave(close = true): Promise<void> {
    const result = await this.facade.saveDraft();
    if (result.ok && close) this.facade.closeDrawer();
  }

  async onRattacher(): Promise<void> {
    const id = this.noeudId();
    const qty = Number(this.quantitePrevue());
    const res = await this.facade.rattacherNoeud(id, qty);
    if (res.ok) {
      this.noeudId.set('');
      this.quantitePrevue.set(0);
    }
  }

  async onDetacher(rattachementId: string): Promise<void> {
    await this.facade.detacher(rattachementId);
  }

  async onAvancer(): Promise<void> {
    if (this.rattachements().length) {
      await this.facade.declarerAvancement({
        date: this.dateAvancement(),
        quantiteRealisee: Number(this.quantiteFaite()),
      });
    } else {
      await this.facade.declarerAvancement({
        date: this.dateAvancement(),
        avancementPercent: Number(this.avancementPercent()),
      });
    }
  }
}
