
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import {
  ButtonComponent,
  EmptyStateComponent,
  NfSelectComponent,
  type NfSelectOption,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
  VilleMaSelectComponent,
} from '@platform/lib/anatomy';

import type { Chantier, ChantierStatus } from '@app/chantiers/models';
import { ErpLookupService, partnerSelectOptions } from '@app/socle/shared/services/erp-lookup.service';
import { ErpAuditService } from '@app/socle/shell/erp-audit.service';
import { ChantierApiService } from '../services/chantier-api.service';

interface ClientOption {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-chantier-edit',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    NfSelectComponent,
    VilleMaSelectComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell [scroll]="true">
      @if (loading()) {
        <p class="loading">{{ 'chantiers.chantier.edit.loading' | translate }}</p>
      } @else if (notFound()) {
        <nf-empty-state
          icon="search_off"
          [title]="'chantiers.chantier.detail.empty.notFoundTitle' | translate"
          [message]="'chantiers.chantier.detail.empty.notFoundMessage' | translate:{ ref: paramId() || '—' }"
          [actionLabel]="'chantiers.common.actions.backToList' | translate"
          (action)="goBack()">
        </nf-empty-state>
      } @else {
        <nf-page-header [config]="headerConfig()"></nf-page-header>

        @if (validationMessage()) {
          <p class="err" role="alert">{{ validationMessage() }}</p>
        }

        <div class="form-layout">
          <p class="required-hint">{{ 'chantiers.chantier.edit.requiredHint' | translate }}</p>

          <section class="form-section" aria-labelledby="identity-heading">
            <h2 id="identity-heading">{{ 'chantiers.chantier.edit.sections.identity' | translate }}</h2>
            <div class="field-grid">
              <div class="field">
                <label for="ce-code">{{ 'chantiers.common.fields.code' | translate }}</label>
                <input id="ce-code" type="text" class="fld fld--readonly" [value]="draft.code" readonly />
              </div>
              <div class="field">
                <label for="ce-st">{{ 'chantiers.common.fields.statut' | translate }} <span class="required" aria-hidden="true">*</span></label>
                <select id="ce-st" [(ngModel)]="draft.status" name="st" class="fld" required>
                  @for (opt of statusOptions; track opt.v) {
                    <option [ngValue]="opt.v">{{ opt.labelKey | translate }}</option>
                  }
                </select>
              </div>
              <div class="field field--full">
                <label for="ce-name">{{ 'chantiers.chantier.edit.fields.name' | translate }} <span class="required" aria-hidden="true">*</span></label>
                <input id="ce-name" type="text" [(ngModel)]="draft.name" name="name" class="fld" required />
              </div>
              <div class="field field--full">
                <label for="ce-desc">{{ 'chantiers.chantier.edit.fields.description' | translate }}</label>
                <textarea id="ce-desc" [(ngModel)]="draft.description" name="desc" rows="3" class="fld"></textarea>
              </div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="client-heading">
            <h2 id="client-heading">{{ 'chantiers.chantier.edit.sections.client' | translate }}</h2>
            <div class="field-grid">
              <nf-select
                id="ce-cli"
                [(ngModel)]="draft.clientId"
                (ngModelChange)="onClientChange($event)"
                name="cli"
                class="client-select"
                [label]="'chantiers.common.fields.client' | translate"
                [placeholder]="'chantiers.common.fields.client' | translate"
                [options]="clientOptions()"
                [required]="true"
                lookupKey="clients"
                [listShortcut]="{ label: ('chantiers.chantier.edit.viewClients' | translate) }"
                [lookupSearch]="searchClients"
                [selectedLabel]="draft.clientName"
              />
              <div class="field">
                <label for="ce-mref">{{ 'chantiers.chantier.edit.fields.marcheRef' | translate }}</label>
                <input id="ce-mref" type="text" [(ngModel)]="draft.marcheReference" name="mref" class="fld" />
              </div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="location-heading">
            <h2 id="location-heading">{{ 'chantiers.chantier.edit.sections.location' | translate }}</h2>
            <div class="field-grid">
              <div class="field field--full">
                <label for="ce-address">{{ 'chantiers.chantier.edit.fields.adresse' | translate }}</label>
                <input id="ce-address" type="text" [(ngModel)]="draft.adresse" name="adr" class="fld" />
              </div>
              <div class="field">
                <nf-ville-ma-select
                  id="ce-ville"
                  [label]="'chantiers.common.fields.ville' | translate"
                  [required]="true"
                  [(ngModel)]="draft.ville"
                  name="ville"
                />
              </div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="planning-heading">
            <h2 id="planning-heading">{{ 'chantiers.chantier.edit.sections.planning' | translate }}</h2>
            <div class="field-grid">
              <div class="field">
                <label for="ce-ddeb">{{ 'chantiers.common.fields.dateDebut' | translate }} <span class="required" aria-hidden="true">*</span></label>
                <input id="ce-ddeb" type="date" [(ngModel)]="draft.dateDebut" name="ddeb" class="fld" required />
              </div>
              <div class="field">
                <label for="ce-dfin">{{ 'chantiers.common.fields.dateFinPrevue' | translate }} <span class="required" aria-hidden="true">*</span></label>
                <input id="ce-dfin" type="date" [(ngModel)]="draft.dateFinPrevue" name="dfin" class="fld" required />
              </div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="financial-heading">
            <h2 id="financial-heading">{{ 'chantiers.chantier.edit.sections.financial' | translate }}</h2>
            <div class="field-grid field-grid--three">
              <div class="field">
                <label for="ce-budget">{{ 'chantiers.common.fields.budgetHt' | translate }} <span class="required" aria-hidden="true">*</span></label>
                <input id="ce-budget" type="number" [(ngModel)]="draft.budgetHt" name="bud" class="fld" min="1" step="1000" required />
              </div>
              <div class="field">
                <label for="ce-tva">{{ 'chantiers.chantier.edit.fields.tva' | translate }}</label>
                <input id="ce-tva" type="number" [(ngModel)]="draft.tvaTaux" name="tva" class="fld" min="0" max="30" step="1" />
              </div>
              <div class="field">
                <label for="ce-rg">{{ 'chantiers.chantier.edit.fields.rg' | translate }}</label>
                <input id="ce-rg" type="number" [(ngModel)]="draft.cautionGarantie" name="rg" class="fld" min="0" max="15" step="0.5" />
              </div>
            </div>
          </section>

          <section class="form-section" aria-labelledby="team-heading">
            <h2 id="team-heading">{{ 'chantiers.chantier.edit.sections.team' | translate }}</h2>
            <p class="required-hint">{{ 'chantiers.chantier.detail.equipe.seeTab' | translate }}</p>
          </section>

          <div class="nav-actions">
            <nf-button variant="secondary" (clicked)="goBack()">{{ 'chantiers.common.actions.cancel' | translate }}</nf-button>
            <nf-button variant="primary" (clicked)="submit()" [disabled]="saving()">
              {{ 'chantiers.chantier.edit.submit' | translate }}
            </nf-button>
          </div>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .loading { padding: 1.5rem; color: var(--nf-color-text-secondary); }
    .form-layout { width: min(100%, 880px); padding-bottom: 1rem; }
    .required-hint { margin: 0 0 0.75rem; color: var(--nf-color-text-secondary); font-size: 0.78rem; }
    .form-section { padding: 1rem 1.25rem 1.25rem; border: 1px solid var(--nf-color-border); border-radius: 0.75rem; background: var(--nf-color-surface); }
    .form-section + .form-section { margin-top: 0.75rem; }
    .form-section h2 { margin: 0 0 1rem; font-size: 0.9rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1rem; }
    .field-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .field { display: flex; min-width: 0; flex-direction: column; gap: 0.35rem; }
    .field--full { grid-column: 1 / -1; }
    label { font-size: 0.78rem; font-weight: 600; color: var(--nf-color-text-secondary); }
    .required { color: var(--nf-color-danger-600); }
    .fld { box-sizing: border-box; width: 100%; min-height: 38px; padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; background: var(--nf-color-surface); color: var(--nf-color-text-primary); font: inherit; font-size: 0.9rem; }
    textarea.fld { min-height: 76px; resize: vertical; }
    .fld:focus { border-color: var(--nf-color-primary-500); outline: 2px solid color-mix(in srgb, var(--nf-color-primary-500) 20%, transparent); outline-offset: 1px; }
    .fld--readonly { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); }
    .client-select { display: block; min-width: 0; }
    .err { width: min(100%, 880px); box-sizing: border-box; padding: 0.75rem 1rem; border: 1px solid var(--nf-color-danger-200); border-radius: 0.5rem; background: var(--nf-color-danger-50); color: var(--nf-color-danger-700); font-size: 0.88rem; margin: 0 0 0.75rem; }
    .nav-actions { position: sticky; bottom: 0; z-index: 2; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem; align-items: center; margin-top: 1rem; padding: 0.75rem 0; border-top: 1px solid var(--nf-color-bg-muted); background: var(--nf-color-surface); }
    @media (max-width: 720px) {
      .field-grid, .field-grid--three { grid-template-columns: 1fr; }
      .field--full { grid-column: auto; }
      .form-section { padding: 1rem; }
    }
  `],
})
export class ChantierEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly saving = signal(false);
  readonly validationMessage = signal<string | null>(null);

  private readonly _clients = signal<ClientOption[]>([]);
  readonly clientOptions = computed<NfSelectOption[]>(() =>
    this._clients().map((c) => ({
      value: c.id,
      label: `${c.code} — ${c.name}`,
    })),
  );

  readonly paramId = toSignal(
    this.route.paramMap.pipe(map((pm) => pm.get('id')?.trim() ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id')?.trim() ?? '' },
  );

  readonly draft = {
    id: '',
    code: '',
    name: '',
    description: '',
    status: 'EN_COURS' as ChantierStatus,
    clientId: '',
    clientName: '',
    marcheReference: '',
    adresse: '',
    ville: '',
    dateDebut: '',
    dateFinPrevue: '',
    budgetHt: 0,
    tvaTaux: 20,
    cautionGarantie: 7,
  };

  readonly statusOptions: { v: ChantierStatus; labelKey: string }[] = [
    { v: 'PROSPECT', labelKey: 'chantiers.status.prospect' },
    { v: 'EN_COURS', labelKey: 'chantiers.status.enCours' },
    { v: 'SUSPENDU', labelKey: 'chantiers.status.suspendu' },
    { v: 'TERMINE', labelKey: 'chantiers.status.termine' },
    { v: 'RECEPTIONNE', labelKey: 'chantiers.status.receptionne' },
    { v: 'CLOTURE', labelKey: 'chantiers.status.cloture' },
    { v: 'ANNULE', labelKey: 'chantiers.status.annule' },
  ];

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('chantiers.chantier.edit.title'),
    subtitle: this.draft.code ? `${this.draft.code} · ${this.draft.name}` : undefined,
    icon: 'edit',
    breadcrumbs: [
      { label: this.translate.instant('chantiers.routes.chantiersCrumb'), route: '/chantiers' },
      { label: this.draft.code || this.translate.instant('chantiers.chantier.edit.breadcrumb') },
    ],
  }));

  constructor() {
    effect(() => {
      const id = this.paramId();
      if (!id) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      void this.loadChantier(id);
    });
  }

  searchClients = (q: string) =>
    this.erpLookup.partnersByRole('CLIENT', q).then((items) => {
      this.setClients(items);
      return partnerSelectOptions(items);
    });

  private setClients(
    clients: Awaited<ReturnType<ErpLookupService['partnersByRole']>>,
  ): void {
    this._clients.set(
      clients.map((c) => ({
        id: String(c.key),
        code: String((c.data as Record<string, unknown> | undefined)?.['code'] ?? ''),
        name: String((c.data as Record<string, unknown> | undefined)?.['raisonSociale'] ?? c.value),
      })),
    );
  }

  private async loadChantier(id: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    try {
      const c = await this.chantierApi.getById(id);
      this.applyChantier(c);
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private applyChantier(c: Chantier): void {
    this.draft.id = c.id;
    this.draft.code = c.code;
    this.draft.name = c.name;
    this.draft.description = c.description ?? '';
    this.draft.status = c.status;
    this.draft.clientId = c.clientId ?? '';
    this.draft.clientName = c.clientName ?? '';
    if (this.draft.clientId) {
      this._clients.set([
        { id: this.draft.clientId, code: '', name: this.draft.clientName },
      ]);
    } else {
      this._clients.set([]);
    }
    this.draft.marcheReference = c.marcheReference ?? '';
    this.draft.adresse = c.adresse ?? '';
    this.draft.ville = c.ville;
    this.draft.dateDebut = c.dateDebut?.slice(0, 10) ?? '';
    this.draft.dateFinPrevue = c.dateFinPrevue?.slice(0, 10) ?? '';
    this.draft.budgetHt = c.budgetHt;
    this.draft.tvaTaux = c.tvaTaux;
    this.draft.cautionGarantie = c.cautionGarantie ?? 7;
  }

  onClientChange(id: string): void {
    const c = this._clients().find((x) => x.id === id);
    this.draft.clientName = c?.name ?? '';
  }

  goBack(): void {
    const id = this.draft.id || this.paramId();
    if (id) {
      void this.router.navigate(['/chantiers', id]);
      return;
    }
    void this.router.navigate(['/chantiers']);
  }

  submit(): void {
    if (!this.validate()) {
      return;
    }
    this.saving.set(true);
    void this.chantierApi
      .update(this.draft.id, {
        name: this.draft.name,
        description: this.draft.description || undefined,
        status: this.draft.status,
        clientId: this.draft.clientId || undefined,
        clientName: this.draft.clientName,
        marcheReference: this.draft.marcheReference || undefined,
        adresse: this.draft.adresse || undefined,
        ville: this.draft.ville,
        dateDebut: this.draft.dateDebut,
        dateFinPrevue: this.draft.dateFinPrevue,
        budgetHt: this.draft.budgetHt,
        tvaTaux: this.draft.tvaTaux,
        cautionGarantie: this.draft.cautionGarantie,
      })
      .then((updated) => {
        this.audit.log('UPDATE', 'chantier', updated.id, updated.code, updated.name);
        this.toast.success(this.translate.instant('chantiers.chantier.edit.success'));
        void this.router.navigate(['/chantiers', updated.id]);
      })
      .catch(() => {
        this.toast.error(this.translate.instant('chantiers.chantier.edit.failed'));
      })
      .finally(() => this.saving.set(false));
  }

  private validate(): boolean {
    const t = (k: string) => this.translate.instant(k);
    if (!this.draft.name.trim()) {
      this.validationMessage.set(t('chantiers.chantier.edit.validation.name'));
      return false;
    }
    if (!this.draft.clientId) {
      this.validationMessage.set(t('chantiers.chantier.edit.validation.client'));
      return false;
    }
    if (!this.draft.ville.trim() || !this.draft.dateDebut || !this.draft.dateFinPrevue) {
      this.validationMessage.set(t('chantiers.chantier.edit.validation.dates'));
      return false;
    }
    if (!this.draft.budgetHt || this.draft.budgetHt <= 0) {
      this.validationMessage.set(t('chantiers.chantier.edit.validation.budget'));
      return false;
    }
    this.validationMessage.set(null);
    return true;
  }
}
