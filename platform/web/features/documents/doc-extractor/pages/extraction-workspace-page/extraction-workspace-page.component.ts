/**
 * Extraction Workspace Page
 * 
 * Refactored workspace for a specific document type with:
 * - Breadcrumb navigation (no double sidebar)
 * - Doc type switcher dropdown
 * - Compact filter chips
 * - Improved empty state
 */

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { TenantContextService } from '../../../../../core/tenant/tenant.context';
import { StatusChipComponent } from '../../../../../lib/design-system';
import { DocTypeService } from '../../services/doc-type.service';
import { ExtractionService } from '../../services/extraction.service';
import { DocTypeDefinition, DocTypeListItem, DocTypesByDomain } from '../../models/doc-type-definition.model';
import { ExtractedRecord, ExtractionDraft, ExtractionStatus, StandardRecordFilters, RecordSearchRequest } from '../../models/extraction.model';
import { ColumnResolver, ResolvedColumn } from '../../utils/column-resolver';
import { DynamicRecordDialogComponent, DynamicRecordDialogResult } from '../../components/dynamic-record-dialog/dynamic-record-dialog.component';
import { ExportResultDialogComponent, ExportResultData } from '../../components/export-result-dialog/export-result-dialog.component';
import { RecordDatatableComponent, RecordTableAction } from '../../components/record-datatable/record-datatable.component';
import { ConfirmDialogComponent } from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { ExtractionResponse } from '../../models/extraction.model';

