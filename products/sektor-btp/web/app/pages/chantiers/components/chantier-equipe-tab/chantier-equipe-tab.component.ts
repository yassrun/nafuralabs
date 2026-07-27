import { CommonModule } from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, EmptyStateComponent, NfSelectComponent, ActionBarComponent, type NfSelectOption } from '@lib/anatomy/components';
import { ToastService } from '@lib/anatomy';
import { ErpLookupService } from '@app/shared/services/erp-lookup.service';

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
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent, EmptyStateComponent, NfSelectComponent, ActionBarComponent],
  template: `
    <section class="equipe">
      <header class="equipe__header">
        <h3>{{ 'chantiers.chantier.detail.tabs.equipe' | translate }}</h3>
        <nf-button variant="primary" size="sm" (clicked)="showForm.set(true)">
          {{ 'chantiers.chantier.detail.equipe.add' | translate }}
        </nf-button>
      </header>

      @if (showForm()) {
        <form class="equipe__form" (ngSubmit)="submit()">
          <nf-select
            name="employeId"
            [label]="'chantiers.chantier.detail.equipe.employe' | translate"
            [options]="employeeOptions()"
            [(ngModel)]="draft.employeId"
            [required]="true"
          />
          <nf-select
            name="roleCode"
            [label]="'chantiers.chantier.detail.equipe.role' | translate"
            [options]="roleOptions()"
            [(ngModel)]="draft.roleCode"
            [required]="true"
          />
          <label>
            <span>{{ 'chantiers.chantier.detail.equipe.dateDebut' | translate }}</span>
            <input type="date" [(ngModel)]="draft.dateDebut" name="dateDebut" required />
          </label>
          <label>
            <span>{{ 'chantiers.chantier.detail.equipe.dateFin' | translate }}</span>
            <input type="date" [(ngModel)]="draft.dateFin" name="dateFin" />
          </label>
          <nf-action-bar align="right" class="equipe__actions">
            <nf-button type="button" variant="ghost" size="sm" (clicked)="showForm.set(false)">
              {{ 'common.cancel' | translate }}
            </nf-button>
            <nf-button type="submit" variant="primary" size="sm" [disabled]="saving()">
              {{ 'common.save' | translate }}
            </nf-button>
          </nf-action-bar>
        </form>
      }

      @if (loading()) {
        <p class="muted">{{ 'common.loading' | translate }}</p>
      } @else if (rows().length === 0) {
        <nf-empty-state
          [title]="'chantiers.chantier.detail.equipe.emptyTitle' | translate"
          [message]="'chantiers.chantier.detail.equipe.emptyDesc' | translate"
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
                  <nf-button variant="ghost" size="sm" (clicked)="remove(row)">
                    {{ 'common.remove' | translate }}
                  </nf-button>
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
    .equipe__form input { padding: 0.4rem 0.5rem; }
    .equipe__actions { grid-column: 1 / -1; }
    .equipe__table { width: 100%; border-collapse: collapse; }
    .equipe__table th, .equipe__table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--nf-border, #e5e7eb); }
    .muted { color: var(--nf-muted, #6b7280); font-size: 0.85rem; }
  `,
})
export class ChantierEquipeTabComponent {
  readonly chantierId = input.required<string>();

  private readonly api = inject(ChantierAffectationApiService);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly toast = inject(ToastService);

  readonly rows = signal<ChantierAffectation[]>([]);
  readonly roles = signal<string[]>(Object.keys(ROLE_LABELS));
  readonly employees = signal<{ id: string; name: string; matricule: string }[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);

  readonly employeeOptions = computed<NfSelectOption[]>(() => [
    { value: '', label: '—' },
    ...this.employees().map((e) => ({
      value: e.id,
      label: `${e.name} (${e.matricule})`,
    })),
  ]);

  readonly roleOptions = computed<NfSelectOption[]>(() =>
    this.roles().map((r) => ({ value: r, label: this.roleLabel(r) })),
  );

  draft = {
    employeId: '',
    roleCode: 'BTP_CHEF_CHANTIER',
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: '',
  };

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
      const [rows, roles, emps] = await Promise.all([
        this.api.listByChantier(id),
        this.api.affectableRoles(id).catch(() => Object.keys(ROLE_LABELS)),
        this.erpLookup.employes('ACTIF'),
      ]);
      this.rows.set(rows ?? []);
      this.roles.set(roles?.length ? roles : Object.keys(ROLE_LABELS));
      this.employees.set(
        emps.map((e) => ({
          id: String(e.key),
          name: e.value,
          matricule: String((e.data as Record<string, unknown> | undefined)?.['matricule'] ?? ''),
        })),
      );
    } catch {
      this.rows.set([]);
      this.toast.error('Impossible de charger les affectations');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
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
        roleCode: 'BTP_CHEF_CHANTIER',
        dateDebut: new Date().toISOString().slice(0, 10),
        dateFin: '',
      };
      await this.reload();
      this.toast.success('Affectation créée');
    } catch (e) {
      this.toast.error(e instanceof Error ? e.message : 'Création impossible');
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
      this.toast.error(e instanceof Error ? e.message : 'Suppression impossible');
    }
  }
}
