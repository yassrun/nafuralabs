import {
  APP_INITIALIZER,
  type EnvironmentProviders,
  importProvidersFrom,
  inject,
  makeEnvironmentProviders,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { type CanActivateFn, provideRouter, Router, type Routes, withComponentInputBinding } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateCompiler, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { type Observable, of } from 'rxjs';

import { registerApplicationConfig } from '../../core/application/application-config';
import { ACCESS_REFRESH } from '../../core/security/access-refresh.token';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import { FrMatPaginatorIntl } from '../../core/i18n/fr-mat-paginator-intl';
import { provideDynamicLocaleId } from '../../core/i18n/locale-id.factory';
import { provideAppLucideIcons } from '../../core/icons/app-lucide-icons';
import { DEFAULT_APP_SHELL_CONFIG } from '../../core/shell/platform-app-shell.types';
import { ADMINISTRATION_CONFIG } from '../../features/administration/administration.token';
import { registerEntityRoutes } from '../../features/approvals/config/entity-type-routes.config';
import { TENANT_SETTINGS_CONFIG } from '../../features/app-settings/app-settings.token';
import { USER_SETTINGS_CONFIG } from '../../features/user-settings/user-settings.token';
import { APP_SHELL_ACCESS, provideAppShell } from '../app-shell/app-shell.config';
import { PLATFORM_CAPABILITY_MANIFESTS } from '../capability-catalog';
import { providePlatformIdentity } from '../identity';
import { LabAuthService, LabLoginPage, labAuthGuard, labAuthInterceptor, provideLabAuth } from '../lab-auth';
import type { ApplicationManifest, BusinessContextManifest, NafuraManifest } from '../manifest';
import { assertNafuraManifestsValid } from '../manifest-validator';
import { businessContextDomain, projectApplicationConfig, projectAppShellConfig } from '../manifest-projection';
import capabilityCatalog from '../../../../capabilities.json';
import { type CapabilityCatalog, type HostPlan, planHost, readApplicationManifest } from './host-plan';
import { hostScreens } from './host-screens';
import { NafuraHostShellComponent } from './nafura-host-shell.component';
import platformFr from './i18n/fr.json';

class PlatformTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<Record<string, unknown>> {
    return of(platformFr as Record<string, unknown>);
  }
}

function planFrom(app: unknown, businessContexts: readonly BusinessContextManifest[]): HostPlan {
  const application = readApplicationManifest(app);
  assertNafuraManifestsValid([...PLATFORM_CAPABILITY_MANIFESTS, application, ...businessContexts] as NafuraManifest[]);
  return planHost(application, businessContexts, capabilityCatalog as CapabilityCatalog);
}

function authProviders(application: ApplicationManifest) {
  const auth = application.spec.runtime?.auth;
  if (auth?.mode !== 'lab' || !auth.sessionUrl || !auth.usersUrl) {
    throw new Error(`Application "${application.metadata.id}": host v1 mounts only runtime.auth.mode "lab" with sessionUrl and usersUrl.`);
  }
  return [
    providePlatformIdentity({ mode: 'sandbox-keycloak-mock' }),
    ...provideLabAuth({
      usersUrl: auth.usersUrl,
      sessionUrl: auth.sessionUrl,
      productName: application.spec.product?.name ?? application.metadata.id,
      productMark: application.spec.product?.mark,
      storageKey: `${application.metadata.id}.lab.session`,
      homePath: application.spec.runtime?.defaultRoute,
    }),
  ];
}

/** What a business context gives the host: its manifest and the routes mounted under `routesPrefix`. */
export interface HostBusinessContext {
  readonly manifest: BusinessContextManifest;
  readonly routes: Routes;
  /** Record routes by entity type (`demo.purchase-request` → `/demo/purchase-requests/{id}`): approvals link to them. */
  readonly records?: Readonly<Record<string, string>>;
}

function businessContextRoutes(contexts: readonly HostBusinessContext[]): Routes {
  return contexts.map(({ manifest, routes }) => {
    const prefix = manifest.spec.routesPrefix?.replace(/^\/+|\/+$/g, '');
    if (!prefix) {
      throw new Error(`Business context "${manifest.metadata.id}" has no spec.routesPrefix to mount its routes.`);
    }
    return { path: prefix, canActivate: [businessContextEnabled(manifest)], children: routes };
  });
}

