import {
  ApplicationConfig,
  APP_INITIALIZER,
  importProvidersFrom,
  inject,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { registerApplicationConfig } from '@platform/core/application/application-config';
import { provideAppLucideIcons } from '@platform/core/icons/app-lucide-icons';
import { TenantContextService } from '@platform/core/tenant/tenant.context';
import {
  LISTING_SAVED_VIEWS_ADAPTER,
  LocalStorageListingSavedViewsAdapter,
} from '@platform/lib/anatomy/components/organisms/listing-flat';

import { environment } from '../environments/environment';

import { APP_ROUTES, SandboxNoReuseStrategy } from './app.routes';
import { SANDBOX_FR } from './i18n/sandbox-fr';
import { buildSandboxNavigation } from './sandbox-shell.component';
import { provideAppShell } from '@platform/platform/app-shell';
import { providePlatformIdentity } from '@platform/platform/identity';

registerApplicationConfig({
  applicationId: 'anatomy-sandbox',
  defaultRoute: '/',
  requiresTenant: false,
});

class SandboxTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, unknown>> {
    return of(SANDBOX_FR as unknown as Record<string, unknown>);
  }
}

function bootstrapSandboxContext(): () => Promise<void> {
  return async () => {
    const translate = inject(TranslateService);
    translate.setDefaultLang('fr');
    translate.use('fr');
    // Seed a lab tenant so smart-import orchestrator can pass the tenant gate.
    await inject(TenantContextService).initialize('sandbox');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Sync animations: avoid CDK HighContrastModeDetector NG0203 with Material menus/dialogs.
    provideAnimations(),
    provideHttpClient(),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    { provide: RouteReuseStrategy, useClass: SandboxNoReuseStrategy },
    provideAppLucideIcons(),
    providePlatformIdentity({ mode: 'sandbox-keycloak-mock' }),
    provideAppShell({
      product: { name: 'Anatomy', tagline: 'Platform lab' },
      topBar: { enabled: true, pageContext: true },
      sidebar: { enabled: true, navigation: buildSandboxNavigation(), userMenu: true },
      notifications: { enabled: true },
    }),
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
