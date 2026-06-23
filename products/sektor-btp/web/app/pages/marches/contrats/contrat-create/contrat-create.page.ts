import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy';
import type { Chantier } from '@applications/erp/chantiers/models';
import {
  MARCHE_NATURE_KEYS,
  MARCHE_TYPE_KEYS,
} from '@applications/erp/shell/i18n-labels';
import { ChantierApiService } from '../../../chantiers/services/chantier-api.service';
import { ContratMarcheApiService } from '../services/contrat-marche-api.service';
import type { MarcheNature, MarcheType } from '../../models';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-contrat-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    TranslateModule,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="panel">
        <label>{{ 'marches.contrat.create.fields.chantier' | translate }}</label>
        <select
          class="fld"
          [(ngModel)]="draft.chantierId"
          name="chantierId"
          required
          (ngModelChange)="onChantierChange($event)"
        >
          <option value="">{{ 'marches.contrat.create.fields.chantierPlaceholder' | translate }}</option>
          @for (c of chantiers(); track c.id) {
            <option [value]="c.id">{{ c.code }} — {{ c.name }}</option>
          }
        </select>

        @if (draft.clientNom) {
          <label>{{ 'marches.contrat.create.fields.client' | translate }}</label>
          <input class="fld fld--readonly" type="text" [value]="draft.clientNom" readonly />
        }

        <label>{{ 'marches.contrat.create.fields.numero' | translate }}</label>
        <input class="fld" type="text" [(ngModel)]="draft.numero" name="numero" />

        <label>{{ 'marches.contrat.create.fields.intitule' | translate }}</label>
        <input class="fld" type="text" [(ngModel)]="draft.intitule" name="intitule" required />

        <div class="row">
          <div>
            <label>{{ 'marches.contrat.create.fields.type' | translate }}</label>
            <select class="fld" [(ngModel)]="draft.type" name="type" required>
              @for (t of typeOptions; track t) {
                <option [value]="t">{{ MARCHE_TYPE_KEYS[t] | translate }}</option>
              }
            </select>
          </div>
          <div>
            <label>{{ 'marches.contrat.create.fields.nature' | translate }}</label>
            <select class="fld" [(ngModel)]="draft.nature" name="nature" required>
              @for (n of natureOptions; track n) {
                <option [value]="n">{{ MARCHE_NATURE_KEYS[n] | translate }}</option>
              }
            </select>
          </div>
        </div>

        <label>{{ 'marches.contrat.create.fields.montantInitialHt' | translate }}</label>
        <input class="fld" type="number" min="0" step="0.01" [(ngModel)]="draft.montantInitialHt" name="montantInitialHt" required />

        <div class="row">
          <div>
            <label>{{ 'marches.contrat.create.fields.tvaTaux' | translate }}</label>
            <input class="fld" type="number" min="0" max="100" step="0.01" [(ngModel)]="draft.tvaTaux" name="tvaTaux" required />
          </div>
          <div>
            <label>{{ 'marches.contrat.create.fields.retenueGarantieTaux' | translate }}</label>
            <input class="fld" type="number" min="0" max="100" step="0.01" [(ngModel)]="draft.retenueGarantieTaux" name="retenueGarantieTaux" required />
          </div>
        </div>

        <label>{{ 'marches.contrat.create.fields.dateOrdreService' | translate }}</label>
        <input class="fld" type="date" [(ngModel)]="draft.dateOrdreService" name="dateOrdreService" required />

        <div class="actions">
          <nf-button variant="secondary" (clicked)="cancel()">
            {{ 'marches.common.actions.cancel' | translate }}
          </nf-button>
          <nf-button variant="primary" [disabled]="saving()" (clicked)="submit()">
            {{ 'marches.contrat.create.submit' | translate }}
          </nf-button>
        </div>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .panel {
      max-width: 520px; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border);
      border-radius: 0.75rem; padding: 1.25rem; display: grid; gap: 0.5rem;
    }
    label { font-size: 0.8rem; font-weight: 600; color: var(--nf-color-text-secondary); }
    .fld { width: 100%; padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .fld--readonly { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.75rem; }
  `],
})
export class ContratCreatePage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly api = inject(ContratMarcheApiService);
  private readonly toast = inject(ToastService);

  readonly MARCHE_TYPE_KEYS = MARCHE_TYPE_KEYS;
  readonly MARCHE_NATURE_KEYS = MARCHE_NATURE_KEYS;

  readonly chantiers = signal<Chantier[]>([]);
  readonly saving = signal(false);

  readonly typeOptions = Object.keys(MARCHE_TYPE_KEYS) as MarcheType[];
  readonly natureOptions = Object.keys(MARCHE_NATURE_KEYS) as MarcheNature[];

  draft = {
    numero: '',
    intitule: '',
    chantierId: '',
    clientId: '',
    clientNom: '',
    chantierCode: '',
    chantierNom: '',
    type: 'FORFAIT' as MarcheType,
    nature: 'PRIVE_PME' as MarcheNature,
    montantInitialHt: 0,
    tvaTaux: 20,
    retenueGarantieTaux: 7,
    dateOrdreService: todayIso(),
    status: 'BROUILLON' as const,
  };

  readonly headerConfig = {
    title: this.translate.instant('marches.contrat.create.title'),
    subtitle: this.translate.instant('marches.contrat.create.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('marches.module.title'), route: '/marches' },
      { label: this.translate.instant('marches.contrat.listing.breadcrumb'), route: '/marches/contrats' },
      { label: this.translate.instant('marches.contrat.create.breadcrumb') },
    ],
  };

  ngOnInit(): void {
    const chantierIdParam = this.route.snapshot.queryParamMap.get('chantierId') ?? '';
    void this.chantierApi.getAll().then(
      (res) => {
        this.chantiers.set(res.items);
        const initialId = chantierIdParam && res.items.some((c) => c.id === chantierIdParam)
          ? chantierIdParam
          : res.items[0]?.id ?? '';
        if (initialId) {
          this.draft.chantierId = initialId;
          this.applyChantierPrefill(initialId);
        }
      },
      () => this.chantiers.set([]),
    );
  }

  onChantierChange(chantierId: string): void {
    this.applyChantierPrefill(chantierId);
  }

  private applyChantierPrefill(chantierId: string): void {
    const c = this.chantiers().find((row) => row.id === chantierId);
    if (!c) {
      this.draft.clientId = '';
      this.draft.clientNom = '';
      this.draft.chantierCode = '';
      this.draft.chantierNom = '';
      return;
    }

    this.draft.clientId = c.clientId;
    this.draft.clientNom = c.clientName ?? '';
    this.draft.chantierCode = c.code;
    this.draft.chantierNom = c.name;
    this.draft.montantInitialHt = c.budgetHt;
    this.draft.tvaTaux = c.tvaTaux;
    this.draft.dateOrdreService = c.dateOrdreService ?? c.dateDebut ?? todayIso();

    if (!this.draft.intitule.trim()) {
      this.draft.intitule = c.name;
    }
    if (!this.draft.numero.trim() && c.marcheReference?.trim()) {
      this.draft.numero = c.marcheReference.trim();
    }
  }

  cancel(): void {
    void this.router.navigate(['/marches/contrats']);
  }

  async submit(): Promise<void> {
    const {
      chantierId,
      intitule,
      montantInitialHt,
      clientId,
      clientNom,
      chantierCode,
      chantierNom,
      numero,
      type,
      nature,
      tvaTaux,
      retenueGarantieTaux,
      dateOrdreService,
      status,
    } = this.draft;

    if (!chantierId || !intitule.trim() || montantInitialHt <= 0) {
      this.toast.error(this.translate.instant('marches.contrat.create.errors.required'));
      return;
    }

    this.saving.set(true);
    try {
      const created = await this.api.create({
        numero: numero.trim() || undefined,
        intitule: intitule.trim(),
        chantierId,
        chantierCode,
        chantierNom,
        clientId,
        clientNom,
        type,
        nature,
        montantInitialHt,
        tvaTaux,
        retenueGarantieTaux,
        retenueSourceTaux: 0,
        dateOrdreService,
        status,
      });
      this.toast.success(this.translate.instant('marches.contrat.create.success'));
      void this.router.navigate(['/marches/contrats', created.id]);
    } catch {
      this.toast.error(this.translate.instant('marches.contrat.create.errors.failed'));
    } finally {
      this.saving.set(false);
    }
  }
}
