
import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ButtonComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  type LookupSearchFn,
  ScreenComponent,
} from '@platform/lib/anatomy';

import {
  MaterielAffectationApiService,
  apiToAffectationChantier,
} from '@app/catalogue/services/materiel-affectation-api.service';
import type { AffectationChantier } from '@app/catalogue/models';

@Component({
  selector: 'app-affectations',
  standalone: true,
  imports: [
    FormsModule,
    ScreenComponent,
    ButtonComponent,
    NfSelectComponent,
  ],
  template: `
    <nf-screen [header]="{
          title: 'Affectations chantier',
          subtitle: summary(),
          breadcrumbs: [
            { label: 'Stock & Logistique', route: '/inventory/suivi/etat-stock' },
            { label: 'Matériel & Équipements' },
            { label: 'Affectations chantier' }
          ]
        }" [scroll]="true">

      <section class="form-card" data-testid="affectation-create-form">
        <h3>Nouvelle affectation</h3>
        <div class="row">
          <nf-select
            class="fld"
            label="Matériel"
            lookupKey="materiels"
            placeholder="Taper ≥ 2 car. — engin…"
            [lookupSearch]="searchMateriels"
            [(ngModel)]="draft.materielId"
            (ngModelChange)="onMaterielChange($event)"
            name="materielId"
            [selectedLabel]="draft.materielLabel"
            data-testid="affectation-materiel-combobox"
          />
        </div>
        <div class="row">
          <nf-select
            class="fld"
            label="Chantier"
            lookupKey="chantiers"
            placeholder="Taper ≥ 2 car. — chantier…"
            [lookupSearch]="searchChantiers"
            [(ngModel)]="draft.chantierId"
            (ngModelChange)="onChantierChange($event)"
            name="chantierId"
            [selectedLabel]="draft.chantierLabel"
            data-testid="affectation-chantier-combobox"
          />
        </div>
        <div class="row">
          <label for="aff-debut">Début</label>
          <input id="aff-debut" type="date" [(ngModel)]="draft.dateDebut" name="dateDebut" />
        </div>
        <div class="row">
          <label for="aff-fin">Fin (optionnel)</label>
          <input id="aff-fin" type="date" [(ngModel)]="draft.dateFin" name="dateFin" />
        </div>
        @if (saveError()) {
          <p class="err" role="alert">{{ saveError() }}</p>
        }
        <nf-button
          type="button"
          variant="secondary"
          [disabled]="saving()"
          data-testid="affectation-submit"
          (clicked)="save()"
        >
          Enregistrer
        </nf-button>
      </section>

      <section class="affectations-card">
        <table>
          <thead>
            <tr>
              <th>Matériel</th>
              <th>Chantier</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (item of affectations(); track item.id) {
              <tr>
                <td>
                  <strong>{{ item.materielName || item.materielId }}</strong>
                </td>
                <td>{{ item.chantierRef }}</td>
                <td>{{ item.dateDebut }}</td>
                <td>{{ item.dateFin || 'En cours' }}</td>
                <td>
                  <span class="status" [class.status--active]="item.status === 'AFFECTE'">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty">Aucune affectation disponible.</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </nf-screen>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .form-card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        padding: 0.85rem;
        margin-bottom: 0.75rem;
        background: var(--nf-color-surface);
      }

      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .fld {
        flex: 1;
        min-width: 14rem;
      }

      label {
        min-width: 8rem;
        color: var(--nf-color-text-secondary);
        font-size: 0.85rem;
      }

      input {
        flex: 1;
        min-width: 10rem;
        padding: 0.35rem 0.5rem;
        border: 1px solid var(--nf-color-border);
        border-radius: 0.35rem;
      }

      .err {
        color: var(--nf-color-danger-700);
        font-size: 0.85rem;
      }

      .affectations-card {
        border: 1px solid var(--nf-color-border);
        border-radius: 0.75rem;
        background: var(--nf-color-surface);
        overflow: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 0.75rem 0.875rem;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        text-align: left;
      }

      th {
        background: var(--nf-color-bg-subtle);
        color: var(--nf-color-text-secondary);
        font-weight: 600;
      }

      .status {
        display: inline-flex;
        align-items: center;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: var(--nf-color-border);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status--active {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-700);
      }

      .empty {
        text-align: center;
        color: var(--nf-color-text-secondary);
      }
    `,
  ],
})
export class AffectationsPage implements OnInit {
  private readonly api = inject(MaterielAffectationApiService);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly affectations = signal<AffectationChantier[]>([]);
  readonly saving = signal(false);
  readonly saveError = signal('');

  readonly searchMateriels: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['materiels']?.(q) ?? Promise.resolve([]));
    this.materielHits = hits;
    return hits;
  };

  readonly searchChantiers: LookupSearchFn = async (q) => {
    const hits = await (this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]));
    this.chantierHits = hits;
    return hits;
  };

  private materielHits: Array<{ value: string; label: string }> = [];
  private chantierHits: Array<{ value: string; label: string }> = [];

  readonly draft = {
    materielId: '',
    materielLabel: '',
    chantierId: '',
    chantierLabel: '',
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFin: '',
  };

  ngOnInit(): void {
    void this.load();
  }

  onMaterielChange(value: string): void {
    this.draft.materielId = value ?? '';
    const hit = this.materielHits.find((h) => h.value === value);
    this.draft.materielLabel = hit?.label ?? '';
  }

  onChantierChange(value: string): void {
    this.draft.chantierId = value ?? '';
    const hit = this.chantierHits.find((h) => h.value === value);
    this.draft.chantierLabel = hit?.label ?? '';
  }

  private async load(): Promise<void> {
    const rows = await this.api.list();
    this.affectations.set(rows.map(apiToAffectationChantier));
  }

  async save(): Promise<void> {
    this.saveError.set('');
    if (!this.draft.materielId.trim() || !this.draft.chantierId.trim()) {
      this.saveError.set('Matériel et chantier requis.');
      return;
    }
    this.saving.set(true);
    try {
      const chantierRef =
        this.draft.chantierLabel.trim() || this.draft.chantierId.trim();
      await this.api.create({
        materielId: this.draft.materielId.trim(),
        chantierRef,
        dateDebut: this.draft.dateDebut,
        ...(this.draft.dateFin ? { dateFin: this.draft.dateFin } : {}),
      });
      this.draft.materielId = '';
      this.draft.materielLabel = '';
      this.draft.chantierId = '';
      this.draft.chantierLabel = '';
      await this.load();
    } catch {
      this.saveError.set('Enregistrement impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  readonly summary = computed(() => {
    const list = this.affectations();
    const active = list.filter((a) => a.status === 'AFFECTE').length;
    return `${list.length} affectation(s) — ${active} en cours`;
  });
}
