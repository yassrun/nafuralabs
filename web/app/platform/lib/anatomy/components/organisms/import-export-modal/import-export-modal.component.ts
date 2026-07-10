/**
 * Import / Export Modal
 *
 * Standard listing Import/Export UX:
 * - One modal, two tabs (Import default, Export)
 * - Import: template download, drag-drop, validation, confirmation, post-import summary
 * - Export: current view or selected rows, immediate export
 * - Modal cannot close while import is running
 */

import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button';
import { TabsComponent, TabItem } from '../../molecules/tabs';
import { CsvService } from '../../services/csv.service';
import type { ImportExportDialogData } from './import-export-dialog.data';
import type { ImportResult, ImportValidationSummary } from '@lib/anatomy/types';

type ActiveTab = 'import' | 'export';
type ImportPhase = 'idle' | 'file-selected' | 'validating' | 'ready' | 'importing' | 'done';

@Component({
  selector: 'nf-import-export-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
    ButtonComponent,
    TabsComponent,
  ],
  templateUrl: './import-export-modal.component.html',
  styleUrls: ['./import-export-modal.component.scss'],
})
export class ImportExportModalComponent {
  private readonly dialogRef = inject(MatDialogRef<ImportExportModalComponent>);
  private readonly data = inject<ImportExportDialogData>(MAT_DIALOG_DATA);
  private readonly csvService = inject(CsvService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  readonly config = this.data.config;
  readonly title = this.t(
    'Import / Export {{entity}}',
    `Import / Export ${this.translateLabel(this.config.entityName)}`,
    { entity: this.translateLabel(this.config.entityName) }
  );

  readonly activeTab = signal<ActiveTab>('import');
  readonly importPhase = signal<ImportPhase>('idle');
  readonly selectedFile = signal<File | null>(null);
  readonly parsedRows = signal<Record<string, string>[]>([]);
  readonly validationSummary = signal<ImportValidationSummary | null>(null);
  readonly importResult = signal<ImportResult | null>(null);
  readonly exportLoading = signal(false);

  readonly tabs: TabItem[] = [
    { id: 'import', label: this.t('Import', 'Import'), icon: 'upload' },
    { id: 'export', label: this.t('Export', 'Export'), icon: 'download' },
  ];

  readonly canClose = computed(() => this.importPhase() !== 'importing');
  readonly importBlocked = computed(() => {
    const v = this.validationSummary();
    return v && !v.schemaValid;
  });
  readonly validImportCount = computed(() => {
    const v = this.validationSummary();
    return v?.validRows ?? 0;
  });
  readonly hasSelection = computed(() => this.data.hasSelection?.() ?? false);

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId as ActiveTab);
  }

  onDownloadTemplate(): void {
    this.data.downloadTemplate();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file && this.isAcceptedFile(file)) this.setFile(file);
  }

  onFileOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileSelectClick(): void {
    this.fileInputRef?.nativeElement?.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file && this.isAcceptedFile(file)) this.setFile(file);
  }

  private isAcceptedFile(file: File): boolean {
    const formats = this.config.allowedImportFormats ?? ['csv'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return true;
    if (ext === 'xlsx' && formats.includes('xlsx')) return true;
    return false;
  }

  private async setFile(file: File): Promise<void> {
    this.selectedFile.set(file);
    this.importPhase.set('validating');
    this.parsedRows.set([]);
    this.validationSummary.set(null);
    this.importResult.set(null);

    try {
      const text = await this.readFileAsText(file);
      const rows = this.csvService.parseCsvText(text);
      const summary = this.validateRows(rows);
      this.parsedRows.set(rows);
      this.validationSummary.set(summary);
      this.importPhase.set(summary.schemaValid ? 'ready' : 'file-selected');
    } catch {
      this.validationSummary.set({
        totalRows: 0,
        validRows: 0,
        errorRows: 1,
        errors: [{ row: 0, message: this.t('Could not read file. Use UTF-8 CSV.', 'Could not read file. Use UTF-8 CSV.') }],
        schemaValid: false,
      });
      this.importPhase.set('file-selected');
    }
    this.cdr.markForCheck();
  }

  private validateRows(rows: Record<string, string>[]): ImportValidationSummary {
    const keys = this.config.templateColumns.map((c) => c.key);
    const errors: Array<{ row: number; message: string }> = [];

    if (rows.length === 0) {
      return {
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        errors: [],
        schemaValid: true,
      };
    }

    const firstRow = rows[0];
    const headerKeys = Object.keys(firstRow);
    const missingKeys = keys.filter((k) => !headerKeys.some((h) => h.toLowerCase() === k.toLowerCase()));
    if (missingKeys.length > 0) {
      return {
        totalRows: rows.length,
        validRows: 0,
        errorRows: rows.length,
        errors: [{
          row: 1,
          message: this.t(
            'Missing required columns: {{columns}}',
            `Missing required columns: ${missingKeys.join(', ')}`,
            { columns: missingKeys.join(', ') }
          ),
        }],
        schemaValid: false,
      };
    }

    let validRows = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const required = keys.filter((k) => ['name', 'code', 'id'].includes(k));
      const missing = required.length ? required.filter((r) => !(row[r] ?? '').trim()) : [];
      if (missing.length > 0) {
        errors.push({
          row: i + 2,
          message: this.t(
            'Missing required: {{fields}}',
            `Missing required: ${missing.join(', ')}`,
            { fields: missing.join(', ') }
          ),
        });
      } else {
        validRows++;
      }
    }

    return {
      totalRows: rows.length,
      validRows,
      errorRows: rows.length - validRows,
      errors,
      schemaValid: true,
    };
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? '');
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'UTF-8');
    });
  }

  async onConfirmImport(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    const rows = this.parsedRows();
    const summary = this.validationSummary();
    if (!summary?.schemaValid && rows.length > 0) return;

    this.importPhase.set('importing');
    this.dialogRef.disableClose = true;
    this.cdr.markForCheck();

    try {
      let result: ImportResult;
      if (this.data.importFile) {
        result = await this.data.importFile(file);
      } else if (this.data.importRows && rows.length > 0) {
        const errorRows = new Set((summary?.errors ?? []).map((e) => e.row));
        const validRows = rows.filter((_, i) => !errorRows.has(i + 2));
        if (validRows.length === 0) {
          this.importPhase.set('ready');
          this.dialogRef.disableClose = false;
          this.cdr.markForCheck();
          return;
        }
        result = await this.data.importRows(validRows);
      } else {
        this.importPhase.set('ready');
        this.dialogRef.disableClose = false;
        this.cdr.markForCheck();
        return;
      }
      this.importResult.set(result);
      this.importPhase.set('done');
    } catch (e) {
      this.importResult.set({
        created: 0,
        updated: 0,
        skipped: 0,
        failed: rows.length || 1,
        errors: [{ row: 0, message: e instanceof Error ? e.message : this.t('Import failed', 'Import failed') }],
      });
      this.importPhase.set('done');
    } finally {
      this.dialogRef.disableClose = false;
      this.cdr.markForCheck();
    }
  }

  onCancelImport(): void {
    this.selectedFile.set(null);
    this.parsedRows.set([]);
    this.validationSummary.set(null);
    this.importPhase.set('idle');
  }

  onExportView(): void {
    this.exportLoading.set(true);
    this.data.exportView().finally(() => {
      this.exportLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onExportSelection(): void {
    if (!this.data.exportSelection) return;
    this.exportLoading.set(true);
    this.data.exportSelection().finally(() => {
      this.exportLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  onClose(): void {
    if (this.canClose()) this.dialogRef.close(true);
  }

  onDownloadErrorReport(): void {
    const result = this.importResult();
    if (!result?.errors?.length) return;
    const rows = result.errors.map((e) => ({ row: e.row, field: e.field ?? '', message: e.message }));
    const columns = [
      { field: 'row', label: this.t('Row', 'Row') },
      { field: 'field', label: this.t('Field', 'Field') },
      { field: 'message', label: this.t('Message', 'Message') },
    ];
    this.csvService.exportToCsv(
      rows as unknown as Record<string, unknown>[],
      columns,
      `import-errors-${this.config.entityName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  private translateLabel(value: string): string {
    const translated = this.translate.instant(value);
    return translated === value ? value : translated;
  }

  private t(key: string, fallback: string, params?: Record<string, unknown>): string {
    const translated = this.translate.instant(key, params);
    return translated === key ? fallback : translated;
  }
}
