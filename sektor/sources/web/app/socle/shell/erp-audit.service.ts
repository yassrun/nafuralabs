import { Injectable, signal, computed, inject } from '@angular/core';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'SUBMIT' | 'EXPORT' | 'PRINT' | 'LOGIN' | 'LOGOUT';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userName: string;
  action: AuditAction;
  entityType: string;   // 'BC', 'FACTURE', 'SITUATION', 'AVENANT', 'CONGE', etc.
  entityId: string;
  entityRef: string;    // numéro lisible
  detail?: string;      // champ modifié ou montant
}

const STORAGE_KEY = 'nafura-erp-audit-log';
const MAX_ENTRIES = 500;

// @i18n-exempt — @deprecated Phase 1.2 — TODO Wave C: migrate to centralised `enum.*` keys (B2 phase only delivered the keys file + JSON for prescribed maps).
const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE:  'Création',
  UPDATE:  'Modification',
  DELETE:  'Suppression',
  APPROVE: 'Approbation',
  REJECT:  'Rejet',
  SUBMIT:  'Soumission',
  EXPORT:  'Export',
  PRINT:   'Impression',
  LOGIN:   'Connexion',
  LOGOUT:  'Déconnexion',
};

function loadFromStorage(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : buildSeedAudit();
  } catch { return buildSeedAudit(); }
}

function buildSeedAudit(): AuditEntry[] {
  const seed: AuditEntry[] = [
    { id: 'aud-001', timestamp: '2026-05-09T08:30:00', userName: 'Karim El Idrissi', action: 'APPROVE', entityType: 'BC', entityId: 'bc001', entityRef: 'BC-2026-00001', detail: 'Approuvé (DG) — 285 000 MAD' },
    { id: 'aud-002', timestamp: '2026-05-09T09:15:00', userName: 'Amal Bennani', action: 'CREATE', entityType: 'FACTURE', entityId: 'fm-003', entityRef: 'FM-2026-00003', detail: 'Montant net à payer : 5 826 327 MAD' },
    { id: 'aud-003', timestamp: '2026-05-09T10:00:00', userName: 'Hicham Bennani', action: 'SUBMIT', entityType: 'BC', entityId: 'bc007', entityRef: 'BC-2026-00007', detail: 'Soumis pour approbation — 420 000 MAD' },
    { id: 'aud-004', timestamp: '2026-05-08T16:45:00', userName: 'Mehdi Saadi', action: 'UPDATE', entityType: 'AVANCEMENT', entityId: 'av-lot-03', entityRef: 'CH-2025-001 / Lot 03', detail: 'Avancement 0% → 8%' },
    { id: 'aud-005', timestamp: '2026-05-08T14:20:00', userName: 'Karim El Idrissi', action: 'CREATE', entityType: 'AVENANT', entityId: 'av-003', entityRef: 'AV-MAR-2026-001-03', detail: 'Adaptation technique — −350 000 MAD' },
    { id: 'aud-006', timestamp: '2026-05-08T11:30:00', userName: 'Rachid Alaoui', action: 'CREATE', entityType: 'DA', entityId: 'da003', entityRef: 'DA-2026-0003', detail: 'Agrégats béton — 32 000 MAD' },
    { id: 'aud-007', timestamp: '2026-05-07T17:00:00', userName: 'Amal Bennani', action: 'EXPORT', entityType: 'FACTURE', entityId: 'fm-002', entityRef: 'FM-2026-00002', detail: 'Export CSV — listing factures' },
    { id: 'aud-008', timestamp: '2026-05-07T09:00:00', userName: 'Omar Tazi', action: 'LOGIN', entityType: 'SESSION', entityId: 'ses-20260507', entityRef: 'Session DG' },
    { id: 'aud-009', timestamp: '2026-05-06T15:30:00', userName: 'Hicham Bennani', action: 'APPROVE', entityType: 'SITUATION', entityId: 'sit-007', entityRef: 'SIT-CH-2026-002-007', detail: 'Situation validée MOA — 16 000 000 MAD' },
    { id: 'aud-010', timestamp: '2026-05-05T10:15:00', userName: 'Younes Tazi', action: 'CREATE', entityType: 'CONGE', entityId: 'cng-001', entityRef: 'CNG-2026-0001', detail: 'Congé annuel 01/07 → 21/07' },
  ];
  return seed;
}

@Injectable({ providedIn: 'root' })
export class ErpAuditService {
  private readonly _entries = signal<AuditEntry[]>(loadFromStorage());

  readonly entries = this._entries.asReadonly();

  readonly recentEntries = computed(() => this._entries().slice(0, 50));

  readonly actionLabels = ACTION_LABELS;

  log(
    action: AuditAction,
    entityType: string,
    entityId: string,
    entityRef: string,
    detail?: string,
    userName = 'Utilisateur courant',
  ): void {
    const entry: AuditEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName,
      action,
      entityType,
      entityId,
      entityRef,
      detail,
    };
    this._entries.update(list => {
      const updated = [entry, ...list].slice(0, MAX_ENTRIES);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  actionLabel(action: AuditAction): string { return ACTION_LABELS[action] ?? action; }

  getByEntityType(type: string): AuditEntry[] {
    return this._entries().filter(e => e.entityType === type);
  }

  clear(): void {
    this._entries.set(buildSeedAudit());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
}
