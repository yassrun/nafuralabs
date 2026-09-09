
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  EmptyStateComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  ToastService,
  type LookupSearchFn,
} from '@platform/lib/anatomy';

import {
  ChantierAffectationApiService,
  type ChantierAffectation,
} from '../../services/chantier-affectation-api.service';

const ROLE_LABELS: Record<string, string> = {
  BTP_DIRECTEUR_TRAVAUX: 'Directeur travaux',
  BTP_CONDUCTEUR_TRAVAUX: 'Conducteur de travaux',
  BTP_CHEF_CHANTIER: 'Chef de chantier',
  BTP_CHEF_EQUIPE: "Chef d'équipe",
  BTP_MAGASINIER: 'Magasinier',
  BTP_POINTEUR: 'Pointeur',
  BTP_INGENIEUR: 'Ingénieur',
};

@Component({
  selector: 'app-chantier-equipe-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ButtonComponent,
    EmptyStateComponent,
    NfSelectComponent,
  ],
  template: `
    <section class="equipe">
      <header class="equipe__header">
        <h3>{{ 'chantiers.chantier.detail.tabs.equipe' | translate }}</h3>
        @if (canAdd()) {
          <nf-button variant="primary" size="sm" (click)="showForm.set(true)">
            {{ 'chantiers.chantier.detail.equipe.add' | translate }}
          </nf-button>
        }
      </header>

      @if (showForm() && canAdd()) {
        <form class="equipe__form" (ngSubmit)="submit()">
          <label>
            <span>{{ 'chantiers.chantier.detail.equipe.employe' | translate }}</span>
            <nf-select
              name="employeId"
              lookupKey="employes"
              [lookupSearch]="searchEmployes"
              [(ngModel)]="draft.employeId"
              [selectedLabel]="draft.employeLabel"
              [placeholder]="'chantiers.chantier.detail.equipe.employe' | translate"
              [required]="true"
            />
          </label>
          <label>
            <span>{{ 'chantiers.chantier.detail.equipe.role' | translate }}</span>
            <select [(ngModel)]="draft.roleCode" name="roleCode" required>
              @for (r of roles(); track r) {
                <option [value]="r">{{ roleLabel(r) }}</option>
              }
            </select>
          </label>
          <label>
            <span>{{ 'chantiers.chantier.detail.equipe.dateDebut' | translate }}</span>
            <input type="date" [(ngModel)]="draft.dateDebut" name="dateDebut" required />
          </label>
          <label>
            <span>{{ 'chantiers.chantier.detail.equipe.dateFin' | translate }}</span>
            <input type="date" [(ngModel)]="draft.dateFin" name="dateFin" />
          </label>
          <div class="equipe__actions">
            <nf-button type="button" variant="ghost" size="sm" (click)="showForm.set(false)">
              {{ 'chantiers.common.actions.cancel' | translate }}
            </nf-button>
            <nf-button
              type="submit"
              variant="primary"
              size="sm"
              [disabled]="saving()"
              (clicked)="submit()"
            >
              {{ 'chantiers.common.actions.save' | translate }}
            </nf-button>
          </div>
        </form>
      }

      @if (loading()) {
        <p class="muted">{{ 'common.loading' | translate }}</p>
      } @else if (rows().length === 0) {
        <nf-empty-state
          [title]="(canAdd() ? 'chantiers.chantier.detail.equipe.emptyTitle' : 'chantiers.chantier.detail.equipe.noAuthorityTitle') | translate"
          [message]="(canAdd() ? 'chantiers.chantier.detail.equipe.emptyDesc' : 'chantiers.chantier.detail.equipe.noAuthorityDesc') | translate"
        />
      } @else {
        <table class="equipe__table">
          <thead>
            <tr>
              <th>{{ 'chantiers.chantier.detail.equipe.employe' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.equipe.role' | translate }}</th>
              <th>{{ 'chantiers.chantier.detail.equipe.periode' | translate }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <td>
                  <strong>{{ row.employeNom ?? row.employeId }}</strong>
                  @if (row.employeMatricule) {
                    <span class="muted"> · {{ row.employeMatricule }}</span>
                  }
                </td>
                <td>{{ row.roleLabel ?? roleLabel(row.roleCode) }}</td>
                <td>{{ row.dateDebut }}{{ row.dateFin ? ' → ' + row.dateFin : '' }}</td>
                <td>
                  @if (row.canMutate) {
                    <nf-button variant="ghost" size="sm" (click)="remove(row)">
                      {{ 'chantiers.common.actions.remove' | translate }}
                    </nf-button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .equipe { display: flex; flex-direction: column; gap: 1rem; }
    .equipe__header { display: flex; justify-content: space-between; align-items: center; }
    .equipe__form {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem; padding: 1rem; border: 1px solid var(--nf-border, #e5e7eb); border-radius: 8px;
    }
    .equipe__form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
    .equipe__form select, .equipe__form input { padding: 0.4rem 0.5rem; }
    .equipe__actions { display: flex; gap: 0.5rem; align-items: end; }
    .equipe__table { width: 100%; border-collapse: collapse; }
    .equipe__table th, .equipe__table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--nf-border, #e5e7eb); }
    .muted { color: var(--nf-muted, #6b7280); font-size: 0.85rem; }
  `,
})
export class ChantierEquipeTabComponent {
  readonly chantierId = input.required<string>();