/** A business context the organization switched off is not reachable, even by URL (its API refuses too). */
function businessContextEnabled(manifest: BusinessContextManifest): CanActivateFn {
  const domain = businessContextDomain(manifest.metadata.id);
  const label = manifest.spec.label ?? manifest.metadata.id;
  return async () => {
    // inject() only works before the first await.
    const auth = inject(LabAuthService);
    const toast = inject(ToastService);
    const router = inject(Router);
    await auth.ensureSession();
    if (!auth.disabledDomains().has(domain)) return true;
    toast.warning(`${label} est désactivé pour votre organisation.`);
    return router.parseUrl('/');
  };
}

/** Routes of a host app: lab login, then the platform shell with every enabled capability and business context. */
export function nafuraHostRoutes(app: unknown, businessContexts: readonly HostBusinessContext[] = []): Routes {
  const screens = hostScreens(planFrom(app, businessContexts.map((context) => context.manifest)).capabilities);
  const home = screens.homePath;

  return [
    { path: 'login', component: LabLoginPage },
    {
      path: '',
      component: NafuraHostShellComponent,
      canActivate: [labAuthGuard],
      children: [
        ...screens.routes,
        ...businessContextRoutes(businessContexts),
        ...(home ? [{ path: '', pathMatch: 'full' as const, redirectTo: home }] : []),
        { path: '**', redirectTo: '' },
      ],
    },
  ];
}

/** Everything a host app's `app.config.ts` used to wire by hand, derived from `app.nafura.json`. */
export function provideNafuraHost(
  app: unknown,
  businessContexts: readonly HostBusinessContext[] = [],
): EnvironmentProviders {
  const plan = planFrom(app, businessContexts.map((context) => context.manifest));
  const screens = hostScreens(plan.capabilities);
  registerApplicationConfig(projectApplicationConfig(plan.application));
  businessContexts.forEach((context) => registerEntityRoutes(context.records ?? {}));
  const locale = plan.application.spec.i18n?.locales[0] ?? 'fr';

  return makeEnvironmentProviders([
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHttpClient(withInterceptors([labAuthInterceptor])),
    provideRouter(nafuraHostRoutes(app, businessContexts), withComponentInputBinding()),
    provideAppLucideIcons(),
    ...provideDynamicLocaleId(),
    { provide: MatPaginatorIntl, useClass: FrMatPaginatorIntl },
    ...authProviders(plan.application),
    provideAppShell(projectAppShellConfig(plan.application, plan.businessContexts, screens.platform, screens.workspace)),
    { provide: APP_SHELL_ACCESS, useFactory: () => inject(LabAuthService).access },
    {
      provide: ACCESS_REFRESH,
      useFactory: () => {
        const auth = inject(LabAuthService);
        return () => auth.refreshAccess();
      },
    },
    { provide: USER_SETTINGS_CONFIG, useValue: DEFAULT_APP_SHELL_CONFIG.modules.userSettings },
    { provide: TENANT_SETTINGS_CONFIG, useValue: DEFAULT_APP_SHELL_CONFIG.modules.tenantSettings },
    {
      provide: ADMINISTRATION_CONFIG,
      useValue: { enabled: true, position: 'bottom', sections: screens.administrationSections },
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const translate = inject(TranslateService);
        const document = inject(DOCUMENT);
        const product = plan.application.spec.product;
        return () => {
          translate.setDefaultLang(locale);
          translate.use(locale);
          // The product names the tab and its icon once, in app.nafura.json.
          document.title = product?.name ?? plan.application.metadata.id;
          if (product?.mark) {
            const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.head.appendChild(document.createElement('link'));
            icon.rel = 'icon';
            icon.href = product.mark;
          }
        };
      },
    },
    importProvidersFrom(
      MatDialogModule,
      MatSnackBarModule,
      TranslateModule.forRoot({
        defaultLanguage: locale,
        loader: { provide: TranslateLoader, useClass: PlatformTranslateLoader },
        // Platform texts use ICU syntax: {name}, {count, plural, …}.
        compiler: { provide: TranslateCompiler, useClass: TranslateMessageFormatCompiler },
      }),
    ),
  ]);
}
