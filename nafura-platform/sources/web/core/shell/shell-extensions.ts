import { InjectionToken, Type } from '@angular/core';
import { Routes } from '@angular/router';

/**
 * Points d'extension du shell — appartiennent à la PLATEFORME.
 *
 * Deux familles :
 * - Slots produit (vides sans extension) : tenant switcher, alertes métier.
 * - Slots chrome (défaut plateforme, override optionnel) : user, notif, IA.
 */
export type ShellSlot =
  /** En-tête, à gauche du sélecteur de langue (ex. sélecteur de société). */
  | 'header-tenant-switcher'
  /** @deprecated Le menu utilisateur est désormais rendu dans le footer de sidebar. */
  | 'header-user-menu'
  /** Remplace le menu utilisateur plateforme dans le footer de sidebar. */
  | 'sidebar-user-menu'
  /** Remplace la cloche de notifications plateforme. */
  | 'header-notifications'
  /** Remplace le bouton IA plateforme. L'override injecte AiPanelService. */
  | 'header-ai'
  /** Bandeau d'alertes du centre de notifications. */
  | 'notification-center-alerts';

export interface ShellExtension {
  readonly slot: ShellSlot;
  readonly component: Type<unknown>;
}

export const SHELL_EXTENSIONS = new InjectionToken<readonly ShellExtension[]>(
  'SHELL_EXTENSIONS',
);

/** First component registered for a slot, or null if the app did not override it. */
export function componentForSlot(
  extensions: readonly ShellExtension[] | null | undefined,
  slot: ShellSlot,
): Type<unknown> | null {
  return (extensions ?? []).find((e) => e.slot === slot)?.component ?? null;
}

/**
 * Widgets d'onboarding fournis par l'application.
 *
 * Un port plutôt qu'un emplacement statique : le shell les chargeait paresseusement
 * derrière `environment.onboardingV2Enabled`. Le port préserve à la fois le découpage de
 * bundle et le drapeau — l'application décide quand et si elle les charge.
 */
export interface OnboardingWidgets {
  /** Absent = bandeau d'invitation collègues non affiché (réactiver plus tard). */
  readonly inviteBanner?: Type<unknown>;
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
 * La plateforme fusionne ce que l'application déclare via APP_ROUTE_CONTRIBUTIONS.
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
