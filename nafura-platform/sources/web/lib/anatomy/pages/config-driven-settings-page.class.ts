import { Directive, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { I18nService } from '@core/i18n';
import {
  PageHeaderComponent,
  PageShellComponent,
  TabsComponent,
  ButtonListComponent,
} from '../components';
import type { PageHeaderConfig } from '../components';
import type {
  SettingsPageConfig,
  SettingsTabConfig,
  SettingsActionConfig,
} from '../types';
import type { TabItem, ButtonListItem } from '../components';
import { BasePageClass } from '../../../core/pages/base-page.class';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED IMPORTS & STYLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common imports for config-driven settings pages.
 * Use in your component's imports array.
 */
export const ConfigDrivenSettingsPageImports = [
  CommonModule,
  PageShellComponent,
  PageHeaderComponent,
  TabsComponent,
  ButtonListComponent,
] as const;

/**
 * Common styles for config-driven settings pages.
 * Use in your component's styles array.
 */
export const ConfigDrivenSettingsPageStyles = `
  :host { display: block; height: 100%; }
  nf-page-shell { height: 100%; }
  .nf-settings-content { padding: var(--nf-space-4) 0; }
  .nf-settings-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--nf-space-4);
    padding-top: var(--nf-space-4);
    border-top: 1px solid var(--nf-color-border);
  }
  .nf-settings-actions nf-button-list:last-child { margin-left: auto; }
`;

// ═══════════════════════════════════════════════════════════════════════════
// BASE CLASS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Base class for config-driven settings pages.
 *
 * Subclass must provide:
 * - config: Settings page configuration
 * - handleSettingsAction: Action handler (save, restore, etc.)
 */
@Directive()
export abstract class ConfigDrivenSettingsPage extends BasePageClass {
  protected readonly i18n = inject(I18nService);
  protected readonly language = signal(this.i18n.getCurrentLanguage());

  abstract readonly config: SettingsPageConfig;

  headerConfig: PageHeaderConfig = { title: '' };
  readonly activeTab = signal<string>('');

  readonly tabs = computed<TabItem[]>(() => {
    this.language();
    return this.config.tabs.map((tab) => this.mapTab(tab));
  });

  readonly leftActions = computed<ButtonListItem[]>(() => {
    this.language();
    return (this.config.actions?.left ?? []).map((action) => this.mapAction(action));
  });

  readonly rightActions = computed<ButtonListItem[]>(() => {
    this.language();
    return (this.config.actions?.right ?? []).map((action) => this.mapAction(action));
  });

  protected override onPageInit(): void {
    this.activeTab.set(this.config.defaultTabId ?? this.config.tabs[0]?.id ?? '');
    this.updateHeader();

    this.i18n.onLanguageChange()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.language.set(lang);
        this.updateHeader();
      });

    this.onSettingsInit();
  }

  protected onSettingsInit(): void {
    // Optional hook for subclasses.
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.onSettingsTabChange(tabId);
  }

  protected onSettingsTabChange(_tabId: string): void {
    // Optional hook for subclasses.
  }

  onActionClick(actionId: string): void {
    this.handleSettingsAction(actionId);
  }

  protected abstract handleSettingsAction(actionId: string): void;

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

  private mapTab(tab: SettingsTabConfig): TabItem {
    return {
      id: tab.id,
      label: this.t(tab.labelKey),
      icon: tab.icon,
      disabled: tab.disabled,
      badge: tab.badgeKey ? this.t(tab.badgeKey) : undefined,
    };
  }

  private mapAction(action: SettingsActionConfig): ButtonListItem {
    return {
      id: action.id,
      label: this.t(action.labelKey),
      icon: action.icon,
      ariaLabel: action.ariaLabelKey ? this.t(action.ariaLabelKey) : undefined,
      tooltip: action.tooltipKey ? this.t(action.tooltipKey) : undefined,
      variant: action.variant,
      disabled: action.disabled,
      active: action.active,
      loading: action.loading,
      visible: action.visible,
    };
  }

  protected t(key: string): string {
    return this.i18n.instant(key);
  }
}
