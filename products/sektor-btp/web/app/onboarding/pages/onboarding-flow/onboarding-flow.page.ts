import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { OnboardingApiService } from '../../services/onboarding-api.service';

type ChoiceStep = 1 | 2 | 3 | 4;

const CHECK_KEYS = [
  'identity',
  'chart',
  'numbering',
  'fiscal',
  'print',
  'articles',
  'roles',
  'dashboards',
] as const;

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'naf-onboarding-flow-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  template: `
    <div class="flow" [class.flow--done]="phase() === 'done'">
      <section class="flow__chat" aria-live="polite">
        <h1>{{ 'onboarding.flow.title' | translate }}</h1>

        @if (phase() === 'questions') {
          <p class="flow__q">{{ questionLabel() }}</p>

          @if (step() === 0) {
            <textarea class="flow__input" rows="3" [(ngModel)]="q1Text" [attr.placeholder]="'onboarding.flow.companyFree' | translate"></textarea>
            <input class="flow__input" type="text" maxlength="15" [(ngModel)]="ice" [attr.placeholder]="'onboarding.flow.ice' | translate" />
          } @else {
            @if (choiceStep(); as cs) {
              <div class="flow__choices" role="group">
                @for (opt of choiceOptions(cs); track opt.value) {
                  <nf-button type="button" class="flow__choice" [class.is-selected]="choiceValue(cs) === opt.value" (clicked)="selectChoice(cs, opt.value)" variant="secondary">
                    {{ opt.labelKey | translate }}
                  </nf-button>
                }
              </div>
            }
          }

          @if (error()) {
            <p class="flow__error" role="alert">{{ error() }}</p>
          }

          @if (step() === 0) {
            <p class="flow__hint" [class.flow__hint--invalid]="ice.length > 0 && ice.length !== 15">
              {{ 'onboarding.flow.iceHint' | translate:{ count: ice.length } }}
            </p>
          }

          @if (busy()) {
            <p class="flow__busy">…</p>
          } @else {
            <nf-button type="button" class="flow__next" (clicked)="advance()" [disabled]="busy()" variant="secondary">
              {{ (step() < 4 ? 'onboarding.flow.next' : 'onboarding.flow.finish') | translate }}
            </nf-button>
          }
        } @else {
          <p class="flow__ready">{{ 'onboarding.flow.ready' | translate }}</p>
          <div class="flow__actions">
            <nf-button type="button" class="flow__next" (clicked)="goChantier()" variant="secondary">{{ 'onboarding.flow.goChantier' | translate }}</nf-button>
            <nf-button type="button" class="flow__link" (clicked)="goDashboard()" variant="secondary">{{ 'onboarding.flow.exploreLater' | translate }}</nf-button>
          </div>
        }
      </section>

      <aside class="flow__progress" aria-live="polite">
        <h2>{{ 'onboarding.flow.progressTitle' | translate }}</h2>
        <ul>
          @for (key of checkKeys; track key) {
            <li [class.is-done]="checks()[key]">
              <span class="flow__check" aria-hidden="true">{{ checks()[key] ? '✓' : '○' }}</span>
              {{ ('onboarding.flow.checklist.' + key) | translate }}
            </li>
          }
        </ul>
      </aside>
    </div>
  `,
  styles: [`
    .flow { display: flex; flex-direction: column; gap: 1.5rem; }
    @media (min-width: 900px) {
      .flow { flex-direction: row; align-items: flex-start; }
      .flow__chat { flex: 3 1 0; min-width: 0; }
      .flow__progress { flex: 2 1 0; position: sticky; top: 1rem; }
    }
    .flow__chat, .flow__progress {
      background: var(--nf-color-surface); border-radius: 12px; padding: 1.25rem;
      box-shadow: 0 2px 12px rgba(0,0,0,.05);
    }
    .flow__q { font-size: 1.125rem; font-weight: 600; margin: 1rem 0; }
    .flow__input { width: 100%; box-sizing: border-box; margin-bottom: 0.75rem; padding: 0.625rem; border-radius: 8px; border: 1px solid var(--nf-border-default); font: inherit; }
    .flow__choices { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .flow__choice {
      padding: 0.5rem 0.875rem; border-radius: 999px; border: 1px solid var(--nf-border-default);
      background: var(--nf-color-surface); cursor: pointer; font: inherit;
    }
    .flow__choice.is-selected { border-color: var(--nf-color-primary-600); background: var(--nf-color-primary-50); }
    .flow__next { margin-top: 1rem; padding: 0.75rem 1.25rem; border: 0; border-radius: 8px; background: var(--nf-color-primary-600); color: var(--nf-color-surface); font-weight: 600; cursor: pointer; }
    .flow__link { margin-top: 0.75rem; background: none; border: 0; color: var(--nf-color-primary-600); cursor: pointer; text-decoration: underline; }
    .flow__progress ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .flow__progress li { display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.875rem; transition: color 0.2s; }
    .flow__progress li.is-done { color: var(--nf-color-success-700); }
    .flow__check { width: 1.25rem; flex-shrink: 0; }
    .flow__busy { color: var(--nf-text-muted); }
    .flow__error { color: var(--nf-color-danger-700); font-size: 0.875rem; margin-top: 0.75rem; }
    .flow__hint { font-size: 0.8125rem; color: var(--nf-text-muted); margin: 0.25rem 0 0; }
    .flow__hint--invalid { color: var(--nf-color-warning-700); }
    .flow__next:disabled { opacity: 0.6; cursor: not-allowed; }
    .flow__actions { display: flex; flex-direction: column; align-items: flex-start; }
  `],
})
export class OnboardingFlowPage implements OnInit {
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);

  readonly checkKeys = CHECK_KEYS;
  readonly step = signal(0);
  readonly phase = signal<'questions' | 'done'>('questions');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly checks = signal<Record<string, boolean>>({});

  q1Text = '';
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

  readonly questionLabel = computed(() => {
    const keys = [
      'onboarding.flow.q1',
      'onboarding.flow.q2',
      'onboarding.flow.q3',
      'onboarding.flow.q4',
      'onboarding.flow.q5',
    ];
    return this.i18n.instant(keys[this.step()] ?? keys[0]);
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

  canAdvance(): boolean {
    if (this.step() === 0) {
      return this.ice.length === 15 && this.q1Text.trim().length > 1;
    }
    const cs = this.choiceStep();
    if (!cs) return false;
    return !!this.choiceValue(cs);
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

    if (this.step() < 4) {
      if (this.step() === 0) {
        const ok = await this.handleQ1();
        if (!ok) {
          return;
        }
      }
      this.step.update((s) => s + 1);
      await this.persistState();
      return;
    }

    await this.applyPreset();
  }

  private validationMessage(): string {
    if (this.step() === 0) {
      if (this.q1Text.trim().length < 2) {
        return this.i18n.instant('onboarding.flow.errorCompany');
      }
      if (this.ice.length !== 15) {
        return this.i18n.instant('onboarding.flow.errorIce');
      }
    }
    const cs = this.choiceStep();
    if (cs && !this.choiceValue(cs)) {
      return this.i18n.instant('onboarding.flow.errorChoice');
    }
    return this.i18n.instant('onboarding.flow.errorGeneric');
  }

  private async handleQ1(): Promise<boolean> {
    this.busy.set(true);
    try {
      const parsed = await this.api.parseAgent('q1', this.q1Text, {});
      const nom = String(parsed.extracted['nom'] ?? this.q1Text.trim());
      const iceVal = String(parsed.extracted['ice'] ?? this.ice).replace(/\D/g, '');
      this.ice = iceVal.length === 15 ? iceVal : this.ice.replace(/\D/g, '');
      if (this.ice.length !== 15) {
        this.error.set(this.i18n.instant('onboarding.flow.errorIce'));
        return false;
      }
      this.companyName.set(nom);

      const created = await this.api.createTenant({
        companyName: nom,
        ice: this.ice,
        legalForm: String(parsed.extracted['forme'] ?? 'SARL'),
      });
      this.tenantId.set(created.tenantId);
      await this.auth.attachOnboardingTenant(
        created.tenantId,
        created.tenantName,
        created.tenantKey,
        created.accessToken,
        created.expiresIn
      );
      this.markCheck('identity', true);
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
    try {
      const preset = await this.api.normalizePreset({
        societe: { nom: this.companyName(), ice: this.ice, forme: 'SARL' },
        secteur: this.secteur,
        taille: this.taille,
        marches: this.marches,
        compta: this.compta,
      });
      const result = await this.api.applyPreset(tid, preset);
      for (const key of CHECK_KEYS) {
        this.markCheck(key, true);
      }
      void result;
      this.phase.set('done');
      await this.persistState(5);
    } catch (err: unknown) {
      const msg = this.extractApiMessage(err);
      if (msg.includes('PRESET_ALREADY_APPLIED')) {
        for (const key of CHECK_KEYS) {
          this.markCheck(key, true);
        }
        this.phase.set('done');
        await this.persistState(5);
        return;
      }
      this.error.set(
        msg.includes('TENANT_NOT_EMPTY')
          ? this.i18n.instant('onboarding.flow.errorPresetConflict')
          : this.i18n.instant('onboarding.flow.errorGeneric')
      );
    } finally {
      this.busy.set(false);
    }
  }

  private extractApiMessage(err: unknown): string {
    const body = (err as { error?: { message?: string } })?.error;
    if (typeof body === 'string') {
      return body;
    }
    return body?.message ?? '';
  }

  private markCheck(key: string, value: boolean): void {
    this.checks.update((c) => ({ ...c, [key]: value }));
  }

  private async persistState(stepOverride?: number): Promise<void> {
    const current = stepOverride ?? this.step();
    await this.api.saveState({
      currentStep: current,
      tenantId: this.tenantId(),
      answers: {
        q1Text: this.q1Text,
        ice: this.ice,
        secteur: this.secteur,
        taille: this.taille,
        marches: this.marches,
        compta: this.compta,
        companyName: this.companyName(),
      },
    });
  }

  private async restoreState(): Promise<void> {
    try {
      const state = await this.api.getState();
      this.step.set(state.currentStep);
      if (state.tenantId) {
        this.tenantId.set(state.tenantId);
      }
      const a = state.answers as Record<string, string>;
      this.q1Text = a['q1Text'] ?? '';
      this.ice = a['ice'] ?? '';
      this.secteur = a['secteur'] ?? '';
      this.taille = a['taille'] ?? '';
      this.marches = a['marches'] ?? '';
      this.compta = a['compta'] ?? '';
      if (a['companyName']) {
        this.companyName.set(a['companyName']);
      }
      if (state.currentStep >= 5 || state.completed) {
        this.phase.set('done');
        for (const key of CHECK_KEYS) {
          this.markCheck(key, true);
        }
      } else if (state.currentStep > 0) {
        this.markCheck('identity', true);
      }
    } catch {
      // fresh onboarding
    }
  }

  goChantier(): void {
    void this.router.navigateByUrl('/onboarding/chantier');
  }

  goDashboard(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
