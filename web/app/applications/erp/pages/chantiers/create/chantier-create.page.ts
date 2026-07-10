import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import {
  ButtonComponent,
  ConfirmDialogService,
  NfSelectComponent,
  type NfSelectOption,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
} from '@lib/anatomy';

import type { Chantier, ChantierStatus } from '@applications/erp/chantiers/models';
import { ErpLookupService } from '@applications/erp/shared/services/erp-lookup.service';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { ClientApiService } from '@applications/erp/pages/ventes/clients/services/client-api.service';
import { DevisApiService } from '@applications/erp/pages/etudes/devis/services/devis-api.service';
import { ChantierApiService } from '../services/chantier-api.service';

interface CreateClientOption {
  id: string;
  code: string;
  name: string;
}

interface CreateEmployeeOption {
  id: string;
  matricule: string;
  name: string;
}

function addMonthsIso(from: Date, months: number): string {
  const d = new Date(from.getFullYear(), from.getMonth() + months, from.getDate());
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-chantier-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    NfSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <p class="step-meta">{{ 'chantiers.create.stepLabel' | translate: { current: step() + 1, total: 5 } }}</p>
      <div class="progress">
        @for (s of [0,1,2,3,4]; track s) {
          <span class="progress__seg" [class.progress__seg--done]="step() >= s"></span>
        }
      </div>
      <p class="code-hint">{{ 'chantiers.create.codePreview' | translate: { code: nextCodePreview() } }}</p>

      @if (validationMessage()) {
        <p class="err" role="alert">{{ validationMessage() }}</p>
      }

      <!-- Étape 1 : identité -->
      @if (step() === 0) {
        <section class="panel">
          <label for="cc-name">{{ 'chantiers.create.fields.name' | translate }}</label>
          <input id="cc-name" type="text" [(ngModel)]="draft.name" name="name" class="fld" />
          <label for="cc-desc">{{ 'chantiers.create.fields.description' | translate }}</label>
          <textarea id="cc-desc" [(ngModel)]="draft.description" name="desc" rows="3" class="fld"></textarea>
          <label for="cc-st">{{ 'chantiers.create.fields.status' | translate }}</label>
          <select id="cc-st" [(ngModel)]="draft.status" name="st" class="fld">
            @for (opt of statusOptions; track opt.v) {
              <option [ngValue]="opt.v">{{ opt.labelKey | translate }}</option>
            }
          </select>
        </section>
      }

      <!-- Étape 2 : client & marché -->
      @if (step() === 1) {
        <section class="panel">
          <nf-select
            id="cc-cli"
            [(ngModel)]="draft.clientId"
            (ngModelChange)="onClientChange($event)"
            name="cli"
            class="client-select"
            [label]="'chantiers.create.fields.client' | translate"
            [placeholder]="onboardingMode() ? '— Je remplirai après —' : ('chantiers.create.fields.client' | translate)"
            [options]="clientOptions()"
            lookupKey="clients"
            [listShortcut]="{ label: 'chantiers.create.clientListShortcut' | translate }"
          />
          @if (!onboardingMode()) {
            <nf-button variant="ghost" class="client-create" (clicked)="createClientInline()">
              {{ 'chantiers.create.clientCreateCta' | translate }}
            </nf-button>
          }
          @if (onboardingMode() && clients().length === 0 && !hasClientListShortcut()) {
            <p class="onboarding-hint">
              Vous pourrez gérer vos clients depuis Ventes → Clients après connexion.
            </p>
          }
          <label>{{ 'chantiers.create.fields.marcheRef' | translate }}</label>
          <input type="text" [(ngModel)]="draft.marcheReference" name="mref" class="fld" />
          <label>{{ 'chantiers.create.fields.marcheType' | translate }}</label>
          <select [(ngModel)]="draft.marcheType" name="mtyp" class="fld">
            <option value="prive">{{ 'chantiers.create.fields.marcheTypePrive' | translate }}</option>
            <option value="public_ccag">{{ 'chantiers.create.fields.marcheTypePublic' | translate }}</option>
          </select>
          <label>{{ 'chantiers.create.fields.moa' | translate }}</label>
          <input type="text" [(ngModel)]="draft.moa" name="moa" class="fld" />
          <label>{{ 'chantiers.create.fields.moe' | translate }}</label>
          <input type="text" [(ngModel)]="draft.moe" name="moe" class="fld" />
          <label>{{ 'chantiers.create.fields.bet' | translate }}</label>
          <input type="text" [(ngModel)]="draft.bet" name="bet" class="fld" />
        </section>
      }

      <!-- Étape 3 : localisation -->
      @if (step() === 2) {
        <section class="panel">
          <label>{{ 'chantiers.create.fields.adresse' | translate }}</label>
          <input type="text" [(ngModel)]="draft.adresse" name="adr" class="fld" />
          <label for="cc-ville">{{ 'chantiers.create.fields.ville' | translate }}</label>
          <input id="cc-ville" type="text" [(ngModel)]="draft.ville" name="ville" class="fld" />
          <div class="row2">
            <div>
              <label>{{ 'chantiers.create.fields.lat' | translate }}</label>
              <input type="number" [(ngModel)]="draft.latitude" name="lat" class="fld" step="0.0001" />
            </div>
            <div>
              <label>{{ 'chantiers.create.fields.lng' | translate }}</label>
              <input type="number" [(ngModel)]="draft.longitude" name="lng" class="fld" step="0.0001" />
            </div>
          </div>
          <label for="cc-ddeb">{{ 'chantiers.create.fields.dateDebut' | translate }}</label>
          <input id="cc-ddeb" type="date" [(ngModel)]="draft.dateDebut" name="ddeb" class="fld" />
          <label for="cc-dfin">{{ 'chantiers.create.fields.dateFin' | translate }}</label>
          <input id="cc-dfin" type="date" [(ngModel)]="draft.dateFinPrevue" name="dfin" class="fld" />
        </section>
      }

      <!-- Étape 4 : financier -->
      @if (step() === 3) {
        <section class="panel">
          <label>{{ 'chantiers.create.fields.budgetHt' | translate }}</label>
          <input type="number" [(ngModel)]="draft.budgetHt" name="bud" class="fld" min="1" step="1000" />
          <label>{{ 'chantiers.create.fields.tva' | translate }}</label>
          <input type="number" [(ngModel)]="draft.tvaTaux" name="tva" class="fld" min="0" max="30" step="1" />
          <label>{{ 'chantiers.create.fields.rg' | translate }}</label>
          <input type="number" [(ngModel)]="draft.retenueGarantiePercent" name="rg" class="fld" min="0" max="15" step="0.5" />
          <label class="chk">
            <input type="checkbox" [(ngModel)]="draft.retenueSourceActive" name="ras" />
            {{ 'chantiers.create.fields.ras' | translate }}
          </label>
          <label>{{ 'chantiers.create.fields.avance' | translate }}</label>
          <input type="number" [(ngModel)]="draft.avancePercent" name="avc" class="fld" min="0" max="30" step="0.5" />
        </section>
      }

      <!-- Étape 5 : équipe -->
      @if (step() === 4) {
        <section class="panel">
          <label for="cc-chef">{{ 'chantiers.create.fields.chef' | translate }}</label>
          <input id="cc-chef" type="text" [(ngModel)]="draft.chefChantierName" name="chef" class="fld" list="emps" />
          <label for="cc-cond">{{ 'chantiers.create.fields.conducteur' | translate }}</label>
          <input id="cc-cond" type="text" [(ngModel)]="draft.conducteurTravauxName" name="cond" class="fld" list="emps" />
          <datalist id="emps">
            @for (e of employees(); track e.id) {
              <option [value]="e.name">{{ e.matricule }}</option>
            }
          </datalist>
          <label>{{ 'chantiers.create.fields.ingenieur' | translate }}</label>
          <input type="text" [(ngModel)]="draft.ingenieurName" name="ing" class="fld" list="emps" />
          <label class="chk"><input type="checkbox" [(ngModel)]="draft.cautionsSoumission" name="c1" />{{ 'chantiers.create.fields.cautionSoumission' | translate }}</label>
          <label class="chk"><input type="checkbox" [(ngModel)]="draft.cautionsBonneFin" name="c2" />{{ 'chantiers.create.fields.cautionBonneFin' | translate }}</label>
          <label class="chk"><input type="checkbox" [(ngModel)]="draft.cautionsRestitutionAvance" name="c3" />{{ 'chantiers.create.fields.cautionRestitution' | translate }}</label>
        </section>
      }

      <div class="nav-actions">
        @if (step() > 0) {
          <nf-button variant="secondary" (clicked)="prev()">{{ 'chantiers.create.prev' | translate }}</nf-button>
        }
        @if (step() < 4) {
          <nf-button variant="primary" (clicked)="next()">{{ 'chantiers.create.next' | translate }}</nf-button>
        }
        @if (step() === 4) {
          <nf-button variant="secondary" (clicked)="saveDraft()">{{ 'chantiers.create.draft' | translate }}</nf-button>
          <nf-button variant="primary" (clicked)="submit()" data-testid="chantier-create-submit">{{ 'chantiers.create.submit' | translate }}</nf-button>
        }
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .step-meta { font-size: 0.85rem; color: var(--nf-color-text-secondary); margin: 0 0 0.5rem; }
    .progress { display: flex; gap: 4px; margin-bottom: 0.75rem; }
    .progress__seg { flex: 1; height: 6px; background: var(--nf-color-border); border-radius: 3px; }
    .progress__seg--done { background: var(--nf-color-primary-500); }
    .code-hint { font-size: 0.82rem; color: var(--nf-color-text-secondary); margin: 0 0 1rem; }
    .panel { display: flex; flex-direction: column; gap: 0.35rem; max-width: 520px; margin-bottom: 1.25rem; }
    label { font-size: 0.78rem; font-weight: 600; color: var(--nf-color-text-secondary); margin-top: 0.35rem; }
    .fld { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 0.9rem; }
    .client-select { display: block; }
    .client-create { align-self: flex-start; margin-top: -0.15rem; }
    .onboarding-hint { font-size: 0.8rem; color: var(--nf-color-text-secondary); margin: 0.25rem 0 0; line-height: 1.4; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .chk { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; margin-top: 0.5rem; }
    .err { color: var(--nf-color-danger-700); font-size: 0.88rem; margin: 0 0 0.75rem; }
    .nav-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; padding-top: 0.5rem; border-top: 1px solid var(--nf-color-bg-muted); }
  `],
})
export class ChantierCreatePage {
  readonly onboardingMode = input(false);
  readonly created = output<{ name: string; id: string }>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly erpLookup = inject(ErpLookupService);
  private readonly chantierApi = inject(ChantierApiService);
  private readonly devisApi = inject(DevisApiService);
  private readonly clientApi = inject(ClientApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthFacade);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly step = signal(0);
  readonly validationMessage = signal<string | null>(null);

  private readonly _clients = signal<CreateClientOption[]>([]);
  private readonly _employees = signal<CreateEmployeeOption[]>([]);
  private readonly _chantiers = signal<Chantier[]>([]);

  readonly clients = this._clients.asReadonly();
  readonly employees = this._employees.asReadonly();

  readonly clientOptions = computed<NfSelectOption[]>(() => {
    const opts = this._clients().map((c) => ({
      value: c.id,
      label: `${c.code} — ${c.name}`,
    }));
    const selectedId = this.draft.clientId;
    const selectedName = this.draft.clientName?.trim();
    if (
      selectedId &&
      selectedName &&
      !opts.some((o) => o.value === selectedId)
    ) {
      return [{ value: selectedId, label: selectedName }, ...opts];
    }
    return opts;
  });

  hasClientListShortcut(): boolean {
    return this.auth.hasLookupCreateAccess();
  }

  readonly draft = {
    name: '',
    description: '',
    status: 'EN_COURS' as ChantierStatus,
    clientId: '',
    clientName: '',
    marcheReference: '',
    marcheType: 'prive' as 'prive' | 'public_ccag',
    moa: '',
    moe: '',
    bet: '',
    adresse: '',
    ville: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    dateDebut: new Date().toISOString().slice(0, 10),
    dateFinPrevue: addMonthsIso(new Date(), 6),
    budgetHt: 1_000_000,
    tvaTaux: 20,
    retenueGarantiePercent: 7,
    retenueSourceActive: false,
    avancePercent: 10,
    chefChantierName: '',
    conducteurTravauxName: '',
    ingenieurName: '',
    cautionsSoumission: true,
    cautionsBonneFin: true,
    cautionsRestitutionAvance: false,
  };

  readonly statusOptions: { v: ChantierStatus; labelKey: string }[] = [
    { v: 'PROSPECT', labelKey: 'chantiers.status.prospect' },
    { v: 'EN_COURS', labelKey: 'chantiers.status.enCours' },
    { v: 'SUSPENDU', labelKey: 'chantiers.status.suspendu' },
  ];

  readonly nextCodePreview = computed(() => {
    const year = new Date().getFullYear();
    let max = 0;
    const rx = new RegExp(`^CH-${year}-(\\d+)$`, 'i');
    for (const c of this._chantiers()) {
      const m = rx.exec(c.code);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `CH-${year}-${String(max + 1).padStart(3, '0')}`;
  });

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('chantiers.create.title'),
    subtitle: this.translate.instant('chantiers.create.subtitle'),
    icon: 'add_circle',
    breadcrumbs: [
      { label: this.translate.instant('nav.chantiers'), route: '/chantiers' },
      { label: this.translate.instant('chantiers.create.title') },
    ],
  }));

  constructor() {
    void this.loadLookups();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    void this.reloadClients();
  }

  private async loadLookups(): Promise<void> {
    const [clients, employees, chantiersRes] = await Promise.all([
      this.erpLookup.partnersByRole('CLIENT'),
      this.erpLookup.employes('ACTIF'),
      this.chantierApi.getAll(),
    ]);
    this.setClients(clients);
    this._employees.set(
      employees.map((e) => ({
        id: String(e.key),
        matricule: String((e.data as Record<string, unknown> | undefined)?.['matricule'] ?? ''),
        name: e.value,
      })),
    );
    this._chantiers.set(chantiersRes.items);
    await this.applyDevisPrefill();
  }

  private async applyDevisPrefill(): Promise<void> {
    const devisId = this.route.snapshot.queryParamMap.get('devisId');
    if (!devisId) return;

    try {
      const devis = await this.devisApi.getById(devisId);
      if (devis.objet) this.draft.name = devis.objet;
      if (devis.ville) this.draft.ville = devis.ville;
      if (devis.totalHt != null) this.draft.budgetHt = Number(devis.totalHt);
      if (devis.tvaTaux != null) this.draft.tvaTaux = Number(devis.tvaTaux);
      if (devis.clientId) {
        const raw = devis.clientId.trim();
        const nameHint = (devis.clientName ?? '').trim().toLowerCase();
        const client =
          this._clients().find((c) => c.id === raw) ??
          this._clients().find((c) => c.code.toUpperCase() === raw.toUpperCase()) ??
          (nameHint
            ? this._clients().find(
                (c) =>
                  c.name.toLowerCase().includes(nameHint) ||
                  nameHint.includes(c.name.toLowerCase().slice(0, 8)),
              )
            : undefined);
        this.draft.clientId = client?.id ?? raw;
        this.draft.clientName = client?.name ?? devis.clientName ?? '';
        if (client) this.onClientChange(client.id);
      }
      if (devis.numero) {
        this.draft.marcheReference = `${devis.numero} V${devis.version ?? 1}`;
      }
      this.cdr.markForCheck();
    } catch {
      // Devis lookup optional — wizard still usable without prefill
    }
  }

  private async reloadClients(): Promise<void> {
    const clients = await this.erpLookup.partnersByRole('CLIENT');
    this.setClients(clients);
  }

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

  onClientChange(id: string): void {
    const c = this._clients().find((x) => x.id === id);
    this.draft.clientName = c?.name ?? '';
  }

  async createClientInline(): Promise<void> {
    const t = (k: string) => this.translate.instant(k);
    const values = await this.confirmDialog.prompt({
      title: t('chantiers.create.clientCreateTitle'),
      fields: [
        {
          key: 'nom',
          label: t('chantiers.create.clientCreateNom'),
          required: true,
          placeholder: t('chantiers.create.clientCreateNom'),
        },
      ],
      confirmLabel: t('chantiers.common.actions.save'),
      cancelLabel: t('chantiers.common.actions.cancel'),
    });
    if (!values?.['nom']?.trim()) {
      return;
    }
    try {
      const created = await this.clientApi.create({
        nom: values['nom'].trim(),
        type: 'SARL',
        ville: '',
        actif: true,
      });
      await this.reloadClients();
      this.draft.clientId = created.id;
      this.draft.clientName = created.nom;
      this.toast.success(t('chantiers.create.clientCreateSuccess'));
    } catch {
      this.toast.error(t('chantiers.create.clientCreateFailed'));
    }
  }

  prev(): void {
    this.validationMessage.set(null);
    this.step.update((s) => Math.max(0, s - 1));
  }

  next(): void {
    if (!this.validateStep(this.step())) {
      return;
    }
    this.validationMessage.set(null);
    this.step.update((s) => Math.min(4, s + 1));
  }

  saveDraft(): void {
    if (!this.validateAll()) {
      return;
    }
    this.draft.status = 'PROSPECT';
    this.persistCreate();
  }

  submit(): void {
    if (!this.validateAll()) {
      return;
    }
    this.persistCreate();
  }

  private validateAll(): boolean {
    for (let i = 0; i <= 4; i++) {
      if (!this.validateStep(i)) {
        this.step.set(i);
        return false;
      }
    }
    return true;
  }

  private validateStep(s: number): boolean {
    const t = (k: string) => this.translate.instant(k);
    if (s === 0) {
      if (!this.draft.name.trim()) {
        this.validationMessage.set(t('chantiers.create.validation.name'));
        return false;
      }
    }
    if (s === 1) {
      if (!this.onboardingMode() && !this.draft.clientId) {
        this.validationMessage.set(t('chantiers.create.validation.client'));
        return false;
      }
    }
    if (s === 2) {
      if (!this.draft.ville.trim() || !this.draft.dateDebut || !this.draft.dateFinPrevue) {
        this.validationMessage.set(t('chantiers.create.validation.dates'));
        return false;
      }
    }
    if (s === 3) {
      if (!this.draft.budgetHt || this.draft.budgetHt <= 0) {
        this.validationMessage.set(t('chantiers.create.validation.budget'));
        return false;
      }
    }
    if (s === 4 && !this.onboardingMode()) {
      if (!this.draft.chefChantierName.trim() || !this.draft.conducteurTravauxName.trim()) {
        this.validationMessage.set(t('chantiers.create.validation.team'));
        return false;
      }
    }
    return true;
  }

  private persistCreate(): void {
    void this.chantierApi
      .create({
        name: this.draft.name,
        description: this.draft.description || undefined,
        status: this.onboardingMode() ? 'EN_COURS' : this.draft.status,
        clientId: this.draft.clientId || undefined,
        clientName: this.draft.clientName || (this.onboardingMode() ? 'Client à renseigner' : ''),
        marcheReference: this.draft.marcheReference || undefined,
        adresse: this.draft.adresse || undefined,
        ville: this.draft.ville,
        latitude: this.draft.latitude,
        longitude: this.draft.longitude,
        dateDebut: this.draft.dateDebut,
        dateFinPrevue: this.draft.dateFinPrevue,
        budgetHt: this.draft.budgetHt,
        tvaTaux: this.draft.tvaTaux,
        cautionGarantie: this.draft.retenueGarantiePercent,
        avancePercue: this.draft.avancePercent,
        chefChantierName: this.draft.chefChantierName,
        conducteurTravauxName: this.draft.conducteurTravauxName,
        type: 'BATIMENT',
      })
      .then((created) => {
        this.audit.log('CREATE', 'chantier', created.id, created.code, created.name);
        if (this.onboardingMode()) {
          this.created.emit({ name: created.name, id: created.id });
          return;
        }
        this.toast.success(
          this.translate.instant('chantiers.create.createSuccess', { code: created.code, name: created.name }),
        );
        void this.router.navigate(['/chantiers', created.id]);
      })
      .catch(() => {
        this.toast.error(this.translate.instant('chantiers.create.createFailed'));
      });
  }
}
