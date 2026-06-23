import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { debounceTime, distinctUntilChanged, filter, of, switchMap, catchError } from 'rxjs';

import { DocTypeDefinition, DocTypeListItem, DocTypesByDomain, DomainDocTypes, DomainListItem } from '../../models/doc-type-definition.model';
import { ExtractedRecord, ExtractionDraft, ExtractionStatus, StandardRecordFilters, RecordSearchRequest } from '../../models/extraction.model';
import { DocTypeService } from '../../services/doc-type.service';
import { ExtractionService } from '../../services/extraction.service';
import { ColumnResolver, ResolvedColumn } from '../../utils/column-resolver';
import { DynamicRecordDialogComponent, DynamicRecordDialogResult } from '../dynamic-record-dialog/dynamic-record-dialog.component';
import { ExportResultDialogComponent, ExportResultData } from '../export-result-dialog/export-result-dialog.component';
import { TenantContextService } from '../../../../../core/tenant/tenant.context';
import { StandardRecordFiltersComponent } from '../standard-record-filters/standard-record-filters.component';
import { ContextHeaderComponent, StatusChipComponent } from '../../../../../lib/design-system';

import { ExtractionDiscoveryComponent } from '../extraction-discovery/extraction-discovery.component';
import { ConfirmDialogComponent } from '../../../../../core/components/confirm-dialog/confirm-dialog.component';
import { ExtractionResponse } from '../../models/extraction.model';
import { FlipIconRtlDirective } from '../../../../../lib/anatomy/directives';

