import { InjectionToken, Type } from '@angular/core';
import { Routes } from '@angular/router';

/**
 * Points d'extension du shell — appartiennent à la PLATEFORME.
 *
 * Le shell importait directement des composants de l'ERP (`SocieteSwitcherComponent`,
 * `ErpNotificationCenterAlertsComponent`, widgets d'onboarding) et les routes
 * d'administration chargeaient en dur des pages `@applications/*`. La plateforme déclare
 * désormais des emplacements nommés ; l'application y enregistre ce qu'elle veut y voir.
 * Voir `products/sektor-btp/docs/epics/front-ownership/`.
 *
 * Un emplacement sans extension enregistrée ne rend rien — la plateforme reste
 * fonctionnelle seule.
 */
export type ShellSlot =
  /** En-tête, à gauche du sélecteur de langue (ex. sélecteur de société). */
  | 'header-tenant-switcher'
  /** Bandeau d'alertes du centre de notifications. */
  | 'notification-center-alerts';

export interface ShellExtension {
  readonly slot: ShellSlot;
  readonly component: Type<unknown>;
}

export const SHELL_EXTENSIONS = new InjectionToken<readonly ShellExtension[]>(
  'SHELL_EXTENSIONS',
);

/**
 * Widgets d'onboarding fournis par l'application.
 *
 * Un port plutôt qu'un emplacement statique : le shell les chargeait paresseusement
 * derrière `environment.onboardingV2Enabled`. Le port préserve à la fois le découpage de
 * bundle et le drapeau — l'application décide quand et si elle les charge.
 */
export interface OnboardingWidgets {
  readonly inviteBanner: Type<unknown>;
  readonly completenessMeter: Type<unknown>;
}

export interface OnboardingWidgetsPort {
  /** `null` si l'application ne fournit pas ces widgets ou si le drapeau est éteint. */
  load(): Promise<OnboardingWidgets | null>;
}

export const ONBOARDING_WIDGETS_PORT = new InjectionToken<OnboardingWidgetsPort>(
  'ONBOARDING_WIDGETS_PORT',
);

/**
 * Routes contribuées par l'application à une zone de la plateforme.
 *
 * `administration.routes.ts` chargeait en dur des pages de l'ERP (société, paramètres
 * fiscaux, réinitialisation de démo). Elle fusionne désormais ce que l'application déclare.
 */
export type RouteZone = 'administration';

export interface RouteContribution {
  readonly zone: RouteZone;
  readonly routes: Routes;
}

export const APP_ROUTE_CONTRIBUTIONS = new InjectionToken<readonly RouteContribution[]>(
  'APP_ROUTE_CONTRIBUTIONS',
);

/** Routes contribuées pour une zone — utilisable hors contexte d'injection. */
export function routesForZone(
  contributions: readonly RouteContribution[] | null,
  zone: RouteZone,
): Routes {
  return (contributions ?? []).filter((c) => c.zone === zone).flatMap((c) => c.routes);
}
