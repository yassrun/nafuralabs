/**
 * App Configuration
 * 
 * Main application configuration for Angular 19.
 * Registers all module sidebar declarations with the core.
 */

import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeFrMA from '@angular/common/locales/fr-MA';

registerLocaleData(localeFr);
registerLocaleData(localeFrMA, 'fr-MA');
import { provideRouter, withComponentInputBinding, withPreloading, NoPreloading } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  TranslateLoader,
  TranslateService,
  TranslateStore,
  TranslateCompiler,
  TranslateParser,
  TranslateDefaultParser,
  MissingTranslationHandler,
  FakeMissingTranslationHandler,
  USE_STORE,
  USE_DEFAULT_LANG,
  USE_EXTEND,
  DEFAULT_LANGUAGE,
} from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

import {
  createModuleTranslateLoader,
  TranslationLayersConfig,
} from '@platform/core/i18n/i18n.module-loader';
import { I18N_CONFIG } from '@platform/core/i18n/i18n.config';
import { ACTIVE_TRANSLATION_LAYERS } from '@applications/config/i18n';

// Import routes
import { APP_ROUTES } from './app.routes';

// Import auth facade for initialization
import { AuthFacade } from '@platform/core/security/services/auth.facade';
import { I18nService } from '@platform/core/i18n/i18n.service';
import { LocaleService } from '@platform/core/i18n/locale.service';
import { provideDynamicLocaleId } from '@platform/core/i18n/locale-id.factory';

// Import HTTP interceptors
import {
  authTokenInterceptor,
  bindAuthTokenInterceptorDeps,
} from '@platform/core/http/auth-token.interceptor';
import { AuthStateStore } from '@platform/core/security/state/auth.state';
import { tenantHeaderInterceptor } from '@platform/core/http/tenant-header.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { APP_SHELL_CONFIG } from '@applications/config/shell.config';
import { ADMINISTRATION_CONFIG } from '@platform/features/administration/administration.token';
import { USER_SETTINGS_CONFIG } from '@platform/features/user-settings/user-settings.token';
import { APP_SETTINGS_CONFIG } from '@platform/features/app-settings/app-settings.token';
import { ErpNotificationsService } from '@applications/erp/shell/erp-notifications.service';
import { NotificationStreamService } from '@platform/features/collaboration/notification/services/notification-stream.service';
import { NotificationUnreadService } from '@platform/features/collaboration/notification/services/notification-unread.service';
import { environment } from '../src/environments/environment';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { provideAppLucideIcons } from '@platform/core/icons/app-lucide-icons';
import { SEKTOR_PLATFORM_PROVIDERS } from './config/platform-bindings';

/**
 * Factory function for APP_INITIALIZER.
 * Initializes auth and i18n before the app starts.
 */
function initializeApp(): () => Promise<void> {
  const auth = inject(AuthFacade);
  const authState = inject(AuthStateStore);
  bindAuthTokenInterceptorDeps(auth, authState);
  const i18n = inject(I18nService);
  const locale = inject(LocaleService);
  const erpNotif = inject(ErpNotificationsService);
  const notifStream = inject(NotificationStreamService);
  const unreadNotif = inject(NotificationUnreadService);

  return async () => {
    locale.init();
    await auth.initialize();
    i18n.initialize();
    if (auth.isAuthenticated()) {
      await i18n.loadRemoteLanguagePreference();
      notifStream.subscribe((event) => {
        if (event.type === 'refresh') {
          void erpNotif.refresh();
          void unreadNotif.refresh();
        } else if (event.type === 'new_notification') {
          void unreadNotif.refresh();
        }
      });
      notifStream.connect();
      await erpNotif.refresh();
      erpNotif.startPolling();
    }
  };
}

const TRANSLATION_LAYERS: TranslationLayersConfig = ACTIVE_TRANSLATION_LAYERS;

/**
 * Application configuration.
 * 
 * This is where modules register themselves with the platform.
 * Each module provides its sidebar declaration via multi-provider.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideAppLucideIcons(),

    // Locale MAD / fr-MA — dynamique : LOCALE_ID lit la préférence persistée
    // au bootstrap (cf. locale-id.factory.ts). Currency = MAD (constant Round 1).
    ...provideDynamicLocaleId(),

    // Angular 19 core providers
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    // Material DateAdapter required by MatDatepicker (used in entity-detail / form / extraction workspace)
    provideNativeDateAdapter(),
    // Chart.js (ng2-charts) for dashboard and reporting
    provideCharts(withDefaultRegisterables()),
    // PrimeNG (Aura theme – used e.g. in filter-bar; Material kept elsewhere)
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    provideHttpClient(
      withInterceptors([
        authTokenInterceptor,    // Add Authorization Bearer token to all requests
        tenantHeaderInterceptor // Add X-Tenant-Id header to all requests
      ])
    ),
    
    // Router with Angular 19 features
    provideRouter(
      APP_ROUTES,
      withComponentInputBinding(),  // Enable @Input() from route params
      withPreloading(NoPreloading)  // Keep route chunks lazy unless explicitly requested
      // withViewTransitions() retiré : l'API View Transitions levait
      // "InvalidStateError: Transition was aborted" et gelait le rendu sur
      // les transitions/overlays rapides (wizard, onglets, "Ajouter un lot").
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // App Initialization
    // 
    // Initialize auth and i18n before the app starts.
    // This ensures guards have access to auth state on first load.
    // ─────────────────────────────────────────────────────────────────────────
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // I18n Configuration
    // 
    // Configure translation service with layered lazy-loading.
    // Provides all necessary dependencies for TranslateService.
    // ─────────────────────────────────────────────────────────────────────────
    {
      provide: TranslateLoader,
      useFactory: (http: HttpClient) => createModuleTranslateLoader(http, TRANSLATION_LAYERS),
      deps: [HttpClient],
    },
    {
      provide: TranslateCompiler,
      useClass: TranslateMessageFormatCompiler,
    },
    {
      provide: TranslateParser,
      useClass: TranslateDefaultParser,
    },
    {
      provide: MissingTranslationHandler,
      useClass: FakeMissingTranslationHandler,
    },
    TranslateStore,
    {
      provide: USE_STORE,
      useValue: false, // Use shared store (not isolated)
    },
    {
      provide: USE_DEFAULT_LANG,
      useValue: true, // Use default language as fallback
    },
    {
      provide: USE_EXTEND,
      useValue: false, // Don't extend translations
    },
    {
      provide: DEFAULT_LANGUAGE,
      useValue: I18N_CONFIG.defaultLanguage,
    },
    TranslateService,

    // Platform module config tokens (app-scoped).
    {
      provide: ADMINISTRATION_CONFIG,
      useValue: APP_SHELL_CONFIG.modules.administration,
    },
    {
      provide: USER_SETTINGS_CONFIG,
      useValue: APP_SHELL_CONFIG.modules.userSettings,
    },
    {
      provide: APP_SETTINGS_CONFIG,
      useValue: APP_SHELL_CONFIG.modules.appSettings,
    },

    ...SEKTOR_PLATFORM_PROVIDERS,

  ],
};


