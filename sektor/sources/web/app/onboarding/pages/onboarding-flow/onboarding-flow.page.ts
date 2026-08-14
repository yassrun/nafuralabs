import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { OnboardingApiService } from '../../services/onboarding-api.service';

import { ButtonComponent } from '@lib/anatomy';

type ChoiceStep = 1 | 2 | 3 | 4;
type Phase = 'questions' | 'applying' | 'done';

/** Étapes réellement exécutées par le backend lors de l'apply-preset. */
const PRESET_STEP_KEYS = [
  'identity',
  'domains',
  'fiscal',
  'referenceData',
  'chartOfAccounts',
  'numbering',
  'articles',
] as const;

const TOTAL_STEPS = 5;

@Component({
  selector: 'naf-onboarding-flow-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  template: `
    <section class="flow" aria-live="polite">
      @if (phase() === 'questions') {
        <header class="flow__head">
          <p class="flow__step-label">
            {{ 'onboarding.flow.stepLabel' | translate: { current: step() + 1, total: totalSteps } }}
          </p>
          <ol class="flow__dots" aria-hidden="true">
            @for (dot of dots; track dot) {
              <li
                class="flow__dot"
                [class.flow__dot--done]="dot < step()"
                [class.flow__dot--current]="dot === step()"></li>
            }
          </ol>
        </header>

        <h1 class="flow__q">{{ questionKey() | translate }}</h1>

        @if (step() === 0) {
          <div class="flow__fields">
            <label class="flow__field">
              <span>{{ 'onboarding.flow.company' | translate }}</span>
              <input
                type="text"
                maxlength="200"
                [(ngModel)]="companyInput"
                [attr.placeholder]="'onboarding.flow.companyPlaceholder' | translate" />
            </label>
            <label class="flow__field">
              <span>{{ 'onboarding.flow.iceOptional' | translate }}</span>
              <input
                type="text"
                maxlength="15"
                inputmode="numeric"
                [(ngModel)]="ice"
                [attr.placeholder]="'onboarding.flow.icePlaceholder' | translate" />
              <small class="flow__hint" [class.flow__hint--invalid]="ice.length > 0 && ice.length !== 15">
                {{ 'onboarding.flow.iceHint' | translate }}
              </small>
            </label>
          </div>
        } @else {
          @if (choiceStep(); as cs) {
            <div class="flow__choices" role="group">
              @for (opt of choiceOptions(cs); track opt.value) {
                <nf-button
                  type="button"
                  class="flow__choice"
                  size="sm"
                  [variant]="choiceValue(cs) === opt.value ? 'primary' : 'stroked'"
                  (clicked)="selectChoice(cs, opt.value)">
                  {{ opt.labelKey | translate }}
                </nf-button>
              }
            </div>
            <p class="flow__optional-hint">{{ 'onboarding.flow.optionalHint' | translate }}</p>
          }
        }

        @if (error()) {
          <p class="flow__error" role="alert">{{ error() }}</p>
        }

        <div class="flow__actions">
          @if (step() > 1) {
            <nf-button type="button" variant="ghost" (clicked)="back()" [disabled]="busy()">
              {{ 'onboarding.flow.back' | translate }}
            </nf-button>
          }
          <nf-button
            type="button"
            class="flow__next"
            variant="primary"
            (clicked)="advance()"
            [disabled]="busy() || !canAdvance()">
            {{ nextLabel() | translate }}
          </nf-button>
          @if (step() >= 1 && step() < 4) {
            <nf-button type="button" variant="ghost" (clicked)="skipStep()" [disabled]="busy()">
              {{ 'onboarding.flow.skipStep' | translate }}
            </nf-button>
          }
        </div>

        @if (step() >= 1) {
          <button type="button" class="flow__shortcut" (click)="finishWithRecommended()" [disabled]="busy()">
            {{ 'onboarding.flow.finishRecommended' | translate }}
          </button>
        }
      } @else if (phase() === 'applying') {
        <div class="flow__applying" role="status">
          <span class="flow__spinner" aria-hidden="true"></span>
          <h1>{{ 'onboarding.flow.applyingTitle' | translate }}</h1>
          <p>{{ 'onboarding.flow.applyingSubtitle' | translate }}</p>
        </div>
      } @else {
        <div class="flow__done">
          <span class="flow__done-mark" aria-hidden="true">✓</span>
          <h1>{{ 'onboarding.flow.readyTitle' | translate: { company: companyName() } }}</h1>
          <p class="flow__done-sub">{{ 'onboarding.flow.readySubtitle' | translate }}</p>

          <ul class="flow__prepared" [attr.aria-label]="'onboarding.flow.preparedTitle' | translate">
            @for (key of preparedSteps(); track key) {
              <li>
                <span class="flow__prepared-check" aria-hidden="true">✓</span>
                {{ ('onboarding.flow.checklist.' + key) | translate }}
              </li>
            }
          </ul>

          <p class="flow__done-hint">{{ 'onboarding.flow.completeLaterHint' | translate }}</p>

          <nf-button type="button" variant="primary" (clicked)="goDashboard()">
            {{ 'onboarding.flow.goDashboard' | translate }}
          </nf-button>
        </div>
      }
    </section>
  `,
  styles: [`
    .flow {
      max-width: 620px;
      margin: 0 auto;
      padding: clamp(1.5rem, 4vw, 2.5rem);
      background: var(--nf-color-surface);
      border-radius: 16px;
      box-shadow: 0 6px 32px rgba(10, 24, 64, 0.08);
    }
    .flow__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .flow__step-label {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nf-color-primary-500);
    }
    .flow__dots { display: flex; gap: 0.4rem; list-style: none; margin: 0; padding: 0; }
    .flow__dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--nf-border-default);
      transition: background 0.2s, transform 0.2s;
    }
    .flow__dot--done { background: var(--nf-color-primary-300); }
    .flow__dot--current {
      background: var(--nf-color-primary-500);
      transform: scale(1.3);
      box-shadow: 0 0 0 3px var(--nf-color-primary-100);
    }
    .flow__q {
      margin: 0 0 1.25rem;
      font-size: clamp(1.25rem, 3vw, 1.5rem);
      font-weight: 700;
      line-height: 1.3;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .flow__fields { display: flex; flex-direction: column; gap: 1rem; }
    .flow__field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; font-weight: 500; }
    .flow__field input {
      padding: 0.7rem 0.85rem;
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      font: inherit;
      font-weight: 400;
    }
    .flow__field input:focus-visible {
      outline: 2px solid var(--nf-color-primary-400);
      outline-offset: 1px;
      border-color: var(--nf-color-primary-400);
    }
    .flow__hint { font-size: 0.78rem; font-weight: 400; color: var(--nf-text-muted); }
    .flow__hint--invalid { color: var(--nf-color-warning-700); }
    .flow__choices { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .flow__choices ::ng-deep button { border-radius: 999px; }
    .flow__optional-hint { margin: 0.75rem 0 0; font-size: 0.78rem; color: var(--nf-text-muted); }
    .flow__error { color: var(--nf-color-danger-700); font-size: 0.875rem; margin: 0.9rem 0 0; }
    .flow__actions { display: flex; align-items: center; gap: 0.6rem; margin-top: 1.5rem; flex-wrap: wrap; }
    .flow__shortcut {
      display: inline-block;
      margin-top: 1.1rem;
      padding: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: 0.8125rem;
      color: var(--nf-color-primary-600);
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
    .flow__shortcut:disabled { opacity: 0.5; cursor: default; }

    .flow__applying { text-align: center; padding: 1.5rem 0; }
    .flow__applying h1 { font-size: 1.25rem; margin: 1rem 0 0.35rem; }
    .flow__applying p { margin: 0; color: var(--nf-text-muted); }
    .flow__spinner {
      display: inline-block;
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 3px solid var(--nf-color-primary-100);
      border-top-color: var(--nf-color-primary-500);
      animation: flow-spin 0.8s linear infinite;
    }
    @keyframes flow-spin { to { transform: rotate(360deg); } }

    .flow__done { text-align: center; }
    .flow__done-mark {
      display: inline-flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--nf-color-accent-100, #fbf3c9);
      color: var(--nf-color-accent-700, #8a6d00);
      font-size: 1.5rem; font-weight: 700;
      margin-bottom: 0.9rem;
    }
    .flow__done h1 { font-size: clamp(1.25rem, 3vw, 1.5rem); margin: 0 0 0.4rem; }
    .flow__done-sub { margin: 0 0 1.25rem; color: var(--nf-text-muted); }
    .flow__prepared {
      list-style: none; margin: 0 auto 1.25rem; padding: 1rem 1.25rem;
      max-width: 420px; text-align: start;
      background: var(--nf-color-surface-muted, var(--nf-color-bg-muted));
      border-radius: 12px;
      display: flex; flex-direction: column; gap: 0.45rem;
      font-size: 0.875rem;
    }
    .flow__prepared li { display: flex; gap: 0.5rem; align-items: baseline; }
    .flow__prepared-check { color: var(--nf-color-success-600); font-weight: 700; flex-shrink: 0; }
    .flow__done-hint { margin: 0 0 1.25rem; font-size: 0.8125rem; color: var(--nf-text-muted); }
  `],
})
export class OnboardingFlowPage implements OnInit {
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);

  readonly totalSteps = TOTAL_STEPS;
  readonly dots = Array.from({ length: TOTAL_STEPS }, (_, i) => i);

  readonly step = signal(0);
  readonly phase = signal<Phase>('questions');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly preparedSteps = signal<readonly string[]>(PRESET_STEP_KEYS);

  companyInput = '';
  ice = '';
  secteur = '';
  taille = '';
  marches = '';
  compta = '';

  tenantId = signal<string | null>(null);
  companyName = signal('');

  readonly choiceStep = computed(() => {
    const s = this.step();
    return s >= 1 && s <= 4 ? (s as ChoiceStep) : null;
  });

  readonly questionKey = computed(() => {
    const keys = [
      'onboarding.flow.q1',
      'onboarding.flow.q2',
      'onboarding.flow.q3',
      'onboarding.flow.q4',
      'onboarding.flow.q5',
    ];
    return keys[this.step()] ?? keys[0];
  });

  ngOnInit(): void {
    void this.restoreState();
  }

  choiceOptions(cs: ChoiceStep): { value: string; labelKey: string }[] {
    const maps: Record<ChoiceStep, { value: string; labelKey: string }[]> = {
      1: ['BATIMENT', 'TP', 'VRD', 'MIXTE'].map((v) => ({
        value: v,
        labelKey: `onboarding.flow.secteur.${v}`,
      })),
      2: ['S', 'M', 'L', 'XL'].map((v) => ({
        value: v,
        labelKey: `onboarding.flow.taille.${v}`,
      })),
      3: ['PRIVE', 'PUBLIC', 'MIXTE'].map((v) => ({
        value: v,
        labelKey: `onboarding.flow.marches.${v}`,
      })),
      4: ['INTERNE', 'EXTERNE', 'AUCUNE'].map((v) => ({
        value: v,
        labelKey: `onboarding.flow.compta.${v}`,
      })),
    };
    return maps[cs];
  }

  choiceValue(cs: ChoiceStep): string {
    return { 1: this.secteur, 2: this.taille, 3: this.marches, 4: this.compta }[cs];
  }

  selectChoice(cs: ChoiceStep, value: string): void {
    if (cs === 1) this.secteur = value;
    if (cs === 2) this.taille = value;
    if (cs === 3) this.marches = value;
    if (cs === 4) this.compta = value;
  }

  nextLabel(): string {
    if (this.step() === 0) {
      return this.busy() ? 'onboarding.flow.creating' : 'onboarding.flow.createSpace';
    }
    return this.step() < 4 ? 'onboarding.flow.next' : 'onboarding.flow.finish';
  }

  canAdvance(): boolean {
    if (this.step() === 0) {
      const iceOk = this.ice.length === 0 || /^\d{15}$/.test(this.ice);
      return this.companyInput.trim().length >= 2 && iceOk;
    }
    // Étapes profil : facultatives, la validation ne bloque jamais.
    return true;
  }

  back(): void {
    if (this.step() > 1) {
      this.error.set(null);
      this.step.update((s) => s - 1);
    }
  }

  async advance(): Promise<void> {
    this.error.set(null);
    if (this.busy()) {
      return;
    }
    if (!this.canAdvance()) {
      this.error.set(this.validationMessage());
      return;
    }

    if (this.step() === 0) {
      const ok = await this.createTenant();
      if (!ok) {
        return;
      }
      this.step.set(1);
      await this.persistState();
      return;
    }

    if (this.step() < 4) {
      this.step.update((s) => s + 1);
      await this.persistState();
      return;
    }

    await this.applyPreset();
  }

  async skipStep(): Promise<void> {
    if (this.busy() || this.step() < 1 || this.step() >= 4) {
      return;
    }
    this.error.set(null);
    this.step.update((s) => s + 1);
    await this.persistState();
  }

  /** Termine immédiatement : les réponses manquantes utilisent les recommandations Sektor (defaults backend). */
  async finishWithRecommended(): Promise<void> {
    if (this.busy()) {
      return;
    }
    await this.applyPreset();
  }

  private validationMessage(): string {
    if (this.step() === 0) {
      if (this.companyInput.trim().length < 2) {
        return this.i18n.instant('onboarding.flow.errorCompany');
      }
      if (this.ice.length > 0 && !/^\d{15}$/.test(this.ice)) {
        return this.i18n.instant('onboarding.flow.errorIce');
      }
    }
    return this.i18n.instant('onboarding.flow.errorGeneric');
  }

  private async createTenant(): Promise<boolean> {
    this.busy.set(true);
    try {
      const nom = this.companyInput.trim();
      this.companyName.set(nom);
      const created = await this.api.createTenant({
        companyName: nom,
        ice: this.ice.length === 15 ? this.ice : undefined,
        legalForm: 'SARL',
      });
      this.tenantId.set(created.tenantId);
      await this.auth.attachOnboardingTenant(
        created.tenantId,
        created.tenantName,
        created.tenantKey,
        created.accessToken,
        created.expiresIn
      );
      return true;
    } catch (err: unknown) {
      const body = (err as { error?: { message?: string } })?.error;
      const msg = typeof body === 'string' ? body : body?.message;
      this.error.set(
        msg && String(msg).length > 0
          ? String(msg)
          : this.i18n.instant('onboarding.flow.errorCreateTenant')
      );
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  private async applyPreset(): Promise<void> {
    const tid = this.tenantId();
    if (!tid) {
      this.error.set(this.i18n.instant('onboarding.flow.errorCreateTenant'));
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.phase.set('applying');
    try {
      const preset = await this.api.normalizePreset({
        societe: {
          nom: this.companyName() || this.companyInput.trim(),
          ice: this.ice.length === 15 ? this.ice : null,
          forme: 'SARL',
        },
        secteur: this.secteur || null,
        taille: this.taille || null,
        marches: this.marches || null,
        compta: this.compta || null,
      });
      const result = await this.api.applyPreset(tid, preset);
      this.preparedSteps.set(this.toPreparedSteps(result.completedSteps));
      this.phase.set('done');
      await this.persistState(TOTAL_STEPS);
    } catch (err: unknown) {
      const msg = this.extractApiMessage(err);
      if (msg.includes('PRESET_ALREADY_APPLIED')) {
        this.phase.set('done');
        await this.persistState(TOTAL_STEPS);
        return;
      }
      this.phase.set('questions');
      this.error.set(
        msg.includes('TENANT_NOT_EMPTY')
          ? this.i18n.instant('onboarding.flow.errorPresetConflict')
          : this.i18n.instant('onboarding.flow.errorGeneric')
      );
    } finally {
      this.busy.set(false);
    }
  }

  /** Mappe les étapes backend (y compris variantes «-skipped») vers les clés d'affichage. */
  private toPreparedSteps(completedSteps: string[]): string[] {
    const done = new Set(completedSteps.map((s) => s.replace(/-skipped$/, '')));
    if (done.has('already-applied')) {
      return [...PRESET_STEP_KEYS];
    }
    return PRESET_STEP_KEYS.filter((key) => done.has(key));
  }

  private extractApiMessage(err: unknown): string {
    const body = (err as { error?: { message?: string } })?.error;
    if (typeof body === 'string') {
      return body;
    }
    return body?.message ?? '';
  }

  private async persistState(stepOverride?: number): Promise<void> {
    const current = stepOverride ?? this.step();
    await this.api.saveState({
      currentStep: current,
      tenantId: this.tenantId(),
      answers: {
        companyName: this.companyName() || this.companyInput.trim(),
        ice: this.ice,
        secteur: this.secteur,
        taille: this.taille,
        marches: this.marches,
        compta: this.compta,
      },
    });
  }

  private async restoreState(): Promise<void> {
    try {
      const state = await this.api.getState();
      this.step.set(Math.min(state.currentStep, 4));
      if (state.tenantId) {
        this.tenantId.set(state.tenantId);
      }
      const a = state.answers as Record<string, string>;
      this.companyInput = a['companyName'] ?? a['q1Text'] ?? '';
      this.ice = a['ice'] ?? '';
      this.secteur = a['secteur'] ?? '';
      this.taille = a['taille'] ?? '';
      this.marches = a['marches'] ?? '';
      this.compta = a['compta'] ?? '';
      if (a['companyName']) {
        this.companyName.set(a['companyName']);
      }
      if (state.currentStep >= TOTAL_STEPS || state.completed) {
        this.phase.set('done');
      }
    } catch {
      // fresh onboarding
    }
  }

  goDashboard(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
