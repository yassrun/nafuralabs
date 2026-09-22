import {
  ApplicationConfig,
  APP_INITIALIZER,
  importProvidersFrom,
  inject,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { registerApplicationConfig } from '@platform/core/application/application-config';
import { provideAppLucideIcons } from '@platform/core/icons/app-lucide-icons';
import {
  LISTING_SAVED_VIEWS_ADAPTER,
  LocalStorageListingSavedViewsAdapter,
} from '@platform/lib/anatomy/components/organisms/listing-flat';

import { environment } from '../environments/environment';

import { APP_ROUTES, SandboxNoReuseStrategy } from './app.routes';
import { SandboxTranslateLoader } from './i18n/sandbox-fr';
import { buildSandboxNavigation } from './sandbox-shell.component';
import { provideAppShell } from '@platform/platform/app-shell';
import { SANDBOX_CONTEXT_SLOTS } from './shell/sandbox-context-slots';
import { providePlatformIdentity } from '@platform/platform/identity';
import { labAuthInterceptor, provideLabAuth } from '@platform/platform/lab-auth';
import { USER_SETTINGS_CONFIG } from '@platform/features/user-settings/user-settings.token';
import { TENANT_SETTINGS_CONFIG } from '@platform/features/app-settings/app-settings.token';
import { DEFAULT_APP_SHELL_CONFIG } from '@platform/core/shell/platform-app-shell.types';

registerApplicationConfig({
  applicationId: 'anatomy-sandbox',
  defaultRoute: '/',
  requiresTenant: false,
});

function bootstrapSandboxContext(): () => Promise<void> {
  const translate = inject(TranslateService);
  return async () => {
    translate.setDefaultLang('fr');
    translate.use('fr');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Sync animations: avoid CDK HighContrastModeDetector NG0203 with Material menus/dialogs.
    provideAnimations(),
    provideHttpClient(withInterceptors([labAuthInterceptor])),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    { provide: RouteReuseStrategy, useClass: SandboxNoReuseStrategy },
    provideAppLucideIcons(),
    providePlatformIdentity({ mode: 'sandbox-keycloak-mock' }),
    ...provideLabAuth({
      usersUrl: '/api/public/sandbox/users',
      sessionUrl: '/api/public/sandbox/session',
      productName: 'Sandbox',
      storageKey: 'sandbox.lab.session',
    }),
    provideAppShell({
      product: { name: 'Anatomy', tagline: 'Platform lab' },
      topBar: { enabled: true, pageContext: true },
      sidebar: { enabled: true, navigation: buildSandboxNavigation() },
      userMenu: {
        enabled: true,
        userSettings: true,
      },
      tenantMenu: {
        enabled: true,
        tenantSettings: true,
        tenantSettingsRoute: '/organization/settings',
        organizationIdentity: true,
        organizationIdentityRoute: '/organization/identity',
        fallbackName: 'Sandbox',
        fallbackKey: 'sandbox',
      },
      notifications: { enabled: true },
      ai: { enabled: true },
      contextRail: {
        enabled: true,
        storageKey: 'sandbox.nafura.business-contexts',
        admin: { label: 'Admin', route: '/', icon: 'shield' },
        slots: SANDBOX_CONTEXT_SLOTS,
      },
    }),
    {
      provide: USER_SETTINGS_CONFIG,
      useValue: DEFAULT_APP_SHELL_CONFIG.modules.userSettings,
    },
    {
      provide: TENANT_SETTINGS_CONFIG,
      useValue: DEFAULT_APP_SHELL_CONFIG.modules.tenantSettings,
    },
    {
      provide: LISTING_SAVED_VIEWS_ADAPTER,
      useFactory: () =>
        new LocalStorageListingSavedViewsAdapter(
          'nf-listing-saved-views',
          environment.devAuthUser.id
        ),
    },
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapSandboxContext,
      multi: true,
    },
    importProvidersFrom(
      MatDialogModule,
      MatSnackBarModule,
      TranslateModule.forRoot({
        defaultLanguage: 'fr',
        loader: { provide: TranslateLoader, useClass: SandboxTranslateLoader },
      })
    ),
  ],
};
