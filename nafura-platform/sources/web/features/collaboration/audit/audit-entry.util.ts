import type { TranslateService } from '@ngx-translate/core';
import type { AuditEventDto } from './services/audit-api.service';

export interface AuditFieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/** True when payload.changes is a single `status` field change. */
export function isStatusOnlyPayload(payload: Record<string, unknown> | undefined | null): boolean {
  const changes = payload?.['changes'];
  if (!Array.isArray(changes) || changes.length !== 1) return false;
  const field = (changes[0] as { field?: unknown })?.field;
  return field != null && String(field) === 'status';
}

/** Normalize update+status-only (legacy rows) to status_change for verbs and filters. */
export function effectiveAuditAction(action: string, payload?: Record<string, unknown> | null): string {
  if (action === 'status_change') return 'status_change';
  if (action === 'update' && isStatusOnlyPayload(payload ?? undefined)) return 'status_change';
  return action;
}

export function auditChanges(payload: Record<string, unknown> | undefined | null): AuditFieldChange[] {
  const raw = payload?.['changes'];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as { field?: unknown; from?: unknown; to?: unknown };
      if (r.field == null) return null;
      return { field: String(r.field), from: r.from, to: r.to };
    })
    .filter((c): c is AuditFieldChange => c != null);
}

export function auditSnapshot(payload: Record<string, unknown> | undefined | null): Record<string, unknown> | null {
  const snap = payload?.['snapshot'];
  if (!snap || typeof snap !== 'object' || Array.isArray(snap)) return null;
  return snap as Record<string, unknown>;
}

export function auditFieldLabel(translate: TranslateService, field: string): string {
  const key = `audit.fields.${field}`;
  const label = translate.instant(key);
  return label !== key ? label : field;
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function buildAuditDetailsLine(
  e: Pick<AuditEventDto, 'action' | 'payload' | 'details'>,
  translate: TranslateService,
): string | undefined {
  const action = effectiveAuditAction(e.action, e.payload);
  const changes = auditChanges(e.payload);
  if (changes.length > 0) {
    if (action === 'status_change' && changes.length === 1 && changes[0].field === 'status') {
      return `${formatAuditValue(changes[0].from)} → ${formatAuditValue(changes[0].to)}`;
    }
    return changes
      .map((c) => `${auditFieldLabel(translate, c.field)}: ${formatAuditValue(c.from)} → ${formatAuditValue(c.to)}`)
      .join(', ');
  }
  return e.details ?? undefined;
}
