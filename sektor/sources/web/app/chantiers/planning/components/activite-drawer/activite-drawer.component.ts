import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { BadgeComponent, ButtonComponent, DrawerComponent } from '@platform/lib/anatomy/components';

import { PlanningFacade, toIsoDate } from '../../services/planning.facade';

@Component({
  selector: 'app-activite-drawer',
  standalone: true,
  imports: [DrawerComponent, BadgeComponent, ButtonComponent, FormsModule, TranslateModule],
  template: `
    <nf-drawer
      [open]="facade.drawerOpen()"
      [title]="drawerTitle()"
      size="md"
      (closed)="facade.closeDrawer()">
      @if (facade.draft(); as draft) {
        <form class="activite-drawer" data-testid="activite-drawer" (submit)="$event.preventDefault(); onSave()">
          <p class="activite-drawer__eyebrow">{{ chantierLine() }}</p>

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

          <div class="activite-drawer__row">
            <label class="activite-drawer__field">
              <span>{{ 'chantiers.planning.drawer.debut' | translate }}</span>
              <input
                type="date"
                [ngModel]="draft.dateDebut"
                (ngModelChange)="facade.patchDraft({ dateDebut: $event })"
                name="dateDebut" />
            </label>
            <label class="activite-drawer__field">
              <span>{{ 'chantiers.planning.drawer.fin' | translate }}</span>
              <input
                type="date"
                [ngModel]="draft.dateFin"
                (ngModelChange)="facade.patchDraft({ dateFin: $event })"
                name="dateFin" />
            </label>
          </div>

          <label class="activite-drawer__field">
            <span>{{ 'chantiers.planning.drawer.parent' | translate }}</span>
            <select
              [ngModel]="draft.parentActiviteId"
              (ngModelChange)="facade.patchDraft({ parentActiviteId: $event })"
              name="parentActiviteId">
              <option value="">{{ 'chantiers.planning.drawer.parentNone' | translate }}</option>
              @for (opt of facade.parentOptions(); track opt.id) {
                <option [value]="opt.id">{{ opt.libelle }}</option>
              }
            </select>
          </label>

          <label class="activite-drawer__field">
            <span>{{ 'chantiers.planning.drawer.zone' | translate }}</span>
            <select
              [ngModel]="draft.zoneId"
              (ngModelChange)="facade.patchDraft({ zoneId: $event })"
              name="zoneId">
              <option value="">{{ 'chantiers.planning.drawer.zoneNone' | translate }}</option>
              @for (zone of facade.zoneOptions(); track zone.id) {
                <option [value]="zone.id">{{ zone.designation }}</option>
              }
            </select>
          </label>

          @if (facade.drawerMode() === 'create') {
            <p class="activite-drawer__hint">{{ 'chantiers.planning.drawer.rattacherApres' | translate }}</p>
          }

          @if (facade.drawerMode() === 'edit') {
            <section class="activite-drawer__block" data-testid="activite-travaux">
              <h3>{{ 'chantiers.planning.drawer.travauxLies' | translate }}</h3>
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
                <select
                  data-testid="activite-noeud-picker"
                  [ngModel]="noeudId()"
                  (ngModelChange)="noeudId.set($event)"
                  name="noeudId">
                  <option value="">{{ 'chantiers.planning.drawer.choisirArbre' | translate }}</option>
                  @for (n of facade.noeudOptions(); track n.id) {
                    <option [value]="n.id">{{ n.code }} {{ n.designation }} · restants {{ n.reste }} {{ n.unite }}</option>
                  }
                </select>
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
            </section>

            <section class="activite-drawer__block" data-testid="activite-avancement">
              <h3>{{ 'chantiers.planning.drawer.avancement' | translate }}</h3>
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
            </section>
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
      .activite-drawer__field input,
      .activite-drawer__field select {
        min-height: 2.6rem;
        border: 1px solid color-mix(in srgb, var(--nf-primary, var(--nf-color-primary-600)) 14%, var(--nf-color-border));
        border-radius: 0.75rem;
        background: var(--nf-color-surface);
        padding: 0.55rem 0.75rem;
        font: inherit;
        color: var(--nf-text-primary);
      }
      .activite-drawer__row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .activite-drawer__hint { margin: 0; font-size: 0.82rem; color: var(--nf-color-text-secondary); }
      .activite-drawer__block { display: grid; gap: 0.65rem; padding-top: 0.4rem; border-top: 1px solid var(--nf-color-border, #e2e8f0); }
      .activite-drawer__block h3 { margin: 0; font-size: 0.92rem; }
      .activite-drawer__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.4rem; }
      .activite-drawer__list li { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; font-size: 0.86rem; }
      .activite-drawer__error { margin: 0; padding: 0.7rem 0.85rem; border-radius: 0.75rem; background: color-mix(in srgb, var(--nf-color-danger-600, #dc2626) 12%, transparent); color: var(--nf-color-danger-600, #b91c1c); font-size: 0.86rem; }
      .activite-drawer__footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.4rem; }
      @media (max-width: 640px) {
        .activite-drawer__row { grid-template-columns: 1fr; }
        .activite-drawer__footer { flex-direction: column-reverse; }
      }
    `,
  ],
})
export class ActiviteDrawerComponent {
  readonly facade = inject(PlanningFacade);

  readonly noeudId = signal('');
  readonly quantitePrevue = signal(0);
  readonly quantiteFaite = signal(0);
  readonly avancementPercent = signal(0);
  readonly dateAvancement = signal(toIsoDate(new Date()));

  readonly rattachements = computed(() => this.facade.selectedActiviteDetail()?.activite.rattachements ?? []);
  readonly detail = computed(() => this.facade.selectedActiviteDetail());

  readonly drawerTitle = computed(() =>
    this.facade.drawerMode() === 'create' ? 'Nouvelle activité' : this.facade.draft()?.libelle || 'Activité',
  );

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

  async onSave(): Promise<void> {
    await this.facade.saveDraft();
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
