import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type {
  DocumentActionEvent,
  DocumentActionUiConfig,
  DocumentAttachmentZoneConfig,
  DocumentAuditZoneConfig,
  DocumentStatusRibbonConfig,
  DocumentTotalsBlockConfig,
  DocumentWorkspaceFeatureFlags,
} from '../../../types';
import { DocumentStatusRibbonComponent } from './document-status-ribbon.component';
import { DocumentActionBarComponent } from './document-action-bar.component';
import { DocumentTotalsBlockComponent } from './document-totals-block.component';
import { DocumentAttachmentPlaceholderComponent } from './document-attachment-placeholder.component';
import { DocumentAuditPlaceholderComponent } from './document-audit-placeholder.component';

/**
 * Composes the transactional document regions: status, header slot, lines slot,
 * optional totals, document action bar, optional attachment and audit placeholders.
 *
 * Project regions with:
 * - `nfDocumentHeader`, `nfDocumentLines`
 * - optional `nfDocumentAttachments`, `nfDocumentAudit` inside the placeholders
 */
@Component({
  selector: 'nf-document-workspace-shell',
  standalone: true,
  imports: [
    CommonModule,
    DocumentStatusRibbonComponent,
    DocumentActionBarComponent,
    DocumentTotalsBlockComponent,
    DocumentAttachmentPlaceholderComponent,
    DocumentAuditPlaceholderComponent,
  ],
  template: `
    <div class="nf-doc-workspace">
      @if (statusConfig()) {
        <nf-document-status-ribbon
          [config]="statusConfig()"
          [document]="document()" />
      }

      <section class="nf-doc-workspace__header">
        <ng-content select="[nfDocumentHeader]"></ng-content>
      </section>

      <section class="nf-doc-workspace__lines">
        <ng-content select="[nfDocumentLines]"></ng-content>
      </section>

      @if (totalsConfig()) {
        <nf-document-totals-block [config]="totalsConfig()" [document]="document()" />
      }

      @if (filteredDocumentActions().length > 0) {
        <nf-document-action-bar
          [actions]="filteredDocumentActions()"
          [document]="document()"
          [disabled]="actionsDisabled()"
          (action)="documentAction.emit($event)" />
      }

      @if (features()?.attachments) {
        <nf-document-attachment-placeholder [zoneConfig]="attachmentZoneConfig()">
          <ng-content select="[nfDocumentAttachments]"></ng-content>
        </nf-document-attachment-placeholder>
      }

      @if (features()?.workflow) {
        <nf-document-audit-placeholder [zoneConfig]="auditZoneConfig()">
          <ng-content select="[nfDocumentAudit]"></ng-content>
        </nf-document-audit-placeholder>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex: 1 1 auto;
      min-height: 0;
    }
    .nf-doc-workspace {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 0 16px 24px;
      max-width: 1200px;
    }
    .nf-doc-workspace__header,
    .nf-doc-workspace__lines {
      min-width: 0;
    }
  `,
})
export class DocumentWorkspaceShellComponent {
  readonly document = input<unknown | null>(null);
  readonly statusConfig = input<DocumentStatusRibbonConfig | null>(null);
  readonly totalsConfig = input<DocumentTotalsBlockConfig | null>(null);
  readonly documentActions = input<DocumentActionUiConfig[]>([]);
  readonly features = input<DocumentWorkspaceFeatureFlags | null>(null);
  readonly attachmentZoneConfig = input<DocumentAttachmentZoneConfig | null>(null);
  readonly auditZoneConfig = input<DocumentAuditZoneConfig | null>(null);
  readonly actionsDisabled = input(false);

  readonly documentAction = output<DocumentActionEvent>();

  readonly filteredDocumentActions = computed(() => {
    const f = this.features();
    const acts = this.documentActions();
    if (!f) return acts;
    return acts.filter((a) => {
      if (a.kind === 'print' && f.print === false) return false;
      if (a.kind === 'export' && f.export === false) return false;
      return true;
    });
  });
}
