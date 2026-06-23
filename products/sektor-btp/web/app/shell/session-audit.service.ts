import { Injectable, computed, signal } from '@angular/core';

/**
 * Session & Login Audit Service — M-ADM-02.
 *
 * Mock-only : tracking authentification + sessions actives, persisté en localStorage.
 * Branchera plus tard sur l'IAM platform (`/api/v1/auth/login`, `/sessions`).
 *
 * Modèle :
 *   - `LoginAttempt` : événement d'authentification (succès / échec) — historique.
 *   - `ActiveSession` : session vivante actuellement ouverte — peut être tuée
 *     (force logout) depuis l'UI.
 */

const STORAGE_KEY_LOGINS = 'nafura-session-logins';
const STORAGE_KEY_SESSIONS = 'nafura-session-active';
const MAX_LOGINS = 200;

export type LoginOutcome = 'SUCCESS' | 'FAILED' | 'TIMEOUT';
export type FailureReason =
  | 'BAD_PASSWORD'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_LOCKED'
  | 'MFA_FAILED'
  | 'IP_BLOCKED'
  | 'EXPIRED_TOKEN';

export interface LoginAttempt {
  id: string;
  timestamp: string;
  userName: string;
  outcome: LoginOutcome;
  failureReason?: FailureReason;
  ip: string;
  browser: string;
  /** Géolocalisation approximative (ville, pays). */
  location: string;
}

export interface ActiveSession {
  id: string;
  userName: string;
  startedAt: string;
  lastActivityAt: string;
  ip: string;
  browser: string;
  location: string;
  /** Marqué `true` si tué via `forceLogout` (n'apparaît plus dans `activeSessions()`). */
  terminated?: boolean;
  terminatedAt?: string;
  terminatedBy?: string;
}

// @i18n-exempt — @deprecated Phase 1.2 — see FAILURE_REASON_KEYS in @applications/erp/shell/i18n-labels.
export const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  BAD_PASSWORD: 'Mot de passe erroné',
  USER_NOT_FOUND: 'Utilisateur inconnu',
  ACCOUNT_LOCKED: 'Compte verrouillé',
  MFA_FAILED: 'MFA invalide',
  IP_BLOCKED: 'IP bloquée',
  EXPIRED_TOKEN: 'Token expiré',
};

// @i18n-exempt — @deprecated Phase 1.2 — see OUTCOME_KEYS in @applications/erp/shell/i18n-labels.
export const OUTCOME_LABELS: Record<LoginOutcome, string> = {
  SUCCESS: 'Succès',
  FAILED: 'Échec',
  TIMEOUT: 'Timeout',
};

// ─── Seeds réalistes pour la démo ────────────────────────────────────────────

function buildSeedLogins(): LoginAttempt[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  return [
    { id: 'lg-001', timestamp: hoursAgo(1),   userName: 'karim.elidrissi',  outcome: 'SUCCESS', ip: '197.230.45.12', browser: 'Chrome 120 / Windows 11', location: 'Casablanca, MA' },
    { id: 'lg-002', timestamp: hoursAgo(2),   userName: 'amal.bennani',     outcome: 'SUCCESS', ip: '105.66.8.219',  browser: 'Safari 17 / macOS 14',    location: 'Rabat, MA' },
    { id: 'lg-003', timestamp: hoursAgo(3),   userName: 'hicham.bennani',   outcome: 'SUCCESS', ip: '41.249.122.7',  browser: 'Firefox 121 / Ubuntu',    location: 'Marrakech, MA' },
    { id: 'lg-004', timestamp: hoursAgo(4),   userName: 'hicham.bennani',   outcome: 'FAILED',  failureReason: 'BAD_PASSWORD', ip: '41.249.122.7', browser: 'Firefox 121 / Ubuntu', location: 'Marrakech, MA' },
    { id: 'lg-005', timestamp: hoursAgo(6),   userName: 'mehdi.saadi',      outcome: 'SUCCESS', ip: '197.230.99.43', browser: 'Chrome 120 / Android',    location: 'Tanger, MA' },
    { id: 'lg-006', timestamp: hoursAgo(8),   userName: 'unknown.user',     outcome: 'FAILED',  failureReason: 'USER_NOT_FOUND', ip: '185.220.101.45', browser: 'curl 7.81', location: 'Inconnue (Tor exit)' },
    { id: 'lg-007', timestamp: hoursAgo(9),   userName: 'unknown.user',     outcome: 'FAILED',  failureReason: 'USER_NOT_FOUND', ip: '185.220.101.45', browser: 'curl 7.81', location: 'Inconnue (Tor exit)' },
    { id: 'lg-008', timestamp: hoursAgo(9),   userName: 'unknown.user',     outcome: 'FAILED',  failureReason: 'IP_BLOCKED', ip: '185.220.101.45', browser: 'curl 7.81', location: 'Inconnue (Tor exit)' },
    { id: 'lg-009', timestamp: hoursAgo(12),  userName: 'rachid.alaoui',    outcome: 'SUCCESS', ip: '105.66.42.18',  browser: 'Edge 120 / Windows 11',   location: 'Agadir, MA' },
    { id: 'lg-010', timestamp: hoursAgo(15),  userName: 'omar.tazi',        outcome: 'SUCCESS', ip: '197.230.45.78', browser: 'Chrome 120 / macOS 14',   location: 'Casablanca, MA' },
    { id: 'lg-011', timestamp: hoursAgo(18),  userName: 'amal.bennani',     outcome: 'FAILED',  failureReason: 'MFA_FAILED', ip: '105.66.8.219',  browser: 'Safari 17 / macOS 14', location: 'Rabat, MA' },
    { id: 'lg-012', timestamp: hoursAgo(20),  userName: 'amal.bennani',     outcome: 'SUCCESS', ip: '105.66.8.219',  browser: 'Safari 17 / macOS 14', location: 'Rabat, MA' },
    { id: 'lg-013', timestamp: hoursAgo(24),  userName: 'younes.tazi',      outcome: 'SUCCESS', ip: '197.230.45.91', browser: 'Chrome 120 / iOS 17',     location: 'Casablanca, MA' },
    { id: 'lg-014', timestamp: hoursAgo(28),  userName: 'karim.elidrissi',  outcome: 'TIMEOUT', ip: '197.230.45.12', browser: 'Chrome 120 / Windows 11', location: 'Casablanca, MA' },
    { id: 'lg-015', timestamp: hoursAgo(36),  userName: 'mehdi.saadi',      outcome: 'SUCCESS', ip: '197.230.99.43', browser: 'Chrome 120 / Android',    location: 'Tanger, MA' },
  ];
}

