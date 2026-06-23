/**
 * Record Datatable Component
 * 
 * Reusable component for displaying extracted records in a datatable with filters.
 * Unifies the implementation used in both Records and Extraction Workspace pages.
 * 
 * Features:
 * - Dynamic columns from document type schema
 * - Integrated filters (status, date range)
 * - Support for both client-side and server-side filtering
 * - Customizable actions
 * - Loading and empty states
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';

import { StatusChipComponent } from '../../../../../lib/design-system';
import { ExtractedRecord, ExtractionStatus, WorkflowStatus, StandardRecordFilters } from '../../models/extraction.model';
import { ResolvedColumn } from '../../utils/column-resolver';
import { ColumnResolver } from '../../utils/column-resolver';
import { StandardRecordFiltersComponent } from '../standard-record-filters/standard-record-filters.component';

export interface RecordTableAction {
  icon: string;
  tooltip: string;
  handler: (record: ExtractedRecord) => void;
  visible?: (record: ExtractedRecord) => boolean;
}

@Component({
  selector: 'app-record-datatable',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    StatusChipComponent,
    StandardRecordFiltersComponent,
  ],
  templateUrl: './record-datatable.component.html',
  styleUrl: './record-datatable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordDatatableComponent {
  private readonly locale = inject(LOCALE_ID);

  // =====================
  // INPUTS
  // =====================

  /** Records to display */
  private readonly recordsSig = signal<ExtractedRecord[]>([]);
  @Input({ required: true })
  set records(value: ExtractedRecord[]) {
    this.recordsSig.set(value ?? []);
  }
  get records(): ExtractedRecord[] {
    return this.recordsSig();
  }

  /** Dynamic columns from schema */
  private readonly gridColumnsSig = signal<ResolvedColumn<ExtractedRecord>[]>([]);
  @Input({ required: true })
  set gridColumns(value: ResolvedColumn<ExtractedRecord>[]) {
    this.gridColumnsSig.set(value ?? []);
  }
  get gridColumns(): ResolvedColumn<ExtractedRecord>[] {
    return this.gridColumnsSig();
  }

  /** Total items count (for server-side pagination) */
  @Input() totalItems = 0;

  /** Loading state */
  @Input() loading = false;

  /** Enable row selection */
  @Input() enableSelection = false;

  /** Selection model (required if enableSelection is true) */
  @Input() selection?: SelectionModel<ExtractedRecord>;

  /** Custom actions to display in actions column */
  private readonly actionsSig = signal<RecordTableAction[]>([]);
  @Input()
  set actions(value: RecordTableAction[]) {
    this.actionsSig.set(value ?? []);
  }
  get actions(): RecordTableAction[] {
    return this.actionsSig();
  }

  /** Show search field */
  private readonly showSearchSig = signal<boolean>(false);
  @Input()
  set showSearch(value: boolean) {
    this.showSearchSig.set(!!value);
  }
  get showSearch(): boolean {
    return this.showSearchSig();
  }

  /** Search placeholder */
  @Input() searchPlaceholder = 'Search records...';

  /** Date format for createdAt column */
  @Input() dateFormat: 'relative' | 'absolute' = 'relative';

  /** Empty state message */
  @Input() emptyMessage = 'No records found';

  /** Empty state action */
  @Input() emptyAction?: { label: string; handler: () => void };

  /** Show filters component */
  @Input() showFilters = true;

  // =====================
  // OUTPUTS
  // =====================

  /** Emitted when filters are applied */
  @Output() filtersApply = new EventEmitter<StandardRecordFilters>();

  /** Emitted when filters are cleared */
  @Output() filtersClear = new EventEmitter<void>();

  /** Emitted when a row is clicked */
  @Output() rowClick = new EventEmitter<ExtractedRecord>();

  /** Emitted when a row is double-clicked */
  @Output() rowDblClick = new EventEmitter<ExtractedRecord>();

  // =====================
  // COMPUTED
  // =====================

  /** Search query signal */
  readonly searchQuery = signal<string>('');

  /** Filtered records (client-side filtering) */
  readonly filteredRecords = computed(() => {
    let recs = this.recordsSig();

    // Apply search filter if enabled
    if (this.showSearchSig()) {
      const query = this.searchQuery().toLowerCase();
      if (query) {
        recs = recs.filter(r => {
          return this.gridColumnsSig().some(col => {
            const value = col.getValue(r);
            return value?.toString().toLowerCase().includes(query);
          });
        });
      }
    }

    return recs;
  });

  /** Displayed column IDs */
  readonly displayedColumnIds = computed(() => {
    const cols = this.gridColumnsSig().map(c => c.id);
    const systemCols = ['status', 'createdAt'];
    if (this.actionsSig().length > 0) {
      systemCols.push('actions');
    }
    return [...cols, ...systemCols];
  });

  /** Records to display (either filtered or raw) */
  readonly displayRecords = computed(() => {
    return this.showSearchSig() ? this.filteredRecords() : this.recordsSig();
  });

  // =====================
  // METHODS
  // =====================

  /**
   * Get cell value for a dynamic column
   */
  cellValue(col: ResolvedColumn<ExtractedRecord>, row: ExtractedRecord): string {
    return ColumnResolver.formatCellValue(col.getValue(row));
  }

  /**
   * Get status info for badge display.
   * Prioritizes workflowStatus (REJECTED) over regular status.
   */
  getStatusInfo(record: ExtractedRecord): { label: string; variant: string } {
    // If workflowStatus is REJECTED or FAILED, show that first
    if (record.workflowStatus === 'REJECTED' || record.workflowStatus === 'FAILED') {
      return { label: 'Extraction Failed', variant: 'error' };
    }
    
    const statusMap: Record<ExtractionStatus, { label: string; variant: string }> = {
      'draft': { label: 'Draft', variant: 'warning' },
      'validated': { label: 'Validated', variant: 'success' },
      'invalid': { label: 'Invalid', variant: 'error' },
      'corrected': { label: 'Corrected', variant: 'info' },
      'exported': { label: 'Exported', variant: 'success' },
      'error': { label: 'Error', variant: 'error' },
    };
    return statusMap[record.status] || { label: record.status, variant: 'default' };
  }

  /**
   * Check if record extraction failed
   */
  isExtractionFailed(record: ExtractedRecord): boolean {
    return record.workflowStatus === 'REJECTED' || record.workflowStatus === 'FAILED';
  }

  /**
   * Get rejection reason tooltip
   */
  getRejectionReason(record: ExtractedRecord): string {
    return record.rejectionReason || 'Extraction failed - please retry';
  }

  /**
   * Format relative time for display
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Format absolute date for display
   */
  formatAbsoluteDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString(this.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Handle row click
   */
  onRowClick(record: ExtractedRecord, event: MouseEvent): void {
    if (this.enableSelection && this.selection) {
      this.selection.toggle(record);
    }
    this.rowClick.emit(record);
  }

  /**
   * Handle row double-click
   */
  onRowDblClick(record: ExtractedRecord): void {
    this.rowDblClick.emit(record);
  }

  /**
   * Handle action click
   */
  onActionClick(action: RecordTableAction, record: ExtractedRecord, event: MouseEvent): void {
    event.stopPropagation();
    action.handler(record);
  }

  /**
   * Check if action should be visible
   */
  isActionVisible(action: RecordTableAction, record: ExtractedRecord): boolean {
    return action.visible ? action.visible(record) : true;
  }

  /**
   * Handle search query change
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery.set('');
  }

  /**
   * Check if row is selected
   */
  isRowSelected(record: ExtractedRecord): boolean {
    return this.enableSelection && this.selection ? this.selection.isSelected(record) : false;
  }
}


