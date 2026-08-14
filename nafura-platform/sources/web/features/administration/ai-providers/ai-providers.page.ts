import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy';

import {
  AiProvidersApiService,
  type AiProviderCard,
  type AiProvidersState,
} from './ai-providers-api.service';

@Component({
  selector: 'app-ai-providers-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    MatFormFieldModule,
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
                    [disabled]="!p.keyConfigured || saving()"
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
                <mat-form-field appearance="outline" class="ai-prov__model">
                  <mat-label>{{ 'administration.aiProviders.model' | translate }}</mat-label>
                  <mat-select
                    [ngModel]="draftModel()"
                    (ngModelChange)="draftModel.set($event)"
                    [disabled]="saving()"
                  >
                    @for (m of p.models; track m) {
                      <mat-option [value]="m">{{ m }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }
            </article>
          }
        </div>

        <div class="ai-prov__actions">
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!canSave() || saving()"
            (click)="save()"
          >
            {{ 'administration.aiProviders.save' | translate }}
          </button>
        </div>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .ai-prov__hint {
        margin: 0 0 16px;
        color: var(--nf-color-text-secondary);
        font-size: 13px;
      }
      .ai-prov__error {
        color: var(--nf-color-danger-600, #b42318);
        margin-bottom: 12px;
      }
      .ai-prov__list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 640px;
      }
      .ai-prov__card {
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        padding: 14px 16px;
        background: var(--nf-color-surface);
      }
      .ai-prov__card--active {
        border-color: var(--nf-color-primary-500);
      }
      .ai-prov__card--disabled {
        opacity: 0.72;
      }
      .ai-prov__card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .ai-prov__radio {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
      }
      .ai-prov__name {
        font-weight: 600;
        font-size: 15px;
      }
      .ai-prov__badges {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .ai-prov__badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--nf-color-bg-muted);
      }
      .ai-prov__badge--active {
        background: var(--nf-color-primary-100, #e8f0fe);
        color: var(--nf-color-primary-700, #1a56db);
      }
      .ai-prov__badge--ok {
        color: var(--nf-color-success-700, #027a48);
      }
      .ai-prov__badge--warn {
        color: var(--nf-color-warning-700, #b54708);
      }
      .ai-prov__model {
        width: 100%;
        margin-top: 12px;
      }
      .ai-prov__actions {
        margin-top: 20px;
      }
    `,
  ],
})
export class AiProvidersPage implements OnInit {
  private readonly api = inject(AiProvidersApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly state = signal<AiProvidersState | null>(null);
  readonly draftProvider = signal('gemini');
  readonly draftModel = signal('gemini-2.5-flash');

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
    if (!card.models.includes(current)) {
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

  private messageOf(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const body = (error as { error?: { message?: string } }).error;
      if (body?.message) return body.message;
    }
    return this.i18n.instant('administration.aiProviders.error');
  }
}
