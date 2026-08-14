import { InjectionToken } from '@angular/core';

/**
 * Port d'audit pour les adaptateurs d'intégration — appartient à la PLATEFORME.
 *
 * La plateforme déclare ce dont elle a besoin ; l'application hôte fournit
 * l'implémentation au démarrage (inversion de dépendance).
 */
export interface IntegrationAuditPort {
  log(
    action: string,
    entityType: string,
    entityId: string,
    entityRef: string,
    detail?: string,
    userName?: string,
  ): void;
}

export const INTEGRATION_AUDIT_PORT = new InjectionToken<IntegrationAuditPort>(
  'INTEGRATION_AUDIT_PORT',
);

/**
 * Repli silencieux : un adaptateur ne doit jamais échouer parce que l'audit n'est pas
 * câblé. Utilisé par défaut si l'application n'a rien fourni.
 */
export const NOOP_INTEGRATION_AUDIT: IntegrationAuditPort = {
  log: () => undefined,
};
