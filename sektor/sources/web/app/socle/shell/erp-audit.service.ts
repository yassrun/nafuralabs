import { Injectable, inject } from '@angular/core';
import { AuditApiService } from '@platform/features/collaboration/audit';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'EXPORT'
  | 'PRINT'
  | 'LOGIN'
  | 'LOGOUT';

/** CRUD is owned by the backend {@code @Auditable} hook. Front only posts workflow / export. */
const BACKEND_OWNED = new Set<AuditAction>(['CREATE', 'UPDATE', 'DELETE']);

const ENTITY_TYPE_ALIASES: Record<string, string> = {
  AO: 'appel-offre-achat',
  AVENANT: 'avenant',
  BC: 'bon-commande-achat',
  BUDGET: 'chantier',
  CHANTIER: 'chantier',
  CONGE: 'conge',
  CONTRAT: 'contrat-marche',
  DA: 'demande-achat',
  DEVIS: 'devis',
  DUER: 'duer',
  EMPLOYE: 'employe',
  FACTURE: 'facture-client',
  INCIDENT: 'incident',
  INSPECTION: 'inspection',
  NC: 'non-conformite',
  PAIE: 'fiche-paie',
  SITUATION: 'situation-travaux',
};

/**
 * Host implementation of the platform integration audit port.
 * Writes to {@code audit_events} via the platform API — no localStorage journal.
 */
@Injectable({ providedIn: 'root' })
export class ErpAuditService {
  private readonly api = inject(AuditApiService);

  log(
    action: AuditAction,
    entityType: string,
    entityId: string,
    entityRef: string,
    detail?: string,
    _userName = 'Utilisateur courant',
  ): void {
    if (BACKEND_OWNED.has(action)) {
      return;
    }
    if (!entityId || entityId === '—') {
      return;
    }
    const type = ENTITY_TYPE_ALIASES[entityType] ?? kebab(entityType);
    this.api
      .logAudit(type, entityId, action.toLowerCase(), detail, { entityRef })
      .subscribe({ error: () => undefined });
  }
}

function kebab(value: string): string {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}
