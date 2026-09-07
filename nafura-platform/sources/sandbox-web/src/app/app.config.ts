import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { registerApplicationConfig } from '@platform/core/application/application-config';
import { provideAppLucideIcons } from '@platform/core/icons/app-lucide-icons';

import { APP_ROUTES, SandboxNoReuseStrategy } from './app.routes';

registerApplicationConfig({
  applicationId: 'anatomy-sandbox',
  defaultRoute: '/',
  requiresTenant: false,
});

class EmptyTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, string>> {
    return of({});
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    { provide: RouteReuseStrategy, useClass: SandboxNoReuseStrategy },
    provideAppLucideIcons(),
    importProvidersFrom(
      MatDialogModule,
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: { provide: TranslateLoader, useClass: EmptyTranslateLoader },
      })
    ),
  ],
};
