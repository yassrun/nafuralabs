import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import type { DocumentAttachmentZoneConfig } from '../../../types';

@Component({
  selector: 'nf-document-attachment-placeholder',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="nf-doc-zone" aria-label="Attachments">
      <div class="nf-doc-zone__head">
        <mat-icon>attach_file</mat-icon>
        <span>{{ zoneConfig()?.title ?? 'Attachments' }}</span>
      </div>
      <p class="nf-doc-zone__hint">
        Attachment upload and linking are wired per document type (API / collaboration module).
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
    .nf-doc-zone__hint {
      margin: 8px 0 0;
      font-size: 0.8125rem;
      color: var(--nf-text-secondary, #6b7280);
    }
  `,
})
export class DocumentAttachmentPlaceholderComponent {
  readonly zoneConfig = input<DocumentAttachmentZoneConfig | null>(null);
}
