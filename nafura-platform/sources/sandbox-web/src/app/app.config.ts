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

import { APP_ROUTES, SandboxNoReuseStrategy } from './app.routes';
import { SANDBOX_FR } from './i18n/sandbox-fr';

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