@Component({
  selector: 'app-extraction-workspace-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslateModule,
    StatusChipComponent,
    RecordDatatableComponent,
  ],
  templateUrl: './extraction-workspace-page.component.html',
  styleUrl: './extraction-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionWorkspacePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly docTypeService = inject(DocTypeService);
  private readonly extractionService = inject(ExtractionService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly translate = inject(TranslateService);

  // Route params
  private domainKey = '';
  private docTypeKey = '';

  // State
  readonly loading = signal(false);
  readonly loadingRecords = signal(false);
  readonly uploading = signal(false);
  readonly definition = signal<DocTypeDefinition | null>(null);
  readonly records = signal<ExtractedRecord[]>([]);
  readonly totalItems = signal(0);
  
  // Current active filters (preserved for refresh after actions)
  private currentFilters = signal<StandardRecordFilters | undefined>(undefined);

  // All doc types for switcher
  readonly docTypesByDomain = signal<DocTypesByDomain | null>(null);

  // Table
  readonly selection = new SelectionModel<ExtractedRecord>(false, []);

  readonly gridColumns = computed<ResolvedColumn<ExtractedRecord>[]>(() => {
    const def = this.definition();
    if (!def) return [];
    return ColumnResolver.resolveGridColumns<ExtractedRecord>({
      uiSchema: def.uiSchema,
      jsonSchema: def.jsonSchema,
      maxFallbackColumns: 6,
    });
  });

  /**
   * Table actions for the datatable component
   */
  readonly tableActions = computed<RecordTableAction[]>(() => {
    return [
      {
        icon: 'edit',
        tooltip: 'Edit',
        handler: (record) => this.onEditRecord(record),
      },
      {
        icon: 'delete_outline',
        tooltip: 'Delete',
        handler: (record) => this.onDeleteRecord(record),
      },
    ];
  });

  /**
   * Empty action configuration for datatable
   */
  readonly emptyActionConfig = computed(() => {
    return {
      label: 'Import Document',
      handler: () => {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          this.onImportDocument(fileInput);
        }
      },
    };
  });

  // Breadcrumb
  readonly breadcrumbs = computed(() => {
    const def = this.definition();
    if (!def) return [];
    return [
      { label: 'Extraction', route: '/doc-extractor/extraction' },
      { label: this.getDomainLabel(def.domainKey), route: '/doc-extractor/extraction', queryParams: { domain: def.domainKey } },
      { label: def.name, route: null },
    ];
  });

  // All doc types for switcher dropdown
  readonly allDocTypes = computed<Array<DocTypeListItem & { domainKey: string }>>(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];

    const all: Array<DocTypeListItem & { domainKey: string }> = [];
    Object.entries(byDomain.domains).forEach(([domainKey, domainData]) => {
      domainData.docTypes.forEach(docType => {
        all.push({ ...docType, domainKey });
      });
    });
    return all.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Status options
  readonly statusOptions: Array<{ value: ExtractionStatus | ''; label: string }> = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'validated', label: 'Validated' },
    { value: 'invalid', label: 'Invalid' },
    { value: 'corrected', label: 'Corrected' },
    { value: 'exported', label: 'Exported' },
  ];

  // Date field options
  readonly dateFieldOptions = [
    { value: '', label: 'No date filter' },
    { value: 'CREATED_AT', label: 'Created Date' },
    { value: 'UPDATED_AT', label: 'Updated Date' },
    { value: 'DOCUMENT_DATE', label: 'Document Date' },
  ];

  constructor() {
    // Load all doc types for switcher
    effect(() => {
      const tenantId = this.tenantContext.tenantId();
      if (tenantId) {
        this.docTypeService.listActiveByTenant(tenantId).subscribe({
          next: (data) => this.docTypesByDomain.set(data),
          error: () => this.docTypesByDomain.set(null),
        });
      }
    });
  }

  ngOnInit(): void {
    // Get route params
    this.route.params.subscribe(params => {
      this.domainKey = params['domainKey'] || '';
      this.docTypeKey = params['docTypeKey'] || '';

      if (this.domainKey && this.docTypeKey) {
        this.loadDefinition();
      }
    });

    // Check for import query param
    this.route.queryParams.subscribe(params => {
      if (params['import'] === 'true') {
        // Trigger import dialog after definition loads
        setTimeout(() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) {
            fileInput.click();
          }
        }, 500);
      }
    });
  }

  private loadDefinition(): void {
    this.loading.set(true);
    const tenantId = this.tenantContext.tenantId();

    this.docTypeService.getActiveDefinition(this.domainKey, this.docTypeKey, tenantId ?? undefined)
      .pipe(
        catchError((err) => {
          this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 6000 });
          return of(null);
        })
      )
      .subscribe((def) => {
        this.loading.set(false);
        this.definition.set(def);
        if (def) {
          this.loadRecords();
        }
      });
  }

  private loadRecords(filters?: StandardRecordFilters): void {
    const def = this.definition();
    const tenantId = this.tenantContext.tenantId();
    if (!def || !tenantId) return;

    // Clear records immediately to prevent showing stale data
    this.records.set([]);
    this.loadingRecords.set(true);

    const requestFilters: StandardRecordFilters = filters || {
      dateField: 'CREATED_AT',
    };

    const request: RecordSearchRequest = {
      context: {
        domainKey: def.domainKey,
        docTypeKey: def.docTypeKey,
        version: def.version,
      },
      page: { index: 0, size: 50 },
      sort: [{ field: 'createdAt', dir: 'DESC' }],
      filters: requestFilters,
    };

    this.extractionService.searchRecords(request).subscribe({
      next: (response) => {
        this.loadingRecords.set(false);
        this.records.set(response.items ?? []);
        this.totalItems.set(response.page?.totalItems ?? 0);
        this.selection.clear();
      },
      error: (err) => {
        this.loadingRecords.set(false);
        // Keep records cleared on error to show empty state
        this.records.set([]);
        this.totalItems.set(0);
        this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 6000 });
      },
    });
  }

  /**
   * Handle filters apply from datatable component
   */
  onFiltersApply(filters: StandardRecordFilters): void {
    this.currentFilters.set(filters);
    this.loadRecords(filters);
  }

  /**
   * Handle filters clear from datatable component
   */
  onFiltersClear(): void {
    this.currentFilters.set(undefined);
    this.loadRecords();
  }

  /**
   * Refresh records from server, preserving current filters
   */
  private refreshRecords(): void {
    this.loadRecords(this.currentFilters());
  }

  // Actions
  onImportDocument(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    fileInput.click();
  }

  onFileSelected(fileList: FileList | null): void {
    const file = fileList?.item(0) ?? null;
    if (!file) return;

    const def = this.definition();
    if (!def || !def.id) return;

    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) return;

    this.uploading.set(true);
    this.extractionService.extract({
      file,
      docTypeDefinitionId: def.id,
      persist: false,
    }).subscribe({
      next: (response) => {
        this.uploading.set(false);
        
        // Handle Duplicates
        if (response.status === 'DUPLICATE' || response.dedup?.exactDuplicate?.isDuplicate) {
          this.handleExactDuplicate(response);
          return;
        }

        if (response.dedup?.nearDuplicate?.isNearDuplicate) {
          this.handleNearDuplicate(response);
        }

        if (response.status === 'FAILED') {
          const errorMsg = (response as any).error || 'Extraction failed on the server.';
          this.snackBar.open(errorMsg, 'Dismiss', { duration: 7000 });
          return;
        }

        let extractedData: Record<string, unknown> = {};
        try {
          extractedData = typeof response.extractedJson === 'string' 
            ? JSON.parse(response.extractedJson) 
            : response.extractedJson;
        } catch (e) {
          this.snackBar.open('Failed to parse extracted data', 'Dismiss', { duration: 5000 });
          return;
        }

        const draft: ExtractionDraft = {
          // Backend creates an extracted_record immediately; use recordId as draft identifier
          // (the validate endpoint operates on recordId, not requestId)
          draftId: response.recordId ?? response.requestId,
          domainKey: def.domainKey,
          docTypeKey: def.docTypeKey,
          docTypeVersion: def.version,
          dataJson: extractedData,
          status: 'draft',
        };

        this.openRecordDialog('create', draft);
      },
      error: (err) => {
        this.uploading.set(false);
        this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 });
      },
    });
  }

  private handleExactDuplicate(response: ExtractionResponse): void {
    const dedup = response.dedup.exactDuplicate;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Document Already Processed',
        message: `This document has already been processed.\n\nStatus: ${dedup.existingStatus || 'Unknown'}`,
        confirmText: 'Open Existing Record',
        cancelText: 'Close',
        variant: 'warning',
        icon: 'content_copy'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && dedup.existingRecordId) {
        // Find the record in the current list if possible, or navigate
        // For now, we'll try to find it and open the edit dialog
        const existingRecord = this.records().find(r => r.recordId === dedup.existingRecordId);
        if (existingRecord) {
          this.onEditRecord(existingRecord);
        } else {
          // If not in current list, we could navigate to a details page if it exists
          // or just show a message that it's not in the current view
          this.snackBar.open('Navigating to existing record...', 'OK', { duration: 3000 });
          // Note: Backend DDOP changes might require specific navigation logic here
        }
      }
    });
  }

  private handleNearDuplicate(response: ExtractionResponse): void {
    const dedup = response.dedup.nearDuplicate;
    const distanceInfo = dedup.distance !== null ? ` (Distance: ${dedup.distance})` : '';
    
    const snackBarRef = this.snackBar.open(
      `Note: This document looks very similar to an existing record.${distanceInfo}`,
      'View possible match',
      { duration: 10000, panelClass: 'warning-snackbar' }
    );

    snackBarRef.onAction().subscribe(() => {
      if (dedup.candidateRecordId) {
        // Open candidate in a new tab - assuming a URL structure
        const url = this.router.serializeUrl(
          this.router.createUrlTree(['/doc-extractor/extraction/workspace', this.domainKey, this.docTypeKey], {
            queryParams: { recordId: dedup.candidateRecordId }
          })
        );
        window.open(url, '_blank');
      }
    });
  }

  onEditRecord(record: ExtractedRecord): void {
    this.openRecordDialog('edit', undefined, record);
  }

  onDeleteRecord(record: ExtractedRecord): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Record',
        message: `Are you sure you want to delete this record?\n\nThis action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
        icon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      // Optimistic update - remove from UI immediately
      const prev = this.records();
      this.records.set(prev.filter(r => r.recordId !== record.recordId));
      this.selection.clear();
      this.totalItems.update(t => Math.max(0, t - 1));

      // Call backend to delete
      this.extractionService.deleteRecord(record.recordId).subscribe({
        next: () => {
          this.snackBar.open('Record deleted successfully', 'Dismiss', { duration: 3000 });
          // No need to refresh - optimistic update already removed the record
        },
        error: (err) => {
          // Rollback optimistic update on error
          this.records.set(prev);
          this.totalItems.update(t => t + 1);
          this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 });
        }
      });
    });
  }

  onDeleteSelectedRecords(): void {
    const selectedRecords = this.selection.selected;
    if (selectedRecords.length === 0) {
      this.snackBar.open('No records selected', 'Dismiss', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Selected Records',
        message: this.translate.instant('docExtractor.deleteConfirm.message', { count: selectedRecords.length }),
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        variant: 'danger',
        icon: 'delete_sweep'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      const recordIds = selectedRecords.map(r => r.recordId);
      
      // Optimistic update - remove from UI immediately
      const prev = this.records();
      this.records.set(prev.filter(r => !recordIds.includes(r.recordId)));
      this.selection.clear();
      this.totalItems.update(t => Math.max(0, t - recordIds.length));

      // Call backend to delete
      this.extractionService.deleteRecords(recordIds).subscribe({
        next: (result) => {
          this.snackBar.open(result.message, 'Dismiss', { duration: 3000 });
          // No need to refresh - optimistic update already removed the records
        },
        error: (err) => {
          // Rollback optimistic update on error
          this.records.set(prev);
          this.totalItems.update(t => t + recordIds.length);
          this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 });
        }
      });
    });
  }


  // Export
  onExportExcel(): void {
    const def = this.definition();
    const tenantId = this.tenantContext.tenantId();
    if (!def || !tenantId) return;

    const recordIds = this.records().map(r => r.recordId);
    if (recordIds.length === 0) {
      this.snackBar.open('No records to export', 'Dismiss', { duration: 3000 });
      return;
    }

    this.extractionService.exportXlsx({
      domainKey: def.domainKey,
      docTypeKey: def.docTypeKey,
      docTypeVersion: def.version,
      tenantId,
      recordIds,
    }).subscribe({
      next: (blob) => this.downloadBlob(blob, `${def.domainKey}_${def.docTypeKey}_v${def.version}.xlsx`),
      error: (err) => this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 }),
    });
  }

  onExportSeyrura(): void {
    const def = this.definition();
    const tenantId = this.tenantContext.tenantId();
    if (!def || !tenantId) return;

    const records = this.records();
    if (records.length === 0) {
      this.snackBar.open('No records to export', 'Dismiss', { duration: 3000 });
      return;
    }

    this.snackBar.open('Exporting to Seyrura...', 'Dismiss', { duration: 2000 });

    this.extractionService.exportToSeyruraInternal({
      domainKey: def.domainKey,
      docTypeKey: def.docTypeKey,
      docTypeVersion: def.version,
      tenantId,
      recordIds: records.map(r => r.recordId),
    }).subscribe({
      next: (response) => {
        const dialogData: ExportResultData = {
          success: response.success,
          message: response.message,
          createdItems: response.createdItems,
          createdSuppliers: response.createdSuppliers,
          createdTransactions: response.createdTransactions,
          transactionLines: response.totalTransactionLines,
          errors: response.errors,
        };
        
        this.dialog.open(ExportResultDialogComponent, {
          data: dialogData,
          width: '500px',
        });
      },
      error: (err) => this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 }),
    });
  }

  // Navigation
  onDocTypeSwitcherChange(docType: DocTypeListItem & { domainKey: string }): void {
    this.router.navigate(['/doc-extractor/extraction/workspace', docType.domainKey, docType.docTypeKey]);
  }

  onNavigateToSettings(): void {
    const def = this.definition();
    if (def) {
      this.router.navigate(['/doc-extractor/doc-types', def.domainKey, def.docTypeKey], {
        queryParams: { version: def.version },
      });
    } else {
      this.router.navigate(['/doc-extractor/settings/general']);
    }
  }

  // Helpers
  getStatusInfo(status: ExtractionStatus): { label: string; variant: string } {
    const statusMap: Record<ExtractionStatus, { label: string; variant: string }> = {
      'draft': { label: 'Draft', variant: 'warning' },
      'validated': { label: 'Validated', variant: 'success' },
      'invalid': { label: 'Invalid', variant: 'error' },
      'corrected': { label: 'Corrected', variant: 'info' },
      'exported': { label: 'Exported', variant: 'success' },
      'error': { label: 'Error', variant: 'error' },
    };
    return statusMap[status] || { label: status, variant: 'default' };
  }


  getDomainLabel(domainKey: string): string {
    const labelMap: Record<string, string> = {
      'finance': 'Accounting & Finance',
      'btp': 'Construction / BTP',
      'logistic': 'Logistics',
      'inventory': 'Inventory',
    };
    return labelMap[domainKey] || domainKey.charAt(0).toUpperCase() + domainKey.slice(1);
  }

  private openRecordDialog(mode: 'create' | 'edit', draft?: ExtractionDraft, record?: ExtractedRecord): void {
    const def = this.definition();
    if (!def) return;

    const ref = this.dialog.open<DynamicRecordDialogComponent, any, DynamicRecordDialogResult>(DynamicRecordDialogComponent, {
      width: '1100px',
      maxWidth: '98vw',
      maxHeight: '98vh',
      disableClose: true,
      data: {
        definition: def,
        lockedDocTypeVersion: def.version,
        mode,
        draft,
        record,
      },
      panelClass: 'editor-dialog-panel',
      position: { top: '2vh' },
    });

    ref.afterClosed().subscribe((res) => {
      // If the user closes the dialog without validating, the record is still saved as a draft
      // on the backend. Refresh so it appears in the datatable.
      if (!res?.record) {
        if (mode === 'create') {
          this.snackBar.open(
            'Saved as draft. You can finish later from the list.',
            'Dismiss',
            { duration: 4000 }
          );
          this.refreshRecords();
        }
        return;
      }

      // Optimistic update for immediate feedback
      const resultRecord = res.record;
      const existing = this.records();
      const idx = existing.findIndex(r => r.recordId === resultRecord.recordId);
      
      if (idx >= 0) {
        const next = existing.slice();
        next[idx] = resultRecord;
        this.records.set(next);
      } else {
        this.records.set([resultRecord, ...existing]);
        // Update total count for new records
        this.totalItems.update(t => t + 1);
      }

      // Refresh from server to ensure data consistency and accurate counts
      this.refreshRecords();
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private humanizeHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const serverMsg =
        (typeof err.error === 'string' && err.error) ||
        (err.error && typeof err.error === 'object' && 'message' in err.error ? String((err.error as any).message) : '');
      if (serverMsg) return serverMsg;
      return `Request failed (${err.status}).`;
    }
    return 'An unexpected error occurred.';
  }
}



