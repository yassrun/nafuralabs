import { Directive, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { I18nService } from '@core/i18n';
import {
  PageHeaderComponent,
  PageShellComponent,
  WizardShellComponent,
} from '../components';
import type { PageHeaderConfig, WizardStepConfig } from '../components';
import type { WizardPageConfig, WizardStepDefinition } from '../types';
import { BasePageClass } from '../../../core/pages/base-page.class';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED IMPORTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common imports for config-driven wizard pages.
 * Use in your component's imports array.
 */
export const ConfigDrivenWizardPageImports = [
  CommonModule,
  PageShellComponent,
  PageHeaderComponent,
  WizardShellComponent,
] as const;

/**
 * Common styles for config-driven wizard pages.
 * Use in your component's styles array.
 */
export const ConfigDrivenWizardPageStyles = `
  :host { display: block; height: 100%; }
  nf-page-shell { height: 100%; }
`;

// ═══════════════════════════════════════════════════════════════════════════
// BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for config-driven wizard pages.
 *
 * Subclass must provide:
 * - config: Wizard page configuration
 * - handleSubmit: Final submit handler
 */
@Directive()
export abstract class ConfigDrivenWizardPage extends BasePageClass {
  protected readonly i18n = inject(I18nService);
  protected readonly language = signal(this.i18n.getCurrentLanguage());

  abstract readonly config: WizardPageConfig;

  headerConfig: PageHeaderConfig = { title: '' };
  readonly currentStepIndex = signal(0);
  readonly canProceed = signal(true);

  readonly steps = computed<WizardStepConfig[]>(() => {
    this.language();
    return this.config.steps.map((step) => this.mapStep(step));
  });

  readonly backLabel = computed(() => this.t(this.getLabelKey('back')));
  readonly nextLabel = computed(() => this.t(this.getLabelKey('next')));
  readonly submitLabel = computed(() => this.t(this.getLabelKey('submit')));

  readonly backIcon = computed(() => this.config.actionIcons?.backIcon ?? 'arrow_back');
  readonly nextIcon = computed(() => this.config.actionIcons?.nextIcon ?? 'arrow_forward');
  readonly submitIcon = computed(() => this.config.actionIcons?.submitIcon ?? 'check');

  protected override onPageInit(): void {
    this.updateHeader();

    this.i18n.onLanguageChange()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.language.set(lang);
        this.updateHeader();
      });

    this.onWizardInit();
  }

  protected onWizardInit(): void {
    // Optional hook for subclasses.
  }

  async onBack(): Promise<void> {
    if (this.currentStepIndex() <= 0) return;
    const ok = await this.beforeStepBack(this.currentStepIndex());
    if (ok) {
      this.currentStepIndex.update((step) => Math.max(0, step - 1));
    }
  }

  async onNext(): Promise<void> {
    if (!this.canProceed()) return;
    const ok = await this.beforeStepNext(this.currentStepIndex());
    if (ok) {
      this.currentStepIndex.update((step) => step + 1);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.canProceed()) return;
    await this.handleSubmit();
  }

  protected async beforeStepBack(_fromIndex: number): Promise<boolean> {
    return true;
  }

  protected async beforeStepNext(_fromIndex: number): Promise<boolean> {
    return true;
  }

  protected abstract handleSubmit(): Promise<void> | void;

  private updateHeader(): void {
    const title = this.t(this.config.headerTitleKey);
    const subtitleKey = this.config.headerSubtitleKey;
    this.headerConfig = {
      title,
      subtitle: subtitleKey ? this.t(subtitleKey) : undefined,
      icon: this.config.headerIcon,
    };
    this.setPageTitle(title);
  }

  private mapStep(step: WizardStepDefinition): WizardStepConfig {
    return {
      id: step.id,
      label: this.t(step.labelKey),
      icon: step.icon,
      description: step.descriptionKey ? this.t(step.descriptionKey) : undefined,
    };
  }

  private getLabelKey(type: 'back' | 'next' | 'submit'): string {
    const labels = this.config.actionLabels;
    if (type === 'back') {
      return labels?.backKey ?? 'core.wizard.actions.back';
    }
    if (type === 'next') {
      return labels?.nextKey ?? 'core.wizard.actions.next';
    }
    return labels?.submitKey ?? 'core.wizard.actions.submit';
  }

  protected t(key: string): string {
    return this.i18n.instant(key);
  }
}