  private readonly api = inject(ChantierAffectationApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly rows = signal<ChantierAffectation[]>([]);
  readonly roles = signal<string[]>([]);
  readonly canAdd = computed(() => this.roles().length > 0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);

  draft = {
    employeId: '',
    employeLabel: '',
    roleCode: '',
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: '',
  };

  readonly searchEmployes: LookupSearchFn = (q) =>
    this.lookupSearchers?.['employes']?.(q) ?? Promise.resolve([]);

  constructor() {
    effect(() => {
      const id = this.chantierId();
      if (id) {
        void this.reload();
      }
    });
  }

  roleLabel(code: string): string {
    return ROLE_LABELS[code] ?? code;
  }

  async reload(): Promise<void> {
    const id = this.chantierId();
    if (!id) return;
    this.loading.set(true);
    try {
      const [rows, roles] = await Promise.all([
        this.api.listByChantier(id),
        this.api.affectableRoles(id).catch(() => [] as string[]),
      ]);
      this.rows.set(rows ?? []);
      const assignable = roles ?? [];
      this.roles.set(assignable);
      if (assignable.length && !assignable.includes(this.draft.roleCode)) {
        this.draft.roleCode = assignable[0];
      }
      if (!assignable.length) {
        this.showForm.set(false);
      }
    } catch {
      this.rows.set([]);
      this.toast.error('Impossible de charger les affectations');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    const id = this.chantierId();
    if (!id || !this.draft.employeId || !this.draft.roleCode || !this.draft.dateDebut) {
      this.toast.warning('Employé, rôle et date de début sont requis');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.createAffectation(id, {
        employeId: this.draft.employeId,
        roleCode: this.draft.roleCode,
        dateDebut: this.draft.dateDebut,
        dateFin: this.draft.dateFin || null,
      });
      this.showForm.set(false);
      this.draft = {
        employeId: '',
        employeLabel: '',
        roleCode: this.roles()[0] ?? '',
        dateDebut: new Date().toISOString().slice(0, 10),
        dateFin: '',
      };
      await this.reload();
      this.toast.success('Affectation créée');
    } catch (e) {
      this.toast.error(this.mutationError(e));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(row: ChantierAffectation): Promise<void> {
    const id = this.chantierId();
    if (!id) return;
    try {
      await this.api.deactivate(id, row.id);
      await this.reload();
      this.toast.success('Affectation retirée');
    } catch (e) {
      this.toast.error(this.mutationError(e));
    }
  }

  private mutationError(e: unknown): string {
    const raw = e instanceof Error ? e.message : '';
    if (raw.includes('chantiers.affectation.interdit')) {
      return this.translate.instant('chantiers.chantier.detail.equipe.forbidden');
    }
    return raw || this.translate.instant('chantiers.chantier.detail.equipe.forbidden');
  }
}
