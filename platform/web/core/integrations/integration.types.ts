/**
 * Types communs aux intégrations externes (DGI, CNSS, banques, OMPIC, WhatsApp).
 *
 * Convention : chaque adaptateur expose une interface stable + 2 modes :
 *  - MOCK : simule succès/échec localement (utilisable en démo, dev, CI).
 *  - PROD : appelle l'API réelle (à brancher quand identifiants disponibles).
 *
 * Cf. roadmap Round 2 §16-integrations (M-INT-01..09).
 */

/** Mode d'exécution d'un adaptateur d'intégration. */
export type IntegrationMode = 'MOCK' | 'PROD';

/** État final d'un appel à un adaptateur d'intégration. */
export type IntegrationCallStatus = 'SUCCES' | 'ECHEC' | 'EN_ATTENTE';

/** Résultat normalisé retourné par tout adaptateur d'intégration. */
export interface IntegrationCallResult<TPayload = unknown> {
  status: IntegrationCallStatus;
  /** Référence accusé (numéro télédéclaration, ticket, message id...). */
  accuse?: string;
  /** Code erreur fournisseur si échec. */
  errorCode?: string;
  /** Message lisible côté UI. */
  message?: string;
  /** Données structurées retournées (relevé bancaire, autocomplete OMPIC, etc.). */
  data?: TPayload;
  /** Horodatage ISO de la réponse. */
  timestamp: string;
  /** Mode dans lequel l'appel a tourné (utile pour audit). */
  mode: IntegrationMode;
}

/** Paramètres communs d'authentification d'un adaptateur. */
export interface IntegrationAuthConfig {
  /** URL de base de l'API (placeholder en mock). */
  baseUrl?: string;
  /** Token / clé d'API. */
  token?: string;
  /** Certificat client (PEM ou identifiant slot). */
  clientCertId?: string;
  /** Identifiant affilié / contribuable. */
  affilieId?: string;
}

/** Adaptateur de notification générique (utilisé par WhatsApp, email, push...). */
export interface NotificationChannelAdapter {
  envoyerNotification(
    destinataire: string,
    template: string,
    variables: Record<string, string>,
  ): Promise<IntegrationCallResult>;
}

/** Helper interne : génère une référence d'accusé déterministe-aléatoire (mock). */
export function buildMockAccuse(prefix: string): string {
  const y = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${y}-${seq}`;
}

/** Helper interne : horodatage ISO. */
export function nowIso(): string {
  return new Date().toISOString();
}
