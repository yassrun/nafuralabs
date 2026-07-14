import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent, ToastService } from '@lib/anatomy';
import type {
  SmartImportPhase,
  SmartImportResult,
  SmartImportSession,
} from '../models/smart-import.model';
import { mapSmartImportError, type SmartImportError } from '../models/smart-import.errors';
import { SmartImportOrchestratorService } from '../services/smart-import-orchestrator.service';
import { SmartImportHelpDialogComponent } from './smart-import-help-dialog.component';
import { SmartImportReviewDialogComponent } from './smart-import-review-dialog.component';
import {
  SmartImportResultDialogComponent,
  type SmartImportResultAction,
} from './smart-import-result-dialog.component';

@Component({
  selector: 'nf-smart-import-trigger',
  standalone: true,
  imports: [ButtonComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="trigger">
      <input
        #fileInput
        type="file"
        [attr.accept]="accept"
        (change)="onFileSelected($event)" />

      <nf-button
        variant="secondary"
        icon="sparkles"
        iconLibrary="lucide"
        [loading]="isBusy()"
        [disabled]="disabled"
        [tooltip]="'platform.smartImport.tooltip' | translate"
        (clicked)="selectFile()">
        {{ phaseLabel() | translate }}
      </nf-button>

      <nf-button
        variant="ghost"
        size="sm"
        icon="info"
        iconLibrary="lucide"
        [disabled]="isBusy() || disabled"
        [tooltip]="'platform.smartImport.help.open' | translate"
        (clicked)="openHelp()">
      </nf-button>
    </div>
  `,
  styles: [`
    .trigger { display: inline-flex; align-items: center; gap: .25rem; }
    input { display: none; }
  `],
})
export class SmartImportTriggerComponent {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) entityKey = '';
  @Input() disabled = false;
  @Input() accept = '.xlsx,.xls,.csv,.pdf';

  @Output() readonly completed = new EventEmitter<SmartImportResult>();
  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly failed = new EventEmitter<SmartImportError>();

  readonly phase = signal<SmartImportPhase>('IDLE');

  private readonly orchestrator = inject(SmartImportOrchestratorService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  isBusy(): boolean {
    return ['PREFLIGHT', 'EXTRACTING', 'IMPORTING'].includes(this.phase());
  }

  phaseLabel(): string {
    const phase = this.phase();
    return phase === 'IDLE' || phase === 'COMPLETED' || phase === 'FAILED'
      ? 'platform.smartImport.button'
      : `platform.smartImport.phase.${phase.toLowerCase()}`;
  }

  selectFile(): void {
    if (this.isBusy() || this.disabled) return;
    const input = this.fileInput?.nativeElement;
    if (!input) return;
    input.value = '';
    input.click();
  }

  async openHelp(): Promise<void> {
    try {
      const { schema, config, arrayPath } =
        await this.orchestrator.describe(this.entityKey);
      this.dialog.open(SmartImportHelpDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { schema, config, arrayPath },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) return;

    try {
      let session = await this.orchestrator.prepare(
        this.entityKey,
        file,
        (progress) => this.phase.set(progress.phase),
      );

      if (session.config.writeMode === 'VALID_IMMEDIATELY') {
        await this.orchestrator.importReady(
          session,
          (progress) => this.phase.set(progress.phase),
        );
      }

      this.phase.set('REVIEWING');
      const reviewed = await this.openReview(session);
      if (!reviewed) {
        this.phase.set('IDLE');
        this.cancelled.emit();
        return;
      }
      session = reviewed;

      let result = await this.orchestrator.importReady(
        session,
        (progress) => this.phase.set(progress.phase),
      );
      let action = await this.openResult(result);
      while (action === 'RETRY' && result.failed > 0) {
        result = await this.orchestrator.retryFailed(
          session,
          (progress) => this.phase.set(progress.phase),
        );
        action = await this.openResult(result);
      }

      this.phase.set('COMPLETED');
      this.completed.emit(result);
      this.toast.success(
        this.translate.instant('platform.smartImport.result.toast', {
          imported: result.imported + result.corrected,
          skipped:
            result.skippedDuplicates + result.skippedInvalid + result.skippedByUser,
          failed: result.failed,
        }),
      );
    } catch (error) {
      this.phase.set('FAILED');
      this.handleError(error);
    } finally {
      input.value = '';
    }
  }

  private async openReview(
    session: SmartImportSession,
  ): Promise<SmartImportSession | undefined> {
    const ref = this.dialog.open<
      SmartImportReviewDialogComponent,
      SmartImportSession,
      SmartImportSession | undefined
    >(SmartImportReviewDialogComponent, {
      width: '1160px',
      maxWidth: '98vw',
      disableClose: true,
      data: session,
    });
    return firstValueFrom(ref.afterClosed());
  }

  private async openResult(result: SmartImportResult): Promise<SmartImportResultAction> {
    const ref = this.dialog.open<
      SmartImportResultDialogComponent,
      SmartImportResult,
      SmartImportResultAction
    >(SmartImportResultDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      disableClose: true,
      data: result,
    });
    return (await firstValueFrom(ref.afterClosed())) ?? 'CLOSE';
  }

  private handleError(error: unknown): void {
    const mapped = mapSmartImportError(error);
    console.error('[smart-import]', {
      entityKey: this.entityKey,
      code: mapped.code,
      correlationId: mapped.correlationId,
      technicalMessage: mapped.technicalMessage,
    });
    this.toast.error(this.translate.instant(mapped.messageKey));
    this.failed.emit(mapped);
  }
}

