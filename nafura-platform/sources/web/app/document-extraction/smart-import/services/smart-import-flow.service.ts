import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '@lib/anatomy';
import type {
  ExtractionDefinition,
  ReviewedExtraction,
  SmartImportMode,
  SmartImportPhase,
  SmartImportSession,
} from '../models/smart-import.model';
import { mapSmartImportError, type SmartImportError } from '../models/smart-import.errors';
import { SmartImportOrchestratorService } from './smart-import-orchestrator.service';
import { SmartImportHelpDialogComponent } from '../components/smart-import-help-dialog.component';
import { SmartImportReviewDialogComponent } from '../components/smart-import-review-dialog.component';

@Injectable()
export class SmartImportFlowService {
  private readonly orchestrator = inject(SmartImportOrchestratorService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  openHelp(definition: ExtractionDefinition): void {
    const { schema, config, arrayPath } = this.orchestrator.describe(definition);
    this.dialog.open(SmartImportHelpDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { schema, config, arrayPath },
    });
  }

  async importFile(
    definition: ExtractionDefinition,
    file: File,
    onPhase: (phase: SmartImportPhase) => void,
    mode: SmartImportMode = 'bulk',
  ): Promise<ReviewedExtraction | undefined> {
    try {
      let session = await this.orchestrator.prepare(
        definition,
        file,
        (progress) => onPhase(progress.phase),
        { mode },
      );

      onPhase('REVIEWING');
      const reviewed = await this.openReview(session);
      if (!reviewed) {
        onPhase('IDLE');
        return undefined;
      }
      session = reviewed;

      const result = this.orchestrator.finalize(session);
      onPhase('COMPLETED');
      return result;
    } catch (error) {
      onPhase('FAILED');
      this.handleError(definition, error);
      return undefined;
    }
  }

  handleError(definition: ExtractionDefinition, error: unknown): SmartImportError {
    const mapped = mapSmartImportError(error);
    console.error('[smart-import]', {
      definitionKey: definition.key,
      code: mapped.code,
      correlationId: mapped.correlationId,
      technicalMessage: mapped.technicalMessage,
    });
    this.toast.error(this.translate.instant(mapped.messageKey));
    return mapped;
  }

  private async openReview(
    session: SmartImportSession,
  ): Promise<SmartImportSession | undefined> {
    const ref = this.dialog.open<
      SmartImportReviewDialogComponent,
      SmartImportSession,
      SmartImportSession | undefined
    >(SmartImportReviewDialogComponent, {
      width: 'min(96vw, 1280px)',
      maxWidth: '98vw',
      maxHeight: '92vh',
      disableClose: true,
      autoFocus: false,
      data: session,
    });
    return firstValueFrom(ref.afterClosed());
  }
}
