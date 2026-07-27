import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, ToastService } from '@lib/anatomy';
import {
  SmartImportTriggerComponent,
  type ExtractionDefinition,
  type ReviewedExtraction,
  type SmartImportError,
} from '@platform/features/documents/smart-import';
import {
  CLIENT_IMPORT_DEFINITION,
  ClientImportService,
} from '@app/shared/smart-import/handlers/client-import.handler';
import {
  FOURNISSEUR_IMPORT_DEFINITION,
  FournisseurImportService,
} from '@app/shared/smart-import/handlers/fournisseur-import.handler';
import {
  EMPLOYE_IMPORT_DEFINITION,
  EmployeImportService,
} from '@app/shared/smart-import/handlers/employe-import.handler';
import type { ApplicationImportResult } from '@app/shared/smart-import/services/application-import.util';

import { OnboardingApiService } from '../../services/onboarding-api.service';

export type RepriseStepKey = 'clients' | 'fournisseurs' | 'employes';

interface RepriseStepConfig {
  key: RepriseStepKey;
  definition: ExtractionDefinition;
  import: (data: Record<string, unknown>) => Promise<ApplicationImportResult>;
}

interface ReprisePersistedState {
  etape: number;
  passees: RepriseStepKey[];
  terminee: boolean;
}

@Component({
  selector: 'naf-onboarding-reprise-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, ButtonComponent, SmartImportTriggerComponent],
  template: `
    <section class="reprise" aria-live="polite">
      <header class="reprise__head">
        <p class="reprise__step-label">
          {{ 'onboarding.reprise.stepLabel' | translate: { current: stepIndex() + 1, total: steps.length } }}
        </p>
        <ol class="reprise__dots" aria-hidden="true">
          @for (dot of stepIndexes; track dot) {
            <li
              class="reprise__dot"
              [class.reprise__dot--done]="dot < stepIndex() || isPassed(steps[dot].key)"
              [class.reprise__dot--current]="dot === stepIndex()"></li>
          }
        </ol>
      </header>

      <p class="reprise__eyebrow">{{ 'onboarding.reprise.eyebrow' | translate }}</p>
      <h1 class="reprise__title">{{ titleKey() | translate }}</h1>
      <p class="reprise__subtitle">{{ 'onboarding.reprise.magicHint' | translate }}</p>
      <p class="reprise__help">{{ helpKey() | translate }}</p>

      <div class="reprise__import">
        <nf-smart-import-trigger
          [definition]="currentDefinition()"
          [disabled]="busy()"
          (completed)="onImportCompleted($event)"
          (cancelled)="onImportCancelled()"
          (failed)="onImportFailed($event)" />
      </div>

      @if (lastResult(); as result) {
        <p class="reprise__result" role="status">
          {{
            'onboarding.reprise.result' | translate: {
              created: result.created,
              duplicates: result.skippedDuplicates,
              entity: ('onboarding.reprise.entities.' + currentKey()) | translate
            }
          }}
        </p>
      }

      @if (error()) {
        <p class="reprise__error" role="alert">{{ error() }}</p>
      }

      <div class="reprise__actions">
        <nf-button type="button" variant="ghost" (clicked)="skipStep()" [disabled]="busy()">
          {{ 'onboarding.reprise.skipStep' | translate }}
        </nf-button>
        <nf-button type="button" variant="primary" (clicked)="finishAll()" [disabled]="busy()">
          {{ 'onboarding.reprise.skipAll' | translate }}
        </nf-button>
      </div>

      <p class="reprise__later">{{ 'onboarding.reprise.laterHint' | translate }}</p>
    </section>
  `,
  styles: [`
    .reprise {
      max-width: 640px;
      margin: 0 auto;
      padding: clamp(1.5rem, 4vw, 2.5rem);
      background: var(--nf-color-surface);
      border-radius: 16px;
      box-shadow: 0 6px 32px rgba(10, 24, 64, 0.08);
    }
    .reprise__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .reprise__step-label {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nf-color-primary-500);
    }
    .reprise__dots { display: flex; gap: 0.4rem; list-style: none; margin: 0; padding: 0; }
    .reprise__dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--nf-border-default);
      transition: background 0.2s, transform 0.2s;
    }
    .reprise__dot--done { background: var(--nf-color-primary-300); }
    .reprise__dot--current {
      background: var(--nf-color-primary-500);
      transform: scale(1.3);
      box-shadow: 0 0 0 3px var(--nf-color-primary-100);
    }
    .reprise__eyebrow {
      margin: 0 0 0.35rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--nf-color-accent-700, #8a6d00);
    }
    .reprise__title {
      margin: 0 0 0.5rem;
      font-size: clamp(1.25rem, 3vw, 1.5rem);
      font-weight: 700;
      line-height: 1.3;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .reprise__subtitle {
      margin: 0 0 0.75rem;
      color: var(--nf-text-muted);
      line-height: 1.45;
    }
    .reprise__help {
      margin: 0 0 1.25rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      background: var(--nf-color-surface-muted, var(--nf-color-bg-muted));
      font-size: 0.875rem;
      line-height: 1.45;
    }
    .reprise__import { display: flex; justify-content: center; margin-bottom: 1rem; }
    .reprise__result {
      margin: 0 0 0.75rem;
      padding: 0.7rem 0.9rem;
      border-radius: 10px;
      background: var(--nf-color-success-50, #ecfdf5);
      color: var(--nf-color-success-800, #065f46);
      font-size: 0.875rem;
      text-align: center;
    }
    .reprise__error {
      color: var(--nf-color-danger-700);
      font-size: 0.875rem;
      margin: 0 0 0.75rem;
      text-align: center;
    }
    .reprise__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      margin-top: 1.25rem;
      flex-wrap: wrap;
    }
    .reprise__later {
      margin: 1.1rem 0 0;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--nf-text-muted);
    }
  `],
})
export class OnboardingReprisePage implements OnInit {
  private readonly api = inject(OnboardingApiService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly clientImport = inject(ClientImportService);
  private readonly fournisseurImport = inject(FournisseurImportService);
  private readonly employeImport = inject(EmployeImportService);

  readonly steps: RepriseStepConfig[] = [
    {
      key: 'clients',
      definition: CLIENT_IMPORT_DEFINITION,
      import: (data) => this.clientImport.import(data),
    },
    {
      key: 'fournisseurs',
      definition: FOURNISSEUR_IMPORT_DEFINITION,
      import: (data) => this.fournisseurImport.import(data),
    },
    {
      key: 'employes',
      definition: EMPLOYE_IMPORT_DEFINITION,
      import: (data) => this.employeImport.import(data),
    },
  ];

  readonly stepIndexes = this.steps.map((_, i) => i);

  readonly stepIndex = signal(0);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastResult = signal<ApplicationImportResult | null>(null);
  readonly passees = signal<RepriseStepKey[]>([]);

  private tenantId: string | null = null;
  private baseAnswers: Record<string, unknown> = {};
  private currentStepSnapshot = 5;

  readonly currentKey = computed(() => this.steps[this.stepIndex()]?.key ?? 'clients');
  readonly currentDefinition = computed(() => this.steps[this.stepIndex()]!.definition);
  readonly titleKey = computed(() => `onboarding.reprise.steps.${this.currentKey()}.title`);
  readonly helpKey = computed(() => `onboarding.reprise.steps.${this.currentKey()}.help`);

  ngOnInit(): void {
    void this.restore();
  }

  isPassed(key: RepriseStepKey): boolean {
    return this.passees().includes(key);
  }

  async onImportCompleted(result: ReviewedExtraction): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const step = this.steps[this.stepIndex()]!;
      const importResult = await step.import(result.data);
      this.lastResult.set(importResult);
      this.toast.success(
        this.i18n.instant('onboarding.reprise.result', {
          created: importResult.created,
          duplicates: importResult.skippedDuplicates,
          entity: this.i18n.instant(`onboarding.reprise.entities.${step.key}`),
        }),
      );
      await this.markPassedAndAdvance(step.key);
    } catch (err) {
      console.error('[onboarding-reprise]', err);
      this.error.set(this.i18n.instant('onboarding.reprise.errorImport'));
      this.toast.error(this.i18n.instant('onboarding.reprise.errorImport'));
    } finally {
      this.busy.set(false);
    }
  }

  onImportCancelled(): void {
    this.error.set(null);
  }

  onImportFailed(err: SmartImportError): void {
    const translated = this.i18n.instant(err.messageKey);
    this.error.set(
      translated !== err.messageKey
        ? translated
        : this.i18n.instant('onboarding.reprise.errorExtract'),
    );
  }

  async skipStep(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.lastResult.set(null);
    this.error.set(null);
    await this.markPassedAndAdvance(this.currentKey());
  }

  async finishAll(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      const remaining = this.steps.slice(this.stepIndex()).map((s) => s.key);
      const merged = [...new Set([...this.passees(), ...remaining])];
      this.passees.set(merged);
      await this.persist({ etape: this.steps.length - 1, passees: merged, terminee: true });
      await this.router.navigateByUrl('/dashboard');
    } finally {
      this.busy.set(false);
    }
  }

  private async markPassedAndAdvance(key: RepriseStepKey): Promise<void> {
    const passees = this.passees().includes(key) ? this.passees() : [...this.passees(), key];
    this.passees.set(passees);

    const next = this.stepIndex() + 1;
    if (next >= this.steps.length) {
      await this.persist({ etape: this.steps.length - 1, passees, terminee: true });
      await this.router.navigateByUrl('/dashboard');
      return;
    }

    this.stepIndex.set(next);
    this.lastResult.set(null);
    await this.persist({ etape: next, passees, terminee: false });
  }

  private async restore(): Promise<void> {
    try {
      const state = await this.api.getState();
      this.tenantId = state.tenantId;
      this.baseAnswers = { ...(state.answers ?? {}) };
      this.currentStepSnapshot = Math.max(state.currentStep, 5);

      const reprise = this.readReprise(state.answers);
      if (reprise.terminee) {
        await this.router.navigateByUrl('/dashboard');
        return;
      }
      this.passees.set(reprise.passees);
      this.stepIndex.set(Math.min(Math.max(reprise.etape, 0), this.steps.length - 1));
    } catch {
      // fresh reprise — start at clients
    }
  }

  private readReprise(answers: Record<string, unknown> | undefined): ReprisePersistedState {
    const raw = answers?.['reprise'];
    if (!raw || typeof raw !== 'object') {
      return { etape: 0, passees: [], terminee: false };
    }
    const obj = raw as Record<string, unknown>;
    const passees = Array.isArray(obj['passees'])
      ? (obj['passees'] as unknown[]).filter((k): k is RepriseStepKey =>
          k === 'clients' || k === 'fournisseurs' || k === 'employes',
        )
      : [];
    return {
      etape: typeof obj['etape'] === 'number' ? obj['etape'] : 0,
      passees,
      terminee: obj['terminee'] === true,
    };
  }

  private async persist(reprise: ReprisePersistedState): Promise<void> {
    await this.api.saveState({
      currentStep: this.currentStepSnapshot,
      tenantId: this.tenantId,
      answers: {
        ...this.baseAnswers,
        reprise,
      },
    });
    this.baseAnswers = { ...this.baseAnswers, reprise };
  }
}
