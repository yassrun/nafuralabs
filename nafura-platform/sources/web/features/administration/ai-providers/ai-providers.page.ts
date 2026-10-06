import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  NfSelectComponent,
  NfSwitchComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
} from '@lib/anatomy';
import { PermissionService } from '@core/security/services/permission.service';

import {
  AiProvidersApiService,
  type AiProviderCard,
  type AiProvidersState,
  type TestResponse,
} from './ai-providers-api.service';

@Component({
  selector: 'app-ai-providers-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonComponent,
    NfSelectComponent,
    NfSwitchComponent,
    PageShellComponent,
    PageHeaderComponent,
  ],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (error()) {
        <p class="ai-prov__error" role="alert">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="ai-prov__hint">{{ 'administration.aiProviders.loading' | translate }}</p>
      }

      @if (!loading() && state(); as s) {
        <p class="ai-prov__hint">{{ 'administration.aiProviders.hint' | translate }}</p>

        <!-- Runtime -->
        <section class="ai-prov__section">
          <h2 class="ai-prov__section-title">{{ 'administration.aiProviders.runtime' | translate }}</h2>
          <div class="ai-prov__list">
            @for (p of s.providers; track p.id) {
              <article
                class="ai-prov__card"
                [class.ai-prov__card--active]="draftProvider() === p.id"
                [class.ai-prov__card--disabled]="!p.keyConfigured"
              >
                <header class="ai-prov__card-head">
                  <label class="ai-prov__radio">
                    <input
                      type="radio"
                      name="aiProvider"
                      [value]="p.id"
                      [checked]="draftProvider() === p.id"
                      [disabled]="!p.keyConfigured || saving() || !canConfigure()"
                      (change)="selectProvider(p)"
                    />
                    <span class="ai-prov__name">{{ p.displayName }}</span>
                  </label>
                  <span class="ai-prov__badges">
                    @if (draftProvider() === p.id) {
                      <span class="ai-prov__badge ai-prov__badge--active">
                        {{ 'administration.aiProviders.active' | translate }}
                      </span>
                    }
                    <span
                      class="ai-prov__badge"
                      [class.ai-prov__badge--ok]="p.keyConfigured"
                      [class.ai-prov__badge--warn]="!p.keyConfigured"
                    >
                      {{
                        (p.keyConfigured
                          ? 'administration.aiProviders.keyOk'
                          : 'administration.aiProviders.keyMissing'
                        ) | translate
                      }}
                    </span>
                  </span>
                </header>

                @if (draftProvider() === p.id && p.keyConfigured) {
                  @if (p.models.length > 0) {
                    <nf-select
                      class="ai-prov__model"
                      [label]="'administration.aiProviders.model' | translate"
                      [options]="p.models.map(modelOption)"
                      [ngModel]="draftModel()"
                      (ngModelChange)="draftModel.set($event)"
                      [disabled]="saving() || !canConfigure()"
                    />
                  } @else {
                    <input
                      class="ai-prov__input"
                      type="text"
                      [placeholder]="'administration.aiProviders.deploymentPlaceholder' | translate"
                      [ngModel]="draftModel()"
                      (ngModelChange)="draftModel.set($event)"
                      [disabled]="saving() || !canConfigure()"
                    />
                  }
                }
              </article>
            }
          </div>

          @if (canConfigure()) {
            <div class="ai-prov__actions">
              <nf-button variant="primary" [disabled]="!canSave() || saving()" (click)="save()">
                {{ 'administration.aiProviders.save' | translate }}
              </nf-button>
            </div>
          }
        </section>

        <!-- Identifiants (BYOK) -->
        <section class="ai-prov__section">
          <h2 class="ai-prov__section-title">{{ 'administration.aiProviders.credentials' | translate }}</h2>
          @if (!s.limits.byokAvailable) {
            <p class="ai-prov__hint">{{ 'administration.aiProviders.byokUnavailable' | translate }}</p>
          }
          <div class="ai-prov__list">
            @for (p of s.providers; track p.id) {
              <article class="ai-prov__card">
                <header class="ai-prov__card-head">
                  <span class="ai-prov__name">{{ p.displayName }}</span>
                  @if (p.byok && p.keyHint) {
                    <span class="ai-prov__badge ai-prov__badge--ok">
                      {{ 'administration.aiProviders.byokKey' | translate }} ••••{{ p.keyHint }}
                    </span>
                  } @else if (p.keyConfigured) {
                    <span class="ai-prov__badge ai-prov__badge--ok">
                      {{ 'administration.aiProviders.platformKey' | translate }}
                    </span>
                  }
                </header>

                @if (canConfigure()) {
                  <div class="ai-prov__credential">
                    <input
                      class="ai-prov__input"
                      type="password"
                      autocomplete="off"
                      [placeholder]="'administration.aiProviders.secretPlaceholder' | translate"
                      [ngModel]="secrets[p.id] || ''"
                      (ngModelChange)="secrets[p.id] = $event"
                      [disabled]="!s.limits.byokAvailable || saving()"
                    />
                    <div class="ai-prov__credential-actions">
                      <nf-button
                        variant="primary"
                        [disabled]="!s.limits.byokAvailable || !secrets[p.id] || saving()"
                        (click)="saveCredential(p)"
                      >
                        {{ 'administration.aiProviders.saveCredential' | translate }}
                      </nf-button>
                      <nf-button
                        variant="secondary"
                        [disabled]="!s.limits.byokAvailable || !p.byok || saving()"
                        (click)="revokeCredential(p)"
                      >
                        {{ 'administration.aiProviders.revoke' | translate }}
                      </nf-button>
                      <nf-button
                        variant="secondary"
                        [disabled]="!p.keyConfigured || testing()"
                        (click)="test(p)"
                      >
                        {{ 'administration.aiProviders.test' | translate }}
                      </nf-button>
                    </div>
                  </div>
                }
              </article>
            }
          </div>

          @if (testResult()) {
            <p
              class="ai-prov__test-result"
              [class.ai-prov__test-result--ok]="testResult()!.ok"
            >
              {{ testResult()!.message }}
            </p>
          }
        </section>

        <!-- Limites & confidentialité -->
        <section class="ai-prov__section">
          <h2 class="ai-prov__section-title">{{ 'administration.aiProviders.limits' | translate }}</h2>
          <div class="ai-prov__limits">
            <nf-switch
              [checked]="draftEnabled()"
              [disabled]="saving() || !canConfigure()"
              [label]="'administration.aiProviders.enabled' | translate"
              (changed)="draftEnabled.set($event)"
            />
            <label class="ai-prov__field">
              <span class="ai-prov__field-label">{{ 'administration.aiProviders.monthlyBudget' | translate }}</span>
              <input
                class="ai-prov__input"
                type="text"
                inputmode="decimal"
                [placeholder]="'administration.aiProviders.unlimited' | translate"
                [ngModel]="draftBudget()"
                (ngModelChange)="draftBudget.set($event)"
                [disabled]="saving() || !canConfigure()"
              />
            </label>
            <nf-switch
              [checked]="draftRetain()"
              [disabled]="saving() || !canConfigure()"
              [label]="'administration.aiProviders.retainPayloads' | translate"
              (changed)="draftRetain.set($event)"
            />
            @if (draftRetain()) {
              <p class="ai-prov__warn">{{ 'administration.aiProviders.retainPayloadsHint' | translate }}</p>
            }
            @if (canConfigure()) {
              <div class="ai-prov__actions">
                <nf-button variant="primary" [disabled]="saving()" (click)="saveLimits()">
                  {{ 'administration.aiProviders.saveLimits' | translate }}
                </nf-button>
              </div>
            }
          </div>
        </section>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .ai-prov__hint { margin: 0 0 16px; color: var(--nf-color-text-secondary); font-size: 13px; }
      .ai-prov__error { color: var(--nf-color-danger-600, #b42318); margin-bottom: 12px; }
      .ai-prov__warn { color: var(--nf-color-warning-700, #b54708); font-size: 13px; margin: 8px 0 0; }
      .ai-prov__section { margin-top: 24px; }
      .ai-prov__section-title { font-size: 15px; font-weight: 600; margin: 0 0 12px; }
      .ai-prov__list { display: flex; flex-direction: column; gap: 12px; max-width: 680px; }
      .ai-prov__card { border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 14px 16px; background: var(--nf-color-surface); }
      .ai-prov__card--active { border-color: var(--nf-color-primary-500); }
      .ai-prov__card--disabled { opacity: 0.72; }
      .ai-prov__card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .ai-prov__radio { display: flex; align-items: center; gap: 10px; cursor: pointer; }
      .ai-prov__name { font-weight: 600; font-size: 15px; }
      .ai-prov__badges { display: flex; gap: 6px; flex-wrap: wrap; }
      .ai-prov__badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: var(--nf-color-bg-muted); }
      .ai-prov__badge--active { background: var(--nf-color-primary-100, #e8f0fe); color: var(--nf-color-primary-700, #1a56db); }
      .ai-prov__badge--ok { color: var(--nf-color-success-700, #027a48); }
      .ai-prov__badge--warn { color: var(--nf-color-warning-700, #b54708); }
      .ai-prov__model { width: 100%; margin-top: 12px; }
      .ai-prov__input { width: 100%; max-width: 420px; padding: 9px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 14px; margin-top: 8px; }
      .ai-prov__credential { margin-top: 12px; }
      .ai-prov__credential-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
      .ai-prov__limits { display: flex; flex-direction: column; gap: 14px; max-width: 480px; }
      .ai-prov__field { display: flex; flex-direction: column; }
      .ai-prov__field-label { font-size: 13px; color: var(--nf-color-text-secondary); }
      .ai-prov__actions { margin-top: 20px; }
      .ai-prov__test-result { margin-top: 12px; font-size: 13px; color: var(--nf-color-danger-600, #b42318); }
      .ai-prov__test-result--ok { color: var(--nf-color-success-700, #027a48); }
    `,
  ],
})
export class AiProvidersPage implements OnInit {
  private readonly api = inject(AiProvidersApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);
  private readonly permissions = inject(PermissionService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly error = signal<string | null>(null);
  readonly state = signal<AiProvidersState | null>(null);
  readonly draftProvider = signal('gemini');
  readonly draftModel = signal('gemini-2.5-flash');
  readonly draftEnabled = signal(true);
  readonly draftBudget = signal<string | null>(null);
  readonly draftRetain = signal(false);
  readonly testResult = signal<TestResponse | null>(null);
  readonly secrets: Record<string, string> = {};

  readonly canConfigure = computed(() =>
    this.permissions.hasPermission('administration.ai.configure')
  );

  readonly modelOption = (model: string) => ({ value: model, label: model });

  readonly headerConfig = computed(() => ({
    title: this.i18n.instant('administration.aiProviders.title'),
    subtitle: this.i18n.instant('administration.aiProviders.subtitle'),
  }));

  readonly canSave = computed(() => {
    const s = this.state();
    if (!s) return false;
    const provider = this.draftProvider();
    const card = s.providers.find((p) => p.id === provider);
    if (!card?.keyConfigured) return false;
    return provider !== s.activeProvider || this.draftModel() !== s.activeModel;
  });

  ngOnInit(): void {
    void this.load();
  }

  selectProvider(card: AiProviderCard): void {
    if (!card.keyConfigured) return;
    this.draftProvider.set(card.id);
    const current = this.draftModel();
    if (card.models.length > 0 && !card.models.includes(current)) {
      this.draftModel.set(card.models[0] ?? current);
    }
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const state = await this.api.getState();
      this.state.set(state);
      this.draftProvider.set(state.activeProvider);
      this.draftModel.set(state.activeModel);
      this.draftEnabled.set(state.limits.enabled);
      this.draftBudget.set(state.limits.monthlyBudgetUsd);
      this.draftRetain.set(state.limits.retainPayloads);
    } catch (e) {
      this.error.set(this.messageOf(e));
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const state = await this.api.update({
        provider: this.draftProvider(),
        model: this.draftModel(),
      });
      this.state.set(state);
      this.draftProvider.set(state.activeProvider);
      this.draftModel.set(state.activeModel);
      this.toast.success(this.i18n.instant('administration.aiProviders.saved'));
    } catch (e) {
      this.error.set(this.messageOf(e));
    } finally {
      this.saving.set(false);
    }
  }

  async saveCredential(card: AiProviderCard): Promise<void> {
    const secret = this.secrets[card.id];
    if (!secret) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.api.putCredential(card.id, secret);
      this.secrets[card.id] = '';
      await this.load();
      this.toast.success(this.i18n.instant('administration.aiProviders.credentialSaved'));
    } catch (e) {
      this.error.set(this.messageOf(e));
    } finally {
      this.saving.set(false);
    }
  }

  async revokeCredential(card: AiProviderCard): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.api.revokeCredential(card.id);
      await this.load();
      this.toast.success(this.i18n.instant('administration.aiProviders.revoked'));
    } catch (e) {
      this.error.set(this.messageOf(e));
    } finally {
      this.saving.set(false);
    }
  }

  async test(card: AiProviderCard): Promise<void> {
    this.testing.set(true);
    this.testResult.set(null);
    this.error.set(null);
    try {
      const model = card.id === this.draftProvider() ? this.draftModel() : (card.models[0] ?? '');
      const result = await this.api.test(card.id, model);
      this.testResult.set(result);
    } catch (e) {
      this.testResult.set({ ok: false, provider: card.id, model: '', message: this.messageOf(e) });
    } finally {
      this.testing.set(false);
    }
  }

  async saveLimits(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const limits = await this.api.updateLimits({
        enabled: this.draftEnabled(),
        monthlyBudgetUsd: this.draftBudget(),
        retainPayloads: this.draftRetain(),
      });
      const state = await this.api.getState();
      this.state.set(state);
      this.draftEnabled.set(limits.enabled);
      this.draftBudget.set(limits.monthlyBudgetUsd);
      this.draftRetain.set(limits.retainPayloads);
      this.toast.success(this.i18n.instant('administration.aiProviders.limitsSaved'));
    } catch (e) {
      this.error.set(this.messageOf(e));
    } finally {
      this.saving.set(false);
    }
  }

  private messageOf(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const body = (error as { error?: { message?: string } }).error;
      if (body?.message) return body.message;
    }
    return this.i18n.instant('administration.aiProviders.error');
  }
}
