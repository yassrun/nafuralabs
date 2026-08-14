/**
 * Config-driven transactional document page — extends detail CRUD for the header
 * and composes `nf-document-workspace-shell` for lines, totals, and document actions.
 */

import { Directive, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DocumentWorkspaceShellComponent } from '../components/organisms/document-workspace';
import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
} from './config-driven-detail-page.class';
import type {
  DocumentActionEvent,
  DocumentActionUiConfig,
  DocumentAttachmentZoneConfig,
  DocumentAuditZoneConfig,
  DocumentStatusRibbonConfig,
  DocumentTotalsBlockConfig,
  DocumentWorkspaceFeatureFlags,
} from '../types';

/**
 * Imports for pages that use `nf-document-workspace-shell` with `nf-entity-detail`.
 */
export const ConfigDrivenDocumentWorkspacePageImports = [
  ...ConfigDrivenDetailPageImports,
  DocumentWorkspaceShellComponent,
] as const;

export const ConfigDrivenDocumentWorkspacePageStyles = `
${ConfigDrivenDetailPageStyles}
  nf-document-workspace-shell {
    flex: 1 1 auto;
    min-height: 0;
    display: block;
  }
`;

@Directive()
export abstract class ConfigDrivenDocumentWorkspacePage<TItem> extends ConfigDrivenDetailPage<TItem> {
  protected readonly translate = inject(TranslateService);

  /** Optional regions (print/export/attachments/workflow placeholders). */
  abstract readonly documentWorkspaceFeatures: DocumentWorkspaceFeatureFlags;

  /** Primary document toolbar (validate, post, print, export, …). */
  abstract readonly documentWorkspaceActions: DocumentActionUiConfig[];

  /** Status ribbon; null to hide. */
  abstract readonly documentStatusConfig: DocumentStatusRibbonConfig | null;

  /** Totals block; null to hide. */
  abstract readonly documentTotalsConfig: DocumentTotalsBlockConfig | null;

  readonly documentAttachmentZoneConfig: DocumentAttachmentZoneConfig | null = null;
  readonly documentAuditZoneConfig: DocumentAuditZoneConfig | null = null;

  async onDocumentWorkspaceAction(event: DocumentActionEvent): Promise<void> {
    switch (event.kind) {
      case 'print':
        await this.handlePrint();
        break;
      case 'export':
        await this.handleDocumentExport(event);
        break;
      case 'cancel':
        await this.handleCancel();
        break;
      default:
        await this.handleCustomDocumentAction(event);
    }
  }

  /** Override to implement CSV/API export for lines or header. */
  protected async handleDocumentExport(_event: DocumentActionEvent): Promise<void> {
    this.toast.info(this.translate.instant('shared.documentWorkspace.exportNotImplemented'));
  }

  /** Override for submit/post/approve/custom document commands. */
  protected async handleCustomDocumentAction(event: DocumentActionEvent): Promise<void> {
    console.log('Unhandled document workspace action:', event.actionId, event);
  }
}
