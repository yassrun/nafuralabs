import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ConfigDrivenSettingsPage,
  ConfigDrivenSettingsPageImports,
  ConfigDrivenSettingsPageStyles,
  ToastService,
} from '@lib/anatomy';
import { TranslateService } from '@ngx-translate/core';
import type { SettingsPageConfig } from '@lib/anatomy/types';
import { AuthFacade } from '@core/security/services/auth.facade';
import { ThemeModeService } from '@core/theme/theme-mode.service';

import { USER_SETTINGS_CONFIG } from './user-settings.token';
import {
  UserSettingsApiService,
  UserProfileSettings,
  UserPreferencesSettings,
  UserNotificationSettings,
  ActiveSession,
} from './models';
import { ProfileSectionComponent } from './sections/profile/profile.section';
import { PreferencesSectionComponent } from './sections/preferences/preferences.section';
import { PREFERENCES_LOCALE_OPTIONS } from './sections/preferences/preferences.config';
import { AppSettingsApiService } from '../app-settings/models';
import { GENERAL_TIMEZONE_OPTIONS } from '../app-settings/sections/general/general.config';
import {
  SecuritySectionComponent,
  ChangePasswordPayload,
} from './sections/security/security.section';
import { NotificationsSectionComponent } from './sections/notifications/notifications.section';

type UserSettingsTabId =
  | 'profile'
  | 'preferences'
  | 'security'
  | 'notifications';

