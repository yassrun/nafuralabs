import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenSettingsPageStyles,
  PageHeaderComponent,
  PageShellComponent,
  TabsComponent,
  ToastService,
  type TabItem,
} from '@lib/anatomy';
import { IceInputComponent } from '@lib/anatomy/components/atoms/ice-input/ice-input.component';
import { RibInputComponent } from '@lib/anatomy/components/atoms/rib-input/rib-input.component';
import { PhoneMaInputComponent } from '@lib/anatomy/components/atoms/phone-ma-input/phone-ma-input.component';
import {
  SmartImportActionComponent,
  applyModeleJRow,
  MODELE_J_IMPORT_DEFINITION,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';

import { OrganizationIdentityApiService } from './models/organization-identity-api.service';
import {
  EMPTY_ORGANIZATION_IDENTITY,
  FORME_JURIDIQUE_OPTIONS,
  isOrganizationIdentityEmpty,
  type OrganizationIdentity,
} from './models/organization-identity.model';

type IdentityTab = 'identite' | 'identifiants' | 'banque' | 'documents';

@Component({
  selector: 'nf-organization-identity-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    TabsComponent,
    ButtonComponent,
    IceInputComponent,
    RibInputComponent,
    PhoneMaInputComponent,
    SmartImportActionComponent,
  ],
  template: `
    @if (embedded()) {
      <div class="embed">
        <div class="embed__toolbar">
          <nf-smart-import-action
            [definition]="modeleJDefinition"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            (completed)="onModeleJImported($event)" />
        </div>
        <ng-container *ngTemplateOutlet="bodyTpl" />
      </div>
    } @else {
      <nf-page-shell scroll>
        <nf-page-header [config]="headerConfig">
          <div actions>
            <nf-smart-import-action
              [definition]="modeleJDefinition"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              (completed)="onModeleJImported($event)" />
          </div>
        </nf-page-header>
        <ng-container *ngTemplateOutlet="bodyTpl" />
      </nf-page-shell>
    }

    <ng-template #bodyTpl>
      @if (loading()) {
        <p class="state">{{ 'organizationIdentity.loading' | translate }}</p>
      } @else if (error()) {
        <div class="state state--error" role="alert">
          <p>{{ error() }}</p>
          <nf-button variant="secondary" (clicked)="reload()">
            {{ 'organizationIdentity.retry' | translate }}
          </nf-button>
        </div>
      } @else if (showWizard()) {
        <section class="wizard">
          <h2>{{ 'organizationIdentity.wizard.title' | translate }}</h2>
          <p class="hint">{{ 'organizationIdentity.wizard.hint' | translate }}</p>
          <div class="wizard__grid">
            <article class="wizard__card">
              <h3>{{ 'organizationIdentity.wizard.scanTitle' | translate }}</h3>
              <p>{{ 'organizationIdentity.wizard.scanHint' | translate }}</p>
              <nf-smart-import-action
                [definition]="modeleJDefinition"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                (completed)="onModeleJImported($event)" />
            </article>
            <article class="wizard__card">
              <h3>{{ 'organizationIdentity.wizard.manualTitle' | translate }}</h3>
              <p>{{ 'organizationIdentity.wizard.manualHint' | translate }}</p>
              <nf-button variant="secondary" (clicked)="skipWizard()">
                {{ 'organizationIdentity.wizard.manualCta' | translate }}
              </nf-button>
            </article>
          </div>
        </section>
      } @else {
        <nf-tabs
          [tabs]="tabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)">
        </nf-tabs>

        <div class="nf-settings-content">
          @switch (activeTab()) {
            @case ('identite') {
              <section class="section">
                <div class="fields-grid">
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.raisonSociale' | translate }}</span>
                    <input [(ngModel)]="draft.raisonSociale" name="raisonSociale" required maxlength="200" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.formeJuridique' | translate }}</span>
                    <select [(ngModel)]="draft.formeJuridique" name="formeJuridique">
                      @for (opt of formes; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.capital' | translate }}</span>
                    <input [(ngModel)]="draft.capital" name="capital" maxlength="64" />
                  </label>
                  <label class="field field--wide">
                    <span>{{ 'organizationIdentity.fields.adresse' | translate }}</span>
                    <input [(ngModel)]="draft.adresse" name="adresse" maxlength="400" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.ville' | translate }}</span>
                    <input [(ngModel)]="draft.ville" name="ville" maxlength="120" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.telephone' | translate }}</span>
                    <nf-phone-ma-input [(ngModel)]="draft.telephone" name="telephone" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.email' | translate }}</span>
                    <input type="email" [(ngModel)]="draft.email" name="email" maxlength="200" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.siteWeb' | translate }}</span>
                    <input [(ngModel)]="draft.siteWeb" name="siteWeb" maxlength="200" />
                  </label>
                </div>
              </section>
            }
            @case ('identifiants') {
              <section class="section">
                <div class="fields-grid">
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.ice' | translate }}</span>
                    <nf-ice-input [(ngModel)]="draft.ice" name="ice" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.identifiantFiscal' | translate }}</span>
                    <input [(ngModel)]="draft.identifiantFiscal" name="identifiantFiscal" maxlength="32" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.rc' | translate }}</span>
                    <input [(ngModel)]="draft.rc" name="rc" maxlength="64" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.patente' | translate }}</span>
                    <input [(ngModel)]="draft.patente" name="patente" maxlength="64" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.cnss' | translate }}</span>
                    <input [(ngModel)]="draft.cnss" name="cnss" maxlength="32" />
                  </label>
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.tvaIntra' | translate }}</span>
                    <input [(ngModel)]="draft.tvaIntra" name="tvaIntra" maxlength="64" />
                  </label>
                </div>
              </section>
            }
            @case ('banque') {
              <section class="section">
                <div class="fields-grid">
                  <label class="field">
                    <span>{{ 'organizationIdentity.fields.banque' | translate }}</span>
                    <input [(ngModel)]="draft.banque" name="banque" maxlength="120" />
                  </label>
                  <label class="field field--wide">
                    <span>{{ 'organizationIdentity.fields.rib' | translate }}</span>
                    <nf-rib-input [(ngModel)]="draft.rib" name="rib" />
                  </label>
                </div>
              </section>
            }
            @case ('documents') {
              <section class="section">
                <p class="hint">{{ 'organizationIdentity.documents.hint' | translate }}</p>
                <div class="links">
                  <a routerLink="/organization/settings" [queryParams]="{ section: 'branding' }">
                    {{ 'organizationIdentity.documents.logoLink' | translate }}
                  </a>
                  <a routerLink="/administration/documents/templates">
                    {{ 'organizationIdentity.documents.templatesLink' | translate }}
                  </a>
                </div>
                <nf-smart-import-action
                  [definition]="modeleJDefinition"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  (completed)="onModeleJImported($event)" />
              </section>
            }
          }

          @if (activeTab() !== 'documents') {
            <div class="form-actions">
              <nf-button variant="primary" [disabled]="saving()" (clicked)="save()">
                {{
                  (saving()
                    ? 'organizationIdentity.saving'
                    : 'organizationIdentity.save') | translate
                }}
              </nf-button>
            </div>
          }
        </div>
      }
    </ng-template>
  `,
  styles: [
    ConfigDrivenSettingsPageStyles,
    `
      :host { display: block; height: 100%; }
      .embed { display: grid; gap: 12px; }
      .embed__toolbar { display: flex; justify-content: flex-end; }
      .state { padding: 24px; color: var(--nf-text-muted, #64748b); }
      .state--error { color: var(--nf-danger, #b91c1c); display: grid; gap: 12px; }
      .wizard { padding: 8px 4px 24px; max-width: 880px; }
      .wizard h2 { margin: 0 0 8px; font-size: 1.25rem; }
      .wizard__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        margin-top: 16px;
      }
      .wizard__card {
        border: 1px solid var(--nf-border-default, #e2e8f0);
        border-radius: 12px;
        padding: 16px;
        background: #fff;
        display: grid;
        gap: 10px;
      }
      .wizard__card h3 { margin: 0; font-size: 0.95rem; }
      .wizard__card p { margin: 0; color: var(--nf-text-muted, #64748b); font-size: 0.875rem; }
      .section {
        background: #fff;
        border: 1px solid var(--nf-border-default, #e2e8f0);
        border-radius: 12px;
        padding: 16px 18px;
      }
      .hint { margin: 0 0 12px; color: var(--nf-text-muted, #64748b); font-size: 0.875rem; }
      .links { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
      .links a { font-size: 0.8125rem; font-weight: 600; }
      .fields-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 14px;
      }
      .field { display: flex; flex-direction: column; gap: 6px; font-size: 0.8125rem; font-weight: 600; }
      .field--wide { grid-column: 1 / -1; }
      .field input, .field select {
        font-weight: 400;
        padding: 8px 12px;
        border: 1px solid var(--nf-border-default, #e2e8f0);
        border-radius: 6px;
        font-size: 0.875rem;
      }
      .form-actions { margin-top: 16px; }
    `,
  ],
})
export class OrganizationIdentityPage {
  /** When true, skip page shell/header (e.g. Sektor Société documents tab). */
  readonly embedded = input(false);

