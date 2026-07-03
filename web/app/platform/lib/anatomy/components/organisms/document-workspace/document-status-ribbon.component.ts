import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { DocumentStatusRibbonConfig, DocumentStatusSeverity } from '../../../types';
import { getValueAtPath } from './get-at-path';

@Component({
  selector: 'nf-document-status-ribbon',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (resolved(); as r) {
      <div class="nf-doc-status" [attr.data-severity]="r.severity">
        @if (config()?.label) {
          <span class="nf-doc-status__label">{{ config()?.label }}</span>
        }
        <span class="nf-doc-status__chip">{{ r.label }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .nf-doc-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-surface-subtle, #f9fafb);
      margin-bottom: 16px;
    }
    .nf-doc-status__label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--nf-text-secondary, #6b7280);
    }
    .nf-doc-status__chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .nf-doc-status[data-severity='success'] .nf-doc-status__chip {
      background: rgba(34, 197, 94, 0.15);
      color: #15803d;
    }
    .nf-doc-status[data-severity='danger'] .nf-doc-status__chip {
      background: rgba(239, 68, 68, 0.12);
      color: #b91c1c;
    }
    .nf-doc-status[data-severity='warning'] .nf-doc-status__chip {
      background: rgba(245, 158, 11, 0.15);
      color: #b45309;
    }
    .nf-doc-status[data-severity='info'] .nf-doc-status__chip {
      background: rgba(59, 130, 246, 0.12);
      color: #1d4ed8;
    }
    .nf-doc-status[data-severity='neutral'] .nf-doc-status__chip {
      background: rgba(107, 114, 128, 0.15);
      color: var(--nf-text-primary, #374151);
    }
  `,
})
export class DocumentStatusRibbonComponent {
  readonly config = input<DocumentStatusRibbonConfig | null>(null);
  readonly document = input<unknown | null>(null);

  readonly resolved = computed(() => {
    const cfg = this.config();
    const doc = this.document();
    if (!cfg?.statusFieldPath || doc == null) return null;
    const raw = getValueAtPath(doc, cfg.statusFieldPath);
    const str = raw != null ? String(raw) : '';
    const states = cfg.states ?? [];
    const match = states.find((s) => s.value === str);
    const label = match?.label ?? (str || '—');
    const severity: DocumentStatusSeverity = match?.severity ?? 'neutral';
    return { label, severity };
  });
}
