import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditTrailComponent, type AuditTrailEntry } from '../audit-trail/audit-trail.component';
import type { WidgetConfig, ActivityWidgetConfig as ActivityConfig, ActivityWidgetData } from './widget.types';

@Component({
  selector: 'nf-activity-widget',
  standalone: true,
  imports: [CommonModule, AuditTrailComponent],
  template: `
    <div class="nf-activity-widget">
      <nf-audit-trail
        [entries]="entries()"
        [title]="config().title"
        [searchEnabled]="false"
        [emptyLabel]="'No recent activity'"
      />
    </div>
  `,
  styles: [
    `
      .nf-activity-widget {
        min-height: 120px;
      }
    `,
  ],
})
export class ActivityWidgetComponent {
  config = input.required<WidgetConfig>();
  /** API response (generic; component treats as ActivityWidgetData) */
  data = input<unknown>(null);

  widgetConfig = computed(() => this.config().config as ActivityConfig);

  entries = computed<AuditTrailEntry[]>(() => {
    const raw = this.data();
    const d = raw as Record<string, unknown> | null;
    const cfg = this.widgetConfig();
    const max = cfg.maxItems ?? 10;
    if (!d) return [];
    const direct = d['entries'];
    if (Array.isArray(direct)) {
      return direct.slice(0, max) as AuditTrailEntry[];
    }
    const content = d['content'];
    if (Array.isArray(content)) {
      return content.slice(0, max).map((e: Record<string, unknown>) => mapAuditContentToEntry(e));
    }
    return [];
  });
}

/** Map Spring audit log response content item to AuditTrailEntry. */
function mapAuditContentToEntry(e: Record<string, unknown>): AuditTrailEntry {
  const action = String(e['action'] ?? '');
  const meta = ACTION_META[action] ?? { icon: 'edit_note', iconClass: 'nf-audit-trail__icon-wrap--gray' };
  const entityType = e['entityType'] as string | undefined;
  const entityId = e['entityId'] as string | undefined;
  const target = entityType && entityId ? `${entityType}#${entityId}` : entityType ?? undefined;
  return {
    id: String(e['id'] ?? ''),
    actor: String(e['actor'] ?? ''),
    action,
    at: String(e['eventAt'] ?? e['at'] ?? ''),
    target,
    details: e['details'] != null ? String(e['details']) : undefined,
    icon: meta.icon,
    iconClass: meta.iconClass,
  };
}

const ACTION_META: Record<string, { icon: string; iconClass: string }> = {
  create: { icon: 'add_circle', iconClass: 'nf-audit-trail__icon-wrap--green' },
  update: { icon: 'edit', iconClass: 'nf-audit-trail__icon-wrap--blue' },
  status_change: { icon: 'arrow_forward', iconClass: 'nf-audit-trail__icon-wrap--amber' },
  delete: { icon: 'delete', iconClass: 'nf-audit-trail__icon-wrap--red' },
  publish: { icon: 'send', iconClass: 'nf-audit-trail__icon-wrap--green' },
  approve: { icon: 'check_circle', iconClass: 'nf-audit-trail__icon-wrap--green' },
  reject: { icon: 'cancel', iconClass: 'nf-audit-trail__icon-wrap--red' },
  assign: { icon: 'person_add', iconClass: 'nf-audit-trail__icon-wrap--blue' },
  comment: { icon: 'comment', iconClass: 'nf-audit-trail__icon-wrap--gray' },
  attach: { icon: 'attach_file', iconClass: 'nf-audit-trail__icon-wrap--gray' },
};
