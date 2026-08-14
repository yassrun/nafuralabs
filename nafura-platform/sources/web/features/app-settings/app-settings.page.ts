import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenSettingsPage,
  ConfigDrivenSettingsPageImports,
  ConfigDrivenSettingsPageStyles,
  ToastService,
} from '@lib/anatomy';
import { ThemeService } from '@core/theme';
import type { SettingsPageConfig } from '@lib/anatomy/types';

import { APP_SETTINGS_CONFIG } from './app-settings.token';
import {
  LOCALE_OPTIONS,
  CURRENCY_OPTIONS,
} from './sections/localization/localization.config';
import {
  AppSettingsApiService,
  AppGeneralSettings,
  AppLocalizationSettings,
  AppBrandingSettings,
} from './models';
import { GeneralSectionComponent } from './sections/general/general.section';
import { GENERAL_TIMEZONE_OPTIONS } from './sections/general/general.config';
import { LocalizationSectionComponent } from './sections/localization/localization.section';
import { BrandingSectionComponent, BrandingSectionSavePayload } from './sections/branding/branding.section';

type AppSettingsTabId = 'general' | 'localization' | 'branding';

@Component({
  selector: 'app-app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ...ConfigDrivenSettingsPageImports,
    GeneralSectionComponent,
    LocalizationSectionComponent,
    BrandingSectionComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-tabs
        [tabs]="tabs()"
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)">
      </nf-tabs>

      <div class="nf-settings-content">
        @switch (activeTab()) {
          @case ('general') {
            <app-app-settings-general-section
              [data]="general()"
              [loading]="generalLoading()"
              [saving]="generalSaving()"
              [timezoneOptions]="timezoneOptions"
              (save)="onGeneralSave($event)">
            </app-app-settings-general-section>
          }
          @case ('localization') {
            <app-app-settings-localization-section
              [data]="localization()"
              [loading]="localizationLoading()"
              [saving]="localizationSaving()"
              [localeOptions]="localeOptions"
              [currencyOptions]="currencyOptions"
              (save)="onLocalizationSave($event)">
            </app-app-settings-localization-section>
          }
          @case ('branding') {
            <app-app-settings-branding-section
              [data]="branding()"
              [loading]="brandingLoading()"
              [saving]="brandingSaving()"
              (save)="onBrandingSave($event)">
            </app-app-settings-branding-section>
          }
        }
      </div>
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenSettingsPageStyles,
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class AppSettingsPage extends ConfigDrivenSettingsPage {
  private readonly api = inject(AppSettingsApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly moduleConfig = inject(APP_SETTINGS_CONFIG);
  private readonly themeService = inject(ThemeService);

  readonly localeOptions = [...LOCALE_OPTIONS];
  readonly timezoneOptions = [...GENERAL_TIMEZONE_OPTIONS];
  readonly currencyOptions = [...CURRENCY_OPTIONS];

  readonly general = signal<AppGeneralSettings | null>(null);
  readonly localization = signal<AppLocalizationSettings | null>(null);
  readonly branding = signal<AppBrandingSettings | null>(null);

  readonly generalLoading = signal(false);
  readonly generalSaving = signal(false);

  readonly localizationLoading = signal(false);
  readonly localizationSaving = signal(false);

  readonly brandingLoading = signal(false);
  readonly brandingSaving = signal(false);

  readonly config: SettingsPageConfig = this.buildConfig();

  protected override onSettingsInit(): void {
    const requestedTab = this.getQueryParam('section') as AppSettingsTabId | null;
    if (requestedTab && this.availableTabs().includes(requestedTab)) {
      this.activeTab.set(requestedTab);
    }
    void this.loadSection(this.activeTab() as AppSettingsTabId);
  }

  protected override onSettingsTabChange(tabId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: tabId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    void this.loadSection(tabId as AppSettingsTabId);
  }

  protected override handleSettingsAction(actionId: string): void {
    console.log('Unhandled settings action:', actionId);
  }

  async onGeneralSave(payload: AppGeneralSettings): Promise<void> {
    this.generalSaving.set(true);
    try {
      const saved = await firstValueFrom(this.api.updateGeneral(payload));
      this.general.set(saved);
      this.toast.success(this.translate.instant('appSettings.general.save.success'));
    } catch (error) {
      this.toast.error(this.translate.instant('appSettings.general.save.error'));
    } finally {
      this.generalSaving.set(false);
    }
  }

  async onLocalizationSave(payload: AppLocalizationSettings): Promise<void> {
    this.localizationSaving.set(true);
    try {
      const saved = await firstValueFrom(this.api.updateLocalization(payload));
      this.localization.set(saved);
      this.toast.success(this.translate.instant('appSettings.localization.save.success'));
    } catch (error) {
      this.toast.error(this.translate.instant('appSettings.localization.save.error'));
    } finally {
      this.localizationSaving.set(false);
    }
  }

  async onBrandingSave(payload: BrandingSectionSavePayload): Promise<void> {
    this.brandingSaving.set(true);
    try {
      const settings: AppBrandingSettings = { ...payload.settings };

      if (payload.logoFile) {
        const response = await firstValueFrom(this.api.uploadLogo(payload.logoFile));
        const url = this.extractUploadUrl(response);
        if (url) {
          settings.logoUrl = url;
        }
      }

      if (payload.faviconFile) {
        const response = await firstValueFrom(this.api.uploadFavicon(payload.faviconFile));
        const url = this.extractUploadUrl(response);
        if (url) {
          settings.faviconUrl = url;
        }
      }

      const saved = await firstValueFrom(this.api.updateBranding(settings));
      this.branding.set(saved);
      this.themeService.setBranding(saved);
      this.toast.success(this.translate.instant('appSettings.branding.save.success'));
    } catch (error) {
      this.toast.error(this.translate.instant('appSettings.branding.save.error'));
    } finally {
      this.brandingSaving.set(false);
    }
  }

  private buildConfig(): SettingsPageConfig {
    const tabs: SettingsPageConfig['tabs'] = [];

    if (this.moduleConfig.sections?.general?.enabled) {
      tabs.push({
        id: 'general',
        labelKey: 'appSettings.tabs.general',
        icon: 'tune',
      });
    }
    if (this.moduleConfig.sections?.localization?.enabled) {
      tabs.push({
        id: 'localization',
        labelKey: 'appSettings.tabs.localization',
        icon: 'language',
      });
    }
    if (this.moduleConfig.sections?.branding?.enabled) {
      tabs.push({
        id: 'branding',
        labelKey: 'appSettings.tabs.branding',
        icon: 'palette',
      });
    }

    return {
      headerTitleKey: 'core.topbar.appSettings',
      headerSubtitleKey: 'appSettings.subtitle',
      headerIcon: 'settings',
      tabs,
      defaultTabId: tabs[0]?.id,
    };
  }

  private availableTabs(): AppSettingsTabId[] {
    return this.config.tabs.map((tab) => tab.id as AppSettingsTabId);
  }

  private async loadSection(tab: AppSettingsTabId): Promise<void> {
    switch (tab) {
      case 'general':
        if (this.general()) return;
        await this.loadGeneral();
        return;
      case 'localization':
        if (this.localization()) return;
        await this.loadLocalization();
        return;
      case 'branding':
        if (this.branding()) return;
        await this.loadBranding();
        return;
      default:
        return;
    }
  }

  private async loadGeneral(): Promise<void> {
    this.generalLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getGeneral());
      this.general.set(data);
    } catch (error) {
      this.toast.error('Failed to load general settings.');
    } finally {
      this.generalLoading.set(false);
    }
  }

  private async loadLocalization(): Promise<void> {
    this.localizationLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getLocalization());
      this.localization.set(data);
    } catch (error) {
      this.toast.error('Failed to load localization settings.');
    } finally {
      this.localizationLoading.set(false);
    }
  }

  private async loadBranding(): Promise<void> {
    this.brandingLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getBranding());
      this.branding.set(data);
    } catch (error) {
      this.toast.error('Failed to load branding settings.');
    } finally {
      this.brandingLoading.set(false);
    }
  }

  private extractUploadUrl(payload: { url: string } | string): string | null {
    if (typeof payload === 'string') {
      return payload || null;
    }
    return payload.url || null;
  }
}