@Component({
  selector: 'app-doc-extraction-workspace',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatMenuModule,
    TranslateModule,
    StandardRecordFiltersComponent,
    ContextHeaderComponent,
    StatusChipComponent,
    ExtractionDiscoveryComponent,
    FlipIconRtlDirective,
  ],
  templateUrl: './doc-extraction-workspace.component.html',
  styleUrl: './doc-extraction-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocExtractionWorkspaceComponent {
  private readonly docTypeService = inject(DocTypeService);
  private readonly extractionService = inject(ExtractionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantContext = inject(TenantContextService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly domainKey = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  readonly docTypeKey = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  readonly errorStateMatcher = new ShowOnDirtyErrorStateMatcher();

  readonly loadingDocTypes = signal(false);
  readonly loadingDefinition = signal(false);
  readonly uploading = signal(false);
  readonly loadingSession = signal(false);

  readonly docTypesByDomain = signal<DocTypesByDomain | null>(null);
  readonly definition = signal<DocTypeDefinition | null>(null);

  // Extract domains from docTypesByDomain to avoid redundant API call
  readonly domains = computed<DomainListItem[]>(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];
    
    // Map domain keys to labels (matching DomainCatalog.v1())
    const domainLabelMap: Record<string, string> = {
      'finance': 'Accounting & Finance',
      'btp': 'Construction / BTP',
      'logistic': 'Logistics',
      'inventory': 'Inventory',
    };

    return Object.keys(byDomain.domains)
      .map(domainKey => ({
        domainKey,
        label: domainLabelMap[domainKey] || domainKey.charAt(0).toUpperCase() + domainKey.slice(1),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  // Filter and pagination state
  readonly filters = signal<StandardRecordFilters>({ dateField: 'CREATED_AT' });
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);

  /**
   * Cache for loaded definitions to avoid redundant API calls.
   * Key: `${domainKey}:${docTypeKey}`
   */
  private readonly definitionCache = new Map<string, DocTypeDefinition>();

  /**
   * Locked schema version for the session (once first record exists).
   * When locked, domain/doc type selection is disabled.
   */
  readonly lockedDocTypeVersion = signal<number | null>(null);

  readonly records = signal<ExtractedRecord[]>([]);

  // Selection model for table rows
  readonly selection = new SelectionModel<ExtractedRecord>(false, []); // Single selection

  readonly gridColumns = computed<ResolvedColumn<ExtractedRecord>[]>(() => {
    const def = this.definition();
    if (!def) return [];
    return ColumnResolver.resolveGridColumns<ExtractedRecord>({
      uiSchema: def.uiSchema,
      jsonSchema: def.jsonSchema,
      maxFallbackColumns: 6,
    });
  });

  readonly displayedColumnIds = computed(() => {
    const cols = this.gridColumns().map(c => c.id);
    return [...cols, 'createdAt', 'status', 'document'];
  });

  readonly selectedDocType = computed(() => {
    const domain = this.domainKey.value?.trim();
    const docTypeKey = this.docTypeKey.value?.trim();
    if (!domain || !docTypeKey) return null;
    
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return null;
    
    const domainData = byDomain.domains[domain];
    if (!domainData) return null;
    
    return domainData.docTypes.find(t => t.docTypeKey === docTypeKey) ?? null;
  });

  readonly domainsList = computed(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];
    return Object.keys(byDomain.domains).sort();
  });

  /**
   * Track which domains are expanded (collapsible state).
   * By default, expand the domain that contains the selected doc type.
   */
  private readonly expandedDomains = signal<Set<string>>(new Set());
  
  readonly isDomainExpanded = (domainKey: string): boolean => {
    return this.expandedDomains().has(domainKey);
  };

  toggleDomain(domainKey: string): void {
    const current = new Set(this.expandedDomains());
    if (current.has(domainKey)) {
      current.delete(domainKey);
    } else {
      current.add(domainKey);
    }
    this.expandedDomains.set(current);
  }

  onDomainOpened(domainKey: string): void {
    const expanded = new Set(this.expandedDomains());
    expanded.add(domainKey);
    this.expandedDomains.set(expanded);
  }

  onDomainClosed(domainKey: string): void {
    const expanded = new Set(this.expandedDomains());
    expanded.delete(domainKey);
    this.expandedDomains.set(expanded);
  }

  /**
   * Get the active domain key (domain of the selected doc type).
   */
  readonly activeDomain = computed(() => {
    return this.domainKey.value?.trim() || null;
  });

  /**
   * Map of domain keys to their icon names.
   */
  private readonly domainIcons = new Map<string, string>([
    ['logistic', 'local_shipping'],
    ['finance', 'account_balance'],
    ['hr', 'people'],
    ['procurement', 'shopping_cart'],
    ['inventory', 'inventory_2'],
    ['sales', 'point_of_sale'],
    ['legal', 'gavel'],
    ['quality', 'verified'],
    ['maintenance', 'build'],
    ['it', 'computer'],
  ]);

  /**
   * Map of doc type keys to their icon names.
   */


  /**
   * Get icon for a domain. Returns a default icon if domain not found.
   */
  getDomainIcon(domainKey: string): string {
    return this.domainIcons.get(domainKey.toLowerCase()) || 'folder';
  }

  /**
   * Get icon for a doc type. Returns empty string to hide icons for all document types.
   */
  getDocTypeIcon(docTypeKey: string): string {
    // No icons for any document types in submenu
    return '';
  }

  readonly getDocTypesForDomain = (domainKey: string): DocTypeListItem[] => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];
    const domainData = byDomain.domains[domainKey];
    return domainData?.docTypes ?? [];
  };

  constructor() {
    // Note: We allow navigation to other doc types even when locked.
    // The lock only prevents schema modification for the current session.
    // When switching doc types, selectDocType() automatically unlocks and resets.
    // Form controls remain enabled to allow navigation.

    // Load doc types by tenant on init (domains are extracted from docTypesByDomain)
    effect(() => {
      const tenantId = this.tenantContext.tenantId();
      if (tenantId) {
        this.loadDocTypesByTenant(tenantId);
      }
    });

    // Auto-expand the active domain when it changes
    effect(() => {
      const active = this.activeDomain();
      if (active) {
        const expanded = new Set(this.expandedDomains());
        expanded.add(active);
        this.expandedDomains.set(expanded);
      }
    });

    // Load definition whenever doc type changes (with cache)
    this.docTypeKey.valueChanges.pipe(
      debounceTime(0),
      distinctUntilChanged(),
      switchMap((docTypeKey) => {
        const domain = this.domainKey.value.trim();
        const dt = docTypeKey?.trim();
        if (!domain || !dt) {
          this.definition.set(null);
          this.records.set([]);
          return of<DocTypeDefinition | null>(null);
        }

        // Check cache first
        const cacheKey = `${domain}:${dt}`;
        const cached = this.definitionCache.get(cacheKey);
        if (cached) {
          // Use cached definition immediately
          return of<DocTypeDefinition>(cached);
        }

        // Not in cache, load from API with tenantId
        this.loadingDefinition.set(true);
        const tenantId = this.tenantContext.tenantId();
        return this.docTypeService.getActiveDefinition(domain, dt, tenantId ?? undefined).pipe(
          catchError((err) => {
            this.loadingDefinition.set(false);
            this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 6000 });
            return of<DocTypeDefinition | null>(null);
          })
        );
      })
    ).subscribe((def) => {
      this.loadingDefinition.set(false);
      this.definition.set(def);
      // Clear records first, they will be loaded by loadSession
      this.records.set([]);

      if (def) {
        // Cache the definition for future use
        const cacheKey = `${def.domainKey}:${def.docTypeKey}`;
        this.definitionCache.set(cacheKey, def);

        // Always load session records for active version (domain+docType+version)
        // This ensures old extracted records are displayed in the datatable when selecting a docType
        this.loadSession(def.domainKey, def.docTypeKey, def.version);
      }
    });
  }

  selectDocType(domainKey: string, docTypeKey: string): void {
    // Check if we're selecting a different docType
    const currentDomain = this.domainKey.value.trim();
    const currentDocType = this.docTypeKey.value.trim();
    
    // If selecting the same docType, do nothing
    if (currentDomain === domainKey && currentDocType === docTypeKey) {
      return;
    }
    
    // If locked but selecting a different docType, unlock and reset
    if (this.isLocked()) {
      this.lockedDocTypeVersion.set(null);
      this.records.set([]);
      this.selection.clear();
    }
    
    // Expand the domain when selecting a doc type from it
    const expanded = new Set(this.expandedDomains());
    expanded.add(domainKey);
    this.expandedDomains.set(expanded);
    
    this.domainKey.setValue(domainKey);
    this.docTypeKey.setValue(docTypeKey);
    this.domainKey.markAsDirty();
    this.docTypeKey.markAsDirty();
  }

  isLocked(): boolean {
    return this.lockedDocTypeVersion() !== null;
  }

  lockVersion(version: number): void {
    this.lockedDocTypeVersion.set(version);
  }

  currentDocTypeVersion(): number | null {
    const def = this.definition();
    if (!def) return null;
    return this.lockedDocTypeVersion() ?? def.version;
  }

  /**
   * Computed properties for context bar component
   */
  readonly contextBarDomainLabel = computed(() => {
    const def = this.definition();
    return def?.domainKey || '';
  });

  readonly contextBarDocTypeLabel = computed(() => {
    const def = this.definition();
    return def?.name || '';
  });

  readonly contextBarVersionLabel = computed(() => {
    const version = this.currentDocTypeVersion();
    return version ? `v${version}` : '';
  });

  readonly contextBarDomainKey = computed(() => {
    const def = this.definition();
    return def?.domainKey || '';
  });

  readonly contextBarDocTypeKey = computed(() => {
    const def = this.definition();
    return def?.docTypeKey || '';
  });

  readonly contextBarVersion = computed(() => {
    return this.currentDocTypeVersion() || 1;
  });

  readonly contextBarIsLoading = computed(() => {
    return this.loadingDefinition() || this.uploading() || this.loadingSession();
  });

  /**
   * Handle settings button click from context bar
   */
  onOpenSettings(): void {
    const domainKey = this.contextBarDomainKey();
    const docTypeKey = this.contextBarDocTypeKey();
    const version = this.contextBarVersion();

    if (domainKey && docTypeKey) {
      this.router.navigate(['/doc-extractor/doc-types', domainKey, docTypeKey], {
        queryParams: { version },
      });
    } else {
      // If no docType selected, navigate to doc types list
      this.router.navigate(['/doc-extractor/doc-types']);
    }
  }

  async addDocumentFromPicker(fileInput: HTMLInputElement): Promise<void> {
    if (this.isLocked()) {
      // Locked is fine; add allowed.
    }

    const def = this.definition();
    if (!def) {
      this.translate.get('docExtractor.messages.chooseTypeFirst').subscribe(msg => {
        this.translate.get('docExtractor.messages.dismiss').subscribe(dismiss => {
          this.snackBar.open(msg, dismiss, { duration: 3500 });
        });
      });
      return;
    }

    fileInput.value = '';
    fileInput.click();
  }

  addEmptyRecord(): void {
    const def = this.definition();
    if (!def) {
      this.translate.get('docExtractor.messages.chooseTypeFirst').subscribe(msg => {
        this.translate.get('docExtractor.messages.dismiss').subscribe(dismiss => {
          this.snackBar.open(msg, dismiss, { duration: 3500 });
        });
      });
      return;
    }

    const version = this.currentDocTypeVersion();
    if (!version) return;

    // Create an empty draft without document extraction
    const draft: ExtractionDraft = {
      draftId: `empty-${Date.now()}`, // Generate a unique draft ID
      domainKey: def.domainKey,
      docTypeKey: def.docTypeKey,
      docTypeVersion: version,
      dataJson: {}, // Empty data, user will fill it manually
      status: 'draft',
    };

    this.openRecordDialog({
      definition: def,
      lockedDocTypeVersion: version,
      mode: 'create',
      draft,
    });
  }

  onFileSelected(fileList: FileList | null): void {
    const file = fileList?.item(0) ?? null;
    if (!file) return;

    const def = this.definition();
    if (!def || !def.id) return;

    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      this.translate.get(['docExtractor.messages.tenantIdRequired', 'docExtractor.messages.dismiss']).subscribe(msgs => {
        this.snackBar.open(msgs['docExtractor.messages.tenantIdRequired'], msgs['docExtractor.messages.dismiss'], { duration: 5000 });
      });
      return;
    }

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

        if (response.status === 'IN_PROGRESS') {
          this.snackBar.open('Extraction is running in the background. Record ID: ' + response.recordId, 'Dismiss', { duration: 5000 });
          return;
        }

        if (response.status === 'FAILED') {
          this.snackBar.open('Extraction failed on the server.', 'Dismiss', { duration: 5000 });
          return;
        }

        // Parse extracted JSON
        let extractedData: Record<string, unknown> = {};
        try {
          extractedData = typeof response.extractedJson === 'string' 
            ? JSON.parse(response.extractedJson) 
            : response.extractedJson;
        } catch (e) {
          this.translate.get(['docExtractor.messages.failedToParse', 'docExtractor.messages.dismiss']).subscribe(msgs => {
            this.snackBar.open(msgs['docExtractor.messages.failedToParse'], msgs['docExtractor.messages.dismiss'], { duration: 5000 });
          });
          return;
        }

        // Extract filename from extracted data using pattern
        const suggestedFileName = this.extractFileNameFromData(extractedData, def, file.name);
        
        const version = this.currentDocTypeVersion();
        if (!version) return;

        // Create a draft object matching ExtractionDraft interface
        const draft: ExtractionDraft = {
          draftId: response.requestId,
          domainKey: def.domainKey,
          docTypeKey: def.docTypeKey,
          docTypeVersion: version,
          dataJson: extractedData,
          status: 'draft',
        };

        // Store suggested filename in metadata (for potential future use)
        (draft as any).suggestedFileName = suggestedFileName;

        this.openRecordDialog({
          definition: def,
          lockedDocTypeVersion: version,
          mode: 'create',
          draft,
        });
      },
      error: (err: unknown) => {
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
        const existingRecord = this.records().find(r => r.recordId === dedup.existingRecordId);
        if (existingRecord) {
          this.editRecord(existingRecord);
        } else {
          // If not in current list, try to open it
          this.openStoredDocument(dedup.existingRecordId);
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
        // Open candidate in a new tab
        const url = this.router.serializeUrl(
          this.router.createUrlTree(['/doc-extractor/extraction/workspace'], {
            queryParams: { recordId: dedup.candidateRecordId }
          })
        );
        window.open(url, '_blank');
      }
    });
  }

  /**
   * Extract filename from extracted data following a pattern.
   * Pattern: {domainKey}_{docTypeKey}_{referenceField}_{date}.{originalExtension}
   * Example: logistic_BL_BL123_2024-01-15.pdf
   */
  private extractFileNameFromData(
    data: Record<string, unknown>, 
    def: DocTypeDefinition, 
    originalFileName: string
  ): string {
    // Get file extension from original filename
    const extension = originalFileName.includes('.') 
      ? originalFileName.substring(originalFileName.lastIndexOf('.'))
      : '';

    // Try to find reference field (common patterns: blReference, transferReference, reference, etc.)
    const referenceField = data['blReference'] || 
                          data['transferReference'] || 
                          data['reference'] || 
                          data['docReference'] ||
                          '';

    // Try to find date field
    const dateField = data['date'] || data['documentDate'] || '';

    // Build filename: domain_docType_reference_date.ext
    const parts: string[] = [def.domainKey, def.docTypeKey];
    
    if (referenceField && typeof referenceField === 'string') {
      // Sanitize reference (remove special chars, keep alphanumeric and dashes)
      const sanitizedRef = referenceField.replace(/[^a-zA-Z0-9-]/g, '_');
      parts.push(sanitizedRef);
    }
    
    if (dateField && typeof dateField === 'string') {
      // Use date as-is (should be YYYY-MM-DD format)
      parts.push(dateField);
    }

    return parts.join('_') + extension;
  }

  editRecord(record: ExtractedRecord): void {
    const def = this.definition();
    if (!def) return;

    const locked = this.currentDocTypeVersion();
    if (!locked) return;

    if (record.docTypeVersion !== locked) {
      this.translate.get('docExtractor.messages.cannotEditVersion', { version1: record.docTypeVersion, version2: locked }).subscribe(msg => {
        this.translate.get('docExtractor.messages.dismiss').subscribe(dismiss => {
          this.snackBar.open(msg, dismiss, { duration: 7000 });
        });
      });
      return;
    }

    this.openRecordDialog({
      definition: def,
      lockedDocTypeVersion: locked,
      mode: 'edit',
      record,
    });
  }

  removeRecord(record?: ExtractedRecord): void {
    const recordToRemove = record || this.selection.selected[0];
    if (!recordToRemove) return;

    const prev = this.records();
    this.records.set(prev.filter(r => r.recordId !== recordToRemove.recordId));
    this.selection.clear();

    this.translate.get(['docExtractor.messages.recordRemoved', 'docExtractor.messages.undo']).subscribe(msgs => {
      const ref = this.snackBar.open(msgs['docExtractor.messages.recordRemoved'], msgs['docExtractor.messages.undo'], { duration: 5000 });
      ref.onAction().subscribe(() => {
        this.records.set(prev);
      });
    });
  }

  editSelectedRecord(): void {
    const selected = this.selection.selected[0];
    if (selected) {
      this.editRecord(selected);
    }
  }

  exportExcel(): void {
    const def = this.definition();
    const version = this.currentDocTypeVersion();
    const tenantId = this.tenantContext.tenantId();
    if (!def || !version || !tenantId) return;

    const recordIds = this.records().map(r => r.recordId);
    if (recordIds.length === 0) {
      this.translate.get(['docExtractor.messages.noRecordsToExport', 'docExtractor.messages.dismiss']).subscribe(msgs => {
        this.snackBar.open(msgs['docExtractor.messages.noRecordsToExport'], msgs['docExtractor.messages.dismiss'], { duration: 3000 });
      });
      return;
    }

    this.extractionService.exportXlsx({
      domainKey: def.domainKey,
      docTypeKey: def.docTypeKey,
      docTypeVersion: version,
      tenantId,
      recordIds,
    }).subscribe({
      next: (blob) => this.downloadBlob(blob, `${def.domainKey}_${def.docTypeKey}_v${version}.xlsx`),
      error: (err: unknown) => this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 }),
    });
  }

  exportToSeyruraInternal(): void {
    const def = this.definition();
    const version = this.currentDocTypeVersion();
    const tenantId = this.tenantContext.tenantId();
    if (!def || !version || !tenantId) return;

    const records = this.records();
    if (records.length === 0) {
      this.translate.get(['docExtractor.messages.noRecordsToExport', 'docExtractor.messages.dismiss']).subscribe(msgs => {
        this.snackBar.open(msgs['docExtractor.messages.noRecordsToExport'], msgs['docExtractor.messages.dismiss'], { duration: 3000 });
      });
      return;
    }

    // Only support BL (Bon de Livraison) for now
    if (def.docTypeKey !== 'BL' || def.domainKey !== 'logistic') {
      this.translate.get(['docExtractor.messages.onlyBLSupported', 'docExtractor.messages.dismiss']).subscribe(msgs => {
        this.snackBar.open(msgs['docExtractor.messages.onlyBLSupported'], msgs['docExtractor.messages.dismiss'], { duration: 5000 });
      });
      return;
    }

    this.translate.get(['docExtractor.messages.exportingToSeyrura', 'docExtractor.messages.dismiss']).subscribe(msgs => {
      this.snackBar.open(msgs['docExtractor.messages.exportingToSeyrura'], msgs['docExtractor.messages.dismiss'], { duration: 2000 });
    });

    this.extractionService.exportToSeyruraInternal({
      domainKey: def.domainKey,
      docTypeKey: def.docTypeKey,
      docTypeVersion: version,
      tenantId,
      recordIds: records.map(r => r.recordId),
    }).subscribe({
      next: (response) => {
        // Open dialog with export results
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
      error: (err: unknown) => {
        this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 });
      },
    });
  }

  cellValue(col: ResolvedColumn<ExtractedRecord>, row: ExtractedRecord): string {
    return ColumnResolver.formatCellValue(col.getValue(row));
  }

  private loadDocTypesByTenant(tenantId: string): void {
    this.loadingDocTypes.set(true);
    this.docTypeService.listActiveByTenant(tenantId).subscribe({
      next: (data) => {
        this.loadingDocTypes.set(false);
        this.docTypesByDomain.set(data);
      },
      error: (err: unknown) => {
        this.loadingDocTypes.set(false);
        this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 6000 });
        this.docTypesByDomain.set(null);
      },
    });
  }

  private loadSession(domainKey: string, docTypeKey: string, docTypeVersion: number): void {
    this.loadRecordsWithFilters(domainKey, docTypeKey, docTypeVersion);
  }

  private loadRecordsWithFilters(domainKey: string, docTypeKey: string, docTypeVersion: number): void {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      this.loadingSession.set(false);
      return;
    }
    
    // Clear records immediately to prevent showing stale data
    this.records.set([]);
    this.loadingSession.set(true);
    
    const request: RecordSearchRequest = {
      context: {
        domainKey,
        docTypeKey,
        version: docTypeVersion,
      },
      page: {
        index: this.pageIndex(),
        size: this.pageSize(),
      },
      sort: [
        { field: 'createdAt', dir: 'DESC' },
      ],
      filters: this.filters(),
    };

    this.extractionService.searchRecords(request).subscribe({
      next: (response) => {
        this.loadingSession.set(false);
        this.records.set(response.items ?? []);
        this.totalItems.set(response.page?.totalItems ?? 0);
        
        if (response.items && response.items.length > 0) {
          this.lockVersion(docTypeVersion);
        }
        // Clear selection when loading new session
        this.selection.clear();
      },
      error: (err: unknown) => {
        this.loadingSession.set(false);
        // Keep records cleared on error to show empty state
        this.records.set([]);
        this.totalItems.set(0);
        this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 7000 });
      },
    });
  }

  onFiltersApply(filters: StandardRecordFilters): void {
    this.filters.set(filters);
    this.pageIndex.set(0); // Reset to first page
    const def = this.definition();
    if (def) {
      this.loadRecordsWithFilters(def.domainKey, def.docTypeKey, def.version);
    }
  }

  onFiltersClear(): void {
    this.filters.set({ dateField: 'CREATED_AT' });
    this.pageIndex.set(0);
    const def = this.definition();
    if (def) {
      this.loadRecordsWithFilters(def.domainKey, def.docTypeKey, def.version);
    }
  }

  openStoredDocument(documentId: string): void {
    // Navigate to documents module if route exists
    // For MVP, show a toast if documents module is not available
    this.router.navigate(['/documents', documentId]).catch(() => {
      this.translate.get(['docExtractor.messages.storageNotAvailable', 'docExtractor.messages.dismiss']).subscribe(msgs => {
        this.snackBar.open(msgs['docExtractor.messages.storageNotAvailable'], msgs['docExtractor.messages.dismiss'], { duration: 5000 });
      });
    });
  }

  private openRecordDialog(data: any): void {
    const ref = this.dialog.open<DynamicRecordDialogComponent, any, DynamicRecordDialogResult>(DynamicRecordDialogComponent, {
      width: '1100px',
      maxWidth: '98vw',
      maxHeight: '98vh',
      disableClose: true,
      data,
      panelClass: 'editor-dialog-panel',
      position: { top: '2vh' }, // Anchor near top of viewport
    });

    ref.afterClosed().subscribe((res) => {
      if (!res?.record) return;

      const record = res.record;
      const def = this.definition();
      if (!def) return;

      // Enforce session lock on first insert.
      if (!this.isLocked()) {
        this.lockVersion(record.docTypeVersion);
      }

      if (record.docTypeVersion !== this.currentDocTypeVersion()) {
        this.translate.get(['docExtractor.messages.recordNotAdded', 'docExtractor.messages.dismiss']).subscribe(msgs => {
          this.snackBar.open(msgs['docExtractor.messages.recordNotAdded'], msgs['docExtractor.messages.dismiss'], { duration: 7000 });
        });
        return;
      }

      const existing = this.records();
      const idx = existing.findIndex(r => r.recordId === record.recordId);
      if (idx >= 0) {
        const next = existing.slice();
        next[idx] = record;
        this.records.set(next);
        // Update selection if the edited record was selected
        if (this.selection.isSelected(existing[idx])) {
          this.selection.deselect(existing[idx]);
          this.selection.select(record);
        }
      } else {
        this.records.set([record, ...existing]);
        // Clear selection when adding new record
        this.selection.clear();
      }
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

  openSettings(): void {
    const def = this.definition();
    const version = this.currentDocTypeVersion();
    if (!def || !version) return;

    this.router.navigate(
      ['/doc-extractor', 'doc-types', def.domainKey, def.docTypeKey],
      {
        queryParams: { version },
      }
    );
  }

  onCreateCustomDocType(): void {
    this.router.navigate(['/doc-extractor/doc-types'], { queryParams: { create: true } });
  }

  getStatusInfo(status: ExtractionStatus): { label: string; tooltip: string } | null {
    // Note: This method is called from template, so we use instant() here
    // but only because we know translations are loaded by the time this is called
    switch (status) {
      case 'draft':
        return {
          label: this.translate.instant('docExtractor.status.draft'),
          tooltip: this.translate.instant('docExtractor.status.draftTooltip')
        };
      case 'validated':
        return {
          label: this.translate.instant('docExtractor.status.validated'),
          tooltip: this.translate.instant('docExtractor.status.validatedTooltip')
        };
      case 'invalid':
        return {
          label: this.translate.instant('docExtractor.status.invalid'),
          tooltip: this.translate.instant('docExtractor.status.invalidTooltip')
        };
      case 'corrected':
        return {
          label: this.translate.instant('docExtractor.status.corrected'),
          tooltip: this.translate.instant('docExtractor.status.correctedTooltip')
        };
      case 'exported':
        return {
          label: this.translate.instant('docExtractor.status.exported'),
          tooltip: this.translate.instant('docExtractor.status.exportedTooltip')
        };
      case 'error':
        return {
          label: this.translate.instant('docExtractor.status.error'),
          tooltip: this.translate.instant('docExtractor.status.errorTooltip')
        };
      default:
        return null;
    }
  }

  private humanizeHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const serverMsg =
        (typeof err.error === 'string' && err.error) ||
        (err.error && typeof err.error === 'object' && 'message' in err.error ? String((err.error as any).message) : '');
      if (serverMsg) {
        return serverMsg;
      }
      // Use translate.get() and return synchronously via a workaround
      // Since this is used in error handlers, we'll use instant() with fallback
      const translated = this.translate.instant('docExtractor.messages.requestFailed', { status: err.status });
      return translated !== 'docExtractor.messages.requestFailed' ? translated : `Request failed (${err.status}).`;
    }
    return this.translate.instant('docExtractor.messages.unexpectedError');
  }

  private readDomainHistory(): string[] {
    try {
      const raw = localStorage.getItem('docExtractor.domainHistory');
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
}




