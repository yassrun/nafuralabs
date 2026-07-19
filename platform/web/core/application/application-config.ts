/**
 * Contrat de configuration applicative — appartient à la PLATEFORME.
 *
 * Inversion de dépendance : la plateforme définit ce dont elle a besoin, l'application
 * le fournit au démarrage. Avant cette bascule, dix fichiers de `core/` importaient
 * `@applications/config/routes`, ce qui rendait la plateforme incompilable sans l'ERP
 * Sektor. Voir `products/sektor-btp/docs/epics/front-ownership/`.
 *
 * Pourquoi un registre de module et non un `InjectionToken` : ces valeurs sont des
 * constantes calculées une fois depuis le hostname, et elles sont lues depuis des gardes
 * de route et des corps de méthode répartis dans des classes volumineuses
 * (`auth.facade.ts` fait plus de mille lignes). Un jeton d'injection aurait imposé de
 * modifier une dizaine de constructeurs pour une valeur qui ne varie jamais à l'exécution.
 * Le registre garde le diff minimal et le comportement strictement identique.
 *
 * Toutes les lectures se font dans des corps de fonction, jamais au niveau module : au
 * moment où la plateforme appelle `applicationConfig()`, l'application a déjà exécuté
 * `registerApplicationConfig()` depuis son `app.config.ts`.
 */
export interface ApplicationConfig {
  /** Identifiant de l'application active (ex. `erp`). */
  readonly applicationId: string;
  /** Route par défaut après authentification. */
  readonly defaultRoute: string;
  /** L'application est-elle multi-tenant ? */
  readonly requiresTenant: boolean;
}

const FALLBACK_ROUTE = 'feature-unavailable/unknown';

let current: ApplicationConfig | null = null;

/** Appelé par l'application au chargement de son `app.config.ts`. */
export function registerApplicationConfig(config: ApplicationConfig): void {
  current = config;
}

/**
 * Configuration de l'application hôte.
 *
 * Lève si aucune application ne s'est enregistrée : mieux vaut un échec net au démarrage
 * qu'une redirection silencieuse vers une route par défaut arbitraire.
 */
export function applicationConfig(): ApplicationConfig {
  if (!current) {
    throw new Error(
      'Aucune application enregistrée. Appeler registerApplicationConfig() ' +
        'depuis app.config.ts avant le bootstrap.',
    );
  }
  return current;
}

/** Route par défaut, avec repli — le motif le plus fréquent côté plateforme. */
export function applicationDefaultRoute(): string {
  return applicationConfig().defaultRoute || FALLBACK_ROUTE;
}

/** L'application active est-elle multi-tenant ? */
export function applicationRequiresTenant(): boolean {
  return applicationConfig().requiresTenant;
}

/** Réservé aux tests : remet le registre à zéro. */
export function resetApplicationConfigForTests(): void {
  current = null;
}
