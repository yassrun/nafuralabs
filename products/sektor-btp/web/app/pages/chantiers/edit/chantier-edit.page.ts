import { CommonModule } from '@angular/common';
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
} from '@lib/anatomy';

import type { Chantier, ChantierStatus } from '@applications/erp/chantiers/models';
import { ErpLookupService } from '@applications/erp/shared/services/erp-lookup.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
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
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    NfSelectComponent,
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

        <section class="panel">
          <label>{{ 'chantiers.common.fields.code' | translate }}</label>
          <input type="text" class="fld fld--readonly" [value]="draft.code" readonly />

          <label for="ce-name">{{ 'chantiers.chantier.edit.fields.name' | translate }}</label>
          <input id="ce-name" type="text" [(ngModel)]="draft.name" name="name" class="fld" />

          <label for="ce-desc">{{ 'chantiers.chantier.edit.fields.description' | translate }}</label>
          <textarea id="ce-desc" [(ngModel)]="draft.description" name="desc" rows="3" class="fld"></textarea>

          <label for="ce-st">{{ 'chantiers.common.fields.statut' | translate }}</label>
          <select id="ce-st" [(ngModel)]="draft.status" name="st" class="fld">
            @for (opt of statusOptions; track opt.v) {
              <option [ngValue]="opt.v">{{ opt.labelKey | translate }}</option>
            }
          </select>

          <nf-select
            id="ce-cli"
            [(ngModel)]="draft.clientId"
            (ngModelChange)="onClientChange($event)"
            name="cli"
            class="client-select"
            [label]="'chantiers.common.fields.client' | translate"
            [placeholder]="'chantiers.common.fields.client' | translate"
            [options]="clientOptions()"
            lookupKey="clients"
            [listShortcut]="{ label: 'Voir les clients' }"
          />

          <label>{{ 'chantiers.chantier.edit.fields.marcheRef' | translate }}</label>
          <input type="text" [(ngModel)]="draft.marcheReference" name="mref" class="fld" />

          <label>{{ 'chantiers.chantier.edit.fields.adresse' | translate }}</label>
          <input type="text" [(ngModel)]="draft.adresse" name="adr" class="fld" />

          <label for="ce-ville">{{ 'chantiers.common.fields.ville' | translate }}</label>
          <input id="ce-ville" type="text" [(ngModel)]="draft.ville" name="ville" class="fld" />

          <label for="ce-ddeb">{{ 'chantiers.common.fields.dateDebut' | translate }}</label>
          <input id="ce-ddeb" type="date" [(ngModel)]="draft.dateDebut" name="ddeb" class="fld" />

          <label for="ce-dfin">{{ 'chantiers.common.fields.dateFinPrevue' | translate }}</label>
          <input id="ce-dfin" type="date" [(ngModel)]="draft.dateFinPrevue" name="dfin" class="fld" />

          <label>{{ 'chantiers.common.fields.budgetHt' | translate }}</label>
          <input type="number" [(ngModel)]="draft.budgetHt" name="bud" class="fld" min="1" step="1000" />

          <label>{{ 'chantiers.chantier.edit.fields.tva' | translate }}</label>
          <input type="number" [(ngModel)]="draft.tvaTaux" name="tva" class="fld" min="0" max="30" step="1" />

          <label>{{ 'chantiers.chantier.edit.fields.rg' | translate }}</label>
          <input type="number" [(ngModel)]="draft.cautionGarantie" name="rg" class="fld" min="0" max="15" step="0.5" />

          <label for="ce-chef">{{ 'chantiers.chantier.edit.fields.chef' | translate }}</label>
          <input id="ce-chef" type="text" [(ngModel)]="draft.chefChantierName" name="chef" class="fld" />

          <label for="ce-cond">{{ 'chantiers.chantier.edit.fields.conducteur' | translate }}</label>
          <input id="ce-cond" type="text" [(ngModel)]="draft.conducteurTravauxName" name="cond" class="fld" />
        </section>

        <div class="nav-actions">
          <nf-button variant="secondary" (clicked)="goBack()">{{ 'chantiers.common.actions.cancel' | translate }}</nf-button>
          <nf-button variant="primary" (clicked)="submit()" [disabled]="saving()">
            {{ 'chantiers.chantier.edit.submit' | translate }}
          </nf-button>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .loading { padding: 1.5rem; color: var(--nf-color-text-secondary); }
    .panel { display: flex; flex-direction: column; gap: 0.35rem; max-width: 520px; margin-bottom: 1.25rem; }
    label { font-size: 0.78rem; font-weight: 600; color: var(--nf-color-text-secondary); margin-top: 0.35rem; }
    .fld { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 0.9rem; }
    .fld--readonly { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); }
    .client-select { display: block; }
    .err { color: var(--nf-color-danger-700); font-size: 0.88rem; margin: 0 0 0.75rem; }
    .nav-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; padding-top: 0.5rem; border-top: 1px solid var(--nf-color-bg-muted); }
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
    chefChantierName: '',
    conducteurTravauxName: '',
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
    void this.loadClients();
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

  private async loadClients(): Promise<void> {
    const clients = await this.erpLookup.partnersByRole('CLIENT');
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
    this.draft.marcheReference = c.marcheReference ?? '';
    this.draft.adresse = c.adresse ?? '';
    this.draft.ville = c.ville;
    this.draft.dateDebut = c.dateDebut?.slice(0, 10) ?? '';
    this.draft.dateFinPrevue = c.dateFinPrevue?.slice(0, 10) ?? '';
    this.draft.budgetHt = c.budgetHt;
    this.draft.tvaTaux = c.tvaTaux;
    this.draft.cautionGarantie = c.cautionGarantie ?? 7;
    this.draft.chefChantierName = c.chefChantierName ?? '';
    this.draft.conducteurTravauxName = c.conducteurTravauxName ?? '';
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
        chefChantierName: this.draft.chefChantierName,
        conducteurTravauxName: this.draft.conducteurTravauxName,
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
    if (!this.draft.chefChantierName.trim() || !this.draft.conducteurTravauxName.trim()) {
      this.validationMessage.set(t('chantiers.chantier.edit.validation.team'));
      return false;
    }
    this.validationMessage.set(null);
    return true;
  }
}