function buildSeedSessions(): ActiveSession[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  return [
    { id: 'ses-001', userName: 'karim.elidrissi', startedAt: hoursAgo(1),  lastActivityAt: minutesAgo(2),  ip: '197.230.45.12', browser: 'Chrome 120 / Windows 11', location: 'Casablanca, MA' },
    { id: 'ses-002', userName: 'amal.bennani',    startedAt: hoursAgo(2),  lastActivityAt: minutesAgo(15), ip: '105.66.8.219',  browser: 'Safari 17 / macOS 14',    location: 'Rabat, MA' },
    { id: 'ses-003', userName: 'hicham.bennani',  startedAt: hoursAgo(3),  lastActivityAt: minutesAgo(45), ip: '41.249.122.7',  browser: 'Firefox 121 / Ubuntu',    location: 'Marrakech, MA' },
    { id: 'ses-004', userName: 'mehdi.saadi',     startedAt: hoursAgo(6),  lastActivityAt: minutesAgo(90), ip: '197.230.99.43', browser: 'Chrome 120 / Android',    location: 'Tanger, MA' },
  ];
}

function loadLogins(): LoginAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGINS);
    if (!raw) return buildSeedLogins();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as LoginAttempt[];
  } catch {
    /* noop */
  }
  return buildSeedLogins();
}

function loadSessions(): ActiveSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return buildSeedSessions();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as ActiveSession[];
  } catch {
    /* noop */
  }
  return buildSeedSessions();
}

function persist(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

@Injectable({ providedIn: 'root' })
export class SessionAuditService {
  private readonly _logins = signal<LoginAttempt[]>(loadLogins());
  private readonly _sessions = signal<ActiveSession[]>(loadSessions());

  readonly loginAttempts = this._logins.asReadonly();
  readonly allSessions = this._sessions.asReadonly();

  readonly activeSessions = computed<ActiveSession[]>(() =>
    this._sessions().filter((s) => !s.terminated),
  );

  /** Sessions tuées (force logout) — affichable comme historique. */
  readonly terminatedSessions = computed<ActiveSession[]>(() =>
    this._sessions().filter((s) => s.terminated),
  );

  /** Stats : succès / échec dernières 24h / sessions actives. */
  readonly stats = computed(() => {
    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const recent = this._logins().filter((l) => Date.parse(l.timestamp) >= dayAgo);
    const totalSuccess24h = recent.filter((l) => l.outcome === 'SUCCESS').length;
    const totalFailed24h = recent.filter((l) => l.outcome === 'FAILED').length;
    const totalTimeout24h = recent.filter((l) => l.outcome === 'TIMEOUT').length;
    return {
      activeSessions: this.activeSessions().length,
      totalSuccess24h,
      totalFailed24h,
      totalTimeout24h,
      uniqueUsers24h: new Set(recent.map((l) => l.userName)).size,
      suspiciousIps24h: new Set(
        recent
          .filter((l) => l.outcome === 'FAILED')
          .reduce<string[]>((acc, l) => {
            const failsByIp = recent.filter((x) => x.ip === l.ip && x.outcome === 'FAILED').length;
            if (failsByIp >= 3) acc.push(l.ip);
            return acc;
          }, []),
      ).size,
    };
  });

  /**
   * Force logout d'une session active.
   * Retourne `true` si la session a été tuée, `false` si déjà tuée ou introuvable.
   */
  forceLogout(sessionId: string, terminatedBy = 'Admin'): boolean {
    const session = this._sessions().find((s) => s.id === sessionId);
    if (!session || session.terminated) return false;
    const next = this._sessions().map((s) =>
      s.id === sessionId
        ? {
            ...s,
            terminated: true,
            terminatedAt: new Date().toISOString(),
            terminatedBy,
          }
        : s,
    );
    this._sessions.set(next);
    persist(STORAGE_KEY_SESSIONS, next);
    // Audit l'événement comme un LOGOUT forcé.
    this.logAttempt({
      userName: session.userName,
      outcome: 'TIMEOUT',
      ip: session.ip,
      browser: session.browser,
      location: session.location,
      failureReason: undefined,
    });
    return true;
  }

  /**
   * Ajoute un événement d'auth (utilisé par le tracking en background).
   */
  logAttempt(input: Omit<LoginAttempt, 'id' | 'timestamp'>): LoginAttempt {
    const entry: LoginAttempt = {
      id: `lg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...input,
    };
    const next = [entry, ...this._logins()].slice(0, MAX_LOGINS);
    this._logins.set(next);
    persist(STORAGE_KEY_LOGINS, next);
    return entry;
  }

  /** QA/test helper — restaure les seeds, purge le localStorage. */
  reset(): void {
    this._logins.set(buildSeedLogins());
    this._sessions.set(buildSeedSessions());
    try {
      localStorage.removeItem(STORAGE_KEY_LOGINS);
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
    } catch {
      /* noop */
    }
  }
}