  private readonly api = inject(OrganizationIdentityApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly modeleJDefinition = MODELE_J_IMPORT_DEFINITION;
  readonly formes = FORME_JURIDIQUE_OPTIONS;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly forceForm = signal(false);
  readonly identity = signal<OrganizationIdentity | null>(null);
  readonly activeTab = signal<IdentityTab>('identite');

  draft: OrganizationIdentity = { ...EMPTY_ORGANIZATION_IDENTITY };

  readonly showWizard = computed(
    () => !this.forceForm() && isOrganizationIdentityEmpty(this.identity()),
  );

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'identite', label: this.translate.instant('organizationIdentity.tabs.identite') },
    { id: 'identifiants', label: this.translate.instant('organizationIdentity.tabs.identifiants') },
    { id: 'banque', label: this.translate.instant('organizationIdentity.tabs.banque') },
    { id: 'documents', label: this.translate.instant('organizationIdentity.tabs.documents') },
  ]);

  readonly headerConfig = {
    title: this.translate.instant('organizationIdentity.title'),
    subtitle: this.translate.instant('organizationIdentity.subtitle'),
  };

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const data = await this.api.get();
      this.identity.set(data);
      this.draft = { ...EMPTY_ORGANIZATION_IDENTITY, ...data };
    } catch {
      this.error.set(this.translate.instant('organizationIdentity.loadError'));
    } finally {
      this.loading.set(false);
    }
  }

  skipWizard(): void {
    this.forceForm.set(true);
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId as IdentityTab);
  }

  onModeleJImported(result: ReviewedExtraction): void {
    const row = result.acceptedRows[0];
    if (!row) {
      this.toast.error(this.translate.instant('organizationIdentity.smartImport.empty'));
      return;
    }
    const patch = applyModeleJRow(row);
    this.draft = {
      ...this.draft,
      ...Object.fromEntries(
        Object.entries(patch).filter(([, value]) => value !== undefined),
      ),
    } as OrganizationIdentity;
    this.forceForm.set(true);
    this.activeTab.set('identite');
    this.toast.success(this.translate.instant('organizationIdentity.smartImport.applied'));
  }

  async save(): Promise<void> {
    if (!this.draft.raisonSociale?.trim()) {
      this.toast.error(this.translate.instant('organizationIdentity.validation.raisonSociale'));
      this.activeTab.set('identite');
      return;
    }
    this.saving.set(true);
    try {
      const saved = await this.api.save(this.draft);
      this.identity.set(saved);
      this.draft = { ...saved };
      this.toast.success(this.translate.instant('organizationIdentity.saveSuccess'));
    } catch {
      this.toast.error(this.translate.instant('organizationIdentity.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
