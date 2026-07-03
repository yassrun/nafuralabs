export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  eventAt: string;
  details?: string;
  payload?: Record<string, unknown>;
}
