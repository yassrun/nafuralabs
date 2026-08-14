import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { DocumentAuditZoneConfig } from '../../../types';

@Component({
  selector: 'nf-document-audit-placeholder',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="nf-doc-zone" aria-label="History">
      <div class="nf-doc-zone__head">
        <mat-icon>history</mat-icon>
        <span>{{ zoneConfig()?.title ?? 'History' }}</span>
      </div>
      @if (zoneConfig()?.binding) {
        <p class="nf-doc-zone__meta">Binding: {{ zoneConfig()?.binding }}</p>
      }
      <p class="nf-doc-zone__hint">
        Audit timeline and workflow history hook up here without embedding domain rules in the shell.
      </p>
      <ng-content></ng-content>
    </section>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 20px;
    }
    .nf-doc-zone {
      padding: 16px;
      border-radius: 8px;
      border: 1px dashed var(--nf-border-default, #d1d5db);
      background: var(--nf-surface-subtle, #fafafa);
    }
    .nf-doc-zone__head {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--nf-text-primary, #111827);
    }
    .nf-doc-zone__head mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--nf-text-secondary, #6b7280);
    }
    .nf-doc-zone__meta {
      margin: 6px 0 0;
      font-size: 0.75rem;
      font-family: ui-monospace, monospace;
      color: var(--nf-text-secondary, #6b7280);
    }
    .nf-doc-zone__hint {
      margin: 8px 0 0;
      font-size: 0.8125rem;
      color: var(--nf-text-secondary, #6b7280);
    }
  `,
})
export class DocumentAuditPlaceholderComponent {
  readonly zoneConfig = input<DocumentAuditZoneConfig | null>(null);
}
