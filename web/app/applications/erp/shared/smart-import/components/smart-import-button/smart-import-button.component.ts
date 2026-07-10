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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, IconComponent, ToastService } from '@lib/anatomy';

import { SmartImportService } from '../../services/smart-import.service';

@Component({
  selector: 'erp-smart-import-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent, TranslateModule],
  template: `
    <input
      #fileInput
      class="sib__file-input"
      type="file"
      [attr.accept]="accept"
      (change)="onFileSelected($event)" />

    <nf-button
      variant="secondary"
      [disabled]="disabled || isImporting()"
      (clicked)="triggerInput()">
      @if (isImporting()) {
        <nf-icon name="loader-circle" />
        {{ 'achats.smartImport.importing' | translate }}
      } @else {
        <nf-icon name="upload" />
        {{ labelKey | translate }}
      }
    </nf-button>
  `,
  styles: [` .sib__file-input { display: none; } `],
})
export class SmartImportButtonComponent {
  @ViewChild('fileInput') private readonly fileInput?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) entityKey = '';
  @Input() labelKey = 'achats.smartImport.button';
  @Input() accept = '.xlsx,.xls,.csv,.pdf';
  @Input() disabled = false;

  @Output() readonly importComplete = new EventEmitter<void>();

  readonly isImporting = signal(false);

  private readonly smartImport = inject(SmartImportService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  triggerInput(): void {
    if (this.isImporting() || this.disabled) {
      return;
    }
    const input = this.fileInput?.nativeElement;
    if (!input) {
      return;
    }
    input.value = '';
    input.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    this.isImporting.set(true);
    try {
      const result = await this.smartImport.importFromFile(this.entityKey, file);
      this.toast.success(
        this.translate.instant('achats.smartImport.resultToast', {
          imported: result.imported + result.corrected,
          skipped: result.skippedDuplicates + result.skippedInvalid,
          failed: result.failed,
        }),
      );
      this.importComplete.emit();
    } catch (err) {
      const message = (err as Error).message;
      this.toast.error(this.translate.instant(this.resolveErrorKey(message)));
    } finally {
      input.value = '';
      this.isImporting.set(false);
    }
  }

  private resolveErrorKey(message: string): string {
    if (message === 'SMART_IMPORT_TENANT_MISSING') {
      return 'achats.smartImport.errors.tenantMissing';
    }
    if (message === 'SMART_IMPORT_EXTRACTION_FAILED') {
      return 'achats.smartImport.errors.extractionFailed';
    }
    if (message === 'SMART_IMPORT_NO_ROWS') {
      return 'achats.smartImport.errors.noRows';
    }
    if (message.startsWith('SMART_IMPORT_HANDLER_NOT_FOUND')) {
      return 'achats.smartImport.errors.handlerMissing';
    }
    return 'achats.smartImport.errors.generic';
  }
}