@Component({
  selector: 'app-user-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ...ConfigDrivenSettingsPageImports,
    ProfileSectionComponent,
    PreferencesSectionComponent,
    SecuritySectionComponent,
    NotificationsSectionComponent,
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
          @case ('profile') {
            <app-user-profile-section
              [data]="profile()"
              [email]="userEmail()"
              [loading]="profileLoading()"
              [saving]="profileSaving()"
              (save)="onProfileSave($event)">
            </app-user-profile-section>
          }
          @case ('preferences') {
            <app-user-preferences-section
              [data]="preferences()"
              [localeOptions]="localeOptions"
              [timezoneOptions]="timezoneOptions"
              [tenantHint]="preferencesTenantHint()"
              [loading]="preferencesLoading()"
              [saving]="preferencesSaving()"
              (save)="onPreferencesSave($event)">
            </app-user-preferences-section>
          }
          @case ('security') {
            <app-user-security-section
              [phase1]="securityPhase1()"
              [sessions]="sessions()"
              [loading]="securityLoading()"
              [savingPassword]="securitySavingPassword()"
              [revokingSessionId]="revokingSessionId()"
              (changePassword)="onChangePassword($event)"
              (revoke)="onRevokeSession($event)">
            </app-user-security-section>
          }
          @case ('notifications') {
            <app-user-notifications-section
              [data]="notifications()"
              [loading]="notificationsLoading()"
              [saving]="notificationsSaving()"
              (save)="onNotificationsSave($event)">
            </app-user-notifications-section>
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
export class UserSettingsPage extends ConfigDrivenSettingsPage {
  private readonly api = inject(UserSettingsApiService);
  private readonly appSettings = inject(AppSettingsApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);
  private readonly moduleConfig = inject(USER_SETTINGS_CONFIG);
  private readonly themeMode = inject(ThemeModeService);

  readonly localeOptions = PREFERENCES_LOCALE_OPTIONS;
  readonly timezoneOptions = GENERAL_TIMEZONE_OPTIONS;
  /** Tenant defaults for "Defaults to organization setting" hint; null = use defaultOption label */
  readonly preferencesTenantHint = signal<{
    locale?: string | null;
    timezone?: string | null;
    theme?: string | null;
    dateFormat?: string | null;
  } | null>(null);

  readonly userEmail = computed(() => this.auth.user()?.email ?? '');

  readonly profile = signal<UserProfileSettings | null>(null);
  readonly preferences = signal<UserPreferencesSettings | null>(null);
  readonly notifications = signal<UserNotificationSettings | null>(null);
  readonly sessions = signal<ActiveSession[]>([]);

  readonly profileLoading = signal(false);
  readonly profileSaving = signal(false);

  readonly preferencesLoading = signal(false);
  readonly preferencesSaving = signal(false);

  readonly notificationsLoading = signal(false);
  readonly notificationsSaving = signal(false);

  /** When true, security tab shows "coming soon" and makes no API calls (Phase 1). */
  readonly securityPhase1 = signal(true);
  readonly securityLoading = signal(false);
  readonly securitySavingPassword = signal(false);
  readonly revokingSessionId = signal<string | null>(null);

  readonly config: SettingsPageConfig = this.buildConfig();

  protected override onSettingsInit(): void {
    const requestedTab = this.getQueryParam('section') as UserSettingsTabId | null;
    if (requestedTab && this.availableTabs().includes(requestedTab)) {
      this.activeTab.set(requestedTab);
    }
    void this.loadSection(this.activeTab() as UserSettingsTabId);
  }

  protected override onSettingsTabChange(tabId: string): void {
    if (tabId !== 'preferences') {
      const saved = this.preferences();
      const theme = saved?.theme ?? 'system';
      this.themeMode.applyMode(theme);
      this.themeMode.persistMode(theme);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: tabId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    void this.loadSection(tabId as UserSettingsTabId);
  }

  protected override handleSettingsAction(actionId: string): void {
    console.log('Unhandled settings action:', actionId);
  }

  async onProfileSave(
    payload: import('./models').UserProfileUpdatePayload
  ): Promise<void> {
    this.profileSaving.set(true);
    try {
      const saved = await firstValueFrom(this.api.updateProfile(payload));
      this.profile.set(saved);
      this.auth.updateUserProfile({
        firstName: saved.firstName,
        lastName: saved.lastName,
        displayName: saved.displayName ?? undefined,
        avatarUrl: saved.avatarUrl ?? undefined,
        phone: saved.phone ?? undefined,
      });
      this.toast.success(this.translate.instant('userSettings.profile.save.success'));
    } catch (error) {
      this.toast.error(this.translate.instant('userSettings.profile.save.error'));
    } finally {
      this.profileSaving.set(false);
    }
  }

  async onPreferencesSave(payload: UserPreferencesSettings): Promise<void> {
    this.preferencesSaving.set(true);
    try {
      const saved = await firstValueFrom(this.api.updatePreferences(payload));
      this.preferences.set(saved);
      if (saved.locale != null) {
        await firstValueFrom(this.i18n.useLanguage(saved.locale));
      }
      const theme = saved.theme ?? 'system';
      this.themeMode.applyMode(theme);
      this.themeMode.persistMode(theme);
      this.toast.success(this.translate.instant('userSettings.preferences.save.success'));
    } catch (error) {
      this.toast.error(this.translate.instant('userSettings.preferences.save.error'));
    } finally {
      this.preferencesSaving.set(false);
    }
  }

  async onNotificationsSave(
    payload: UserNotificationSettings
  ): Promise<void> {
    this.notificationsSaving.set(true);
    try {
      const saved = await firstValueFrom(this.api.updateNotifications(payload));
      this.notifications.set(saved);
      this.toast.success(this.translate.instant('userSettings.notifications.save.success'));
    } catch (error) {
      this.toast.error('Failed to update notifications.');
    } finally {
      this.notificationsSaving.set(false);
    }
  }

  async onChangePassword(payload: ChangePasswordPayload): Promise<void> {
    this.securitySavingPassword.set(true);
    try {
      await firstValueFrom(this.api.changePassword(payload));
      this.toast.success('Password changed successfully.');
    } catch (error) {
      this.toast.error('Failed to change password.');
    } finally {
      this.securitySavingPassword.set(false);
    }
  }

  async onRevokeSession(sessionId: string): Promise<void> {
    this.revokingSessionId.set(sessionId);
    try {
      await firstValueFrom(this.api.revokeSession(sessionId));
      const remaining = this.sessions().filter((item) => item.id !== sessionId);
      this.sessions.set(remaining);
      this.toast.success('Session revoked.');
    } catch (error) {
      this.toast.error('Failed to revoke session.');
    } finally {
      this.revokingSessionId.set(null);
    }
  }

  private buildConfig(): SettingsPageConfig {
    const tabs: SettingsPageConfig['tabs'] = [];

    if (this.moduleConfig.sections?.profile?.enabled) {
      tabs.push({
        id: 'profile',
        labelKey: 'userSettings.tabs.profile',
        icon: 'person',
      });
    }
    if (this.moduleConfig.sections?.preferences?.enabled) {
      tabs.push({
        id: 'preferences',
        labelKey: 'userSettings.tabs.preferences',
        icon: 'tune',
      });
    }
    if (this.moduleConfig.sections?.security?.enabled) {
      tabs.push({
        id: 'security',
        labelKey: 'userSettings.tabs.security',
        icon: 'shield',
      });
    }
    if (this.moduleConfig.sections?.notifications?.enabled) {
      tabs.push({
        id: 'notifications',
        labelKey: 'userSettings.tabs.notifications',
        icon: 'notifications',
      });
    }

    return {
      headerTitleKey: 'core.topbar.mySettings',
      headerSubtitleKey: 'userSettings.subtitle',
      headerIcon: 'person',
      tabs,
      defaultTabId: tabs[0]?.id,
    };
  }

  private availableTabs(): UserSettingsTabId[] {
    return this.config.tabs.map((tab) => tab.id as UserSettingsTabId);
  }

  private async loadSection(tab: UserSettingsTabId): Promise<void> {
    switch (tab) {
      case 'profile':
        if (this.profile()) return;
        await this.loadProfile();
        return;
      case 'preferences':
        if (this.preferences()) return;
        await this.loadPreferences();
        return;
      case 'security':
        if (this.sessions().length > 0) return;
        await this.loadSessions();
        return;
      case 'notifications':
        if (this.notifications()) return;
        await this.loadNotifications();
        return;
      default:
        return;
    }
  }

  private async loadProfile(): Promise<void> {
    this.profileLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getProfile());
      this.profile.set(data);
    } catch (error) {
      this.toast.error('Failed to load profile settings.');
    } finally {
      this.profileLoading.set(false);
    }
  }

  private async loadPreferences(): Promise<void> {
    this.preferencesLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getPreferences());
      this.preferences.set(data);
      const theme = data.theme ?? 'system';
      this.themeMode.applyMode(theme);
      this.themeMode.persistMode(theme);
      await this.loadTenantDefaultsHint();
    } catch (error) {
      this.toast.error(this.translate.instant('userSettings.preferences.load.error'));
    } finally {
      this.preferencesLoading.set(false);
    }
  }

  /** Load org defaults from App Settings for "Defaults to …" hints. Non-blocking if user lacks permission. */
  private async loadTenantDefaultsHint(): Promise<void> {
    try {
      const [general, localization] = await Promise.all([
        firstValueFrom(this.appSettings.getGeneral()),
        firstValueFrom(this.appSettings.getLocalization()),
      ]);
      this.preferencesTenantHint.set({
        locale: localization?.defaultLocale ?? null,
        timezone: general?.timezone ?? null,
        dateFormat: localization?.dateFormat ?? null,
        theme: null,
      });
    } catch {
      this.preferencesTenantHint.set(null);
    }
  }

  private async loadNotifications(): Promise<void> {
    this.notificationsLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getNotifications());
      this.notifications.set(data);
    } catch (error) {
      this.toast.error('Failed to load notification settings.');
    } finally {
      this.notificationsLoading.set(false);
    }
  }

  private async loadSessions(): Promise<void> {
    this.securityLoading.set(true);
    try {
      const data = await firstValueFrom(this.api.getSessions());
      this.sessions.set(data);
    } catch (error) {
      this.toast.error('Failed to load active sessions.');
    } finally {
      this.securityLoading.set(false);
    }
  }
}
