import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, LOCALE_ID, OnDestroy, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { ExtractionStatus, StandardRecordFilters, DateFieldType } from '../../models/extraction.model';

@Component({
  selector: 'app-standard-record-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './standard-record-filters.component.html',
  styleUrl: './standard-record-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandardRecordFiltersComponent implements OnDestroy {
  private readonly locale = inject(LOCALE_ID);

  @Input() loading = false;
  @Input() totalItems = 0;

  @Output() apply = new EventEmitter<StandardRecordFilters>();
  @Output() clear = new EventEmitter<void>();

  readonly dateRangeError = signal<string | null>(null);
  
  private dateFieldSub?: any;
  private dateFromSub?: any;
  private dateToSub?: any;

  /**
   * Check if date field is active (not empty)
   */
  isDateFieldActive(): boolean {
    const dateFieldValue = this.filterForm.get('dateField')?.value;
    return !!(dateFieldValue && typeof dateFieldValue === 'string' && dateFieldValue.length > 0);
  }

  readonly statusOptions: Array<{ value: ExtractionStatus | ''; label: string }> = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'validated', label: 'Valid' },
    { value: 'invalid', label: 'Invalid' },
    { value: 'corrected', label: 'Corrected' },
    { value: 'exported', label: 'Exported' },
    { value: 'error', label: 'Failed' },
  ];

  readonly dateFieldOptions: Array<{ value: DateFieldType | ''; label: string }> = [
    { value: '', label: 'No date filter' },
    { value: 'CREATED_AT', label: 'Created At' },
  ];

  readonly filterForm = new FormGroup({
    status: new FormControl<ExtractionStatus | ''>(''),
    dateField: new FormControl<DateFieldType | ''>(''),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
  }, { validators: this.dateRangeValidator });

  constructor() {
    // Initially disable date inputs
    this.filterForm.get('dateFrom')?.disable({ emitEvent: false });
    this.filterForm.get('dateTo')?.disable({ emitEvent: false });

    // Disable date inputs when dateField is empty
    this.dateFieldSub = this.filterForm.get('dateField')?.valueChanges.subscribe((dateField) => {
      const dateFrom = this.filterForm.get('dateFrom');
      const dateTo = this.filterForm.get('dateTo');
      
      if (!dateField || (typeof dateField === 'string' && dateField.length === 0)) {
        dateFrom?.disable({ emitEvent: false });
        dateTo?.disable({ emitEvent: false });
        dateFrom?.setValue(null, { emitEvent: false });
        dateTo?.setValue(null, { emitEvent: false });
      } else {
        dateFrom?.enable({ emitEvent: false });
        dateTo?.enable({ emitEvent: false });
      }
    });

    // Watch for date changes to validate range
    this.dateFromSub = this.filterForm.get('dateFrom')?.valueChanges.subscribe(() => this.validateDateRange());
    this.dateToSub = this.filterForm.get('dateTo')?.valueChanges.subscribe(() => this.validateDateRange());
  }

  ngOnDestroy(): void {
    this.dateFieldSub?.unsubscribe();
    this.dateFromSub?.unsubscribe();
    this.dateToSub?.unsubscribe();
  }

  /**
   * Date range validator: ensures dateFrom <= dateTo
   */
  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const dateField = control.get('dateField')?.value;
    const dateFrom = control.get('dateFrom')?.value;
    const dateTo = control.get('dateTo')?.value;

    if (!dateField || dateField === '') {
      return null; // No validation if date field not selected
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return { dateRangeInvalid: true };
    }

    return null;
  }

  /**
   * Validate date range and update error signal
   */
  private validateDateRange(): void {
    const dateFrom = this.filterForm.get('dateFrom')?.value;
    const dateTo = this.filterForm.get('dateTo')?.value;
    
    if (dateFrom && dateTo && dateFrom > dateTo) {
      this.dateRangeError.set('Start date must be before end date');
    } else {
      this.dateRangeError.set(null);
    }
  }

  /**
   * Count active filters (non-empty values)
   */
  activeFiltersCount(): number {
    let count = 0;
    const formValue = this.filterForm.value;
    
    const statusValue = formValue.status;
    if (statusValue && typeof statusValue === 'string' && statusValue.length > 0) count++;
    
    const dateFieldValue = formValue.dateField;
    if (dateFieldValue && typeof dateFieldValue === 'string' && dateFieldValue.length > 0) count++;
    
    if (formValue.dateFrom) count++;
    if (formValue.dateTo) count++;
    
    return count;
  }

  /**
   * Build a summary string of active filters
   */
  buildFilterSummary(): string {
    const parts: string[] = [];
    const formValue = this.filterForm.value;
    
    const statusValue = formValue.status;
    if (statusValue && typeof statusValue === 'string' && statusValue.length > 0) {
      const statusLabel = this.statusOptions.find(o => o.value === statusValue)?.label || statusValue;
      parts.push(`Status: ${statusLabel}`);
    }
    
    const dateFieldValue = formValue.dateField;
    if (dateFieldValue && typeof dateFieldValue === 'string' && dateFieldValue.length > 0) {
      const dateFieldLabel = this.dateFieldOptions.find(o => o.value === dateFieldValue)?.label || dateFieldValue;
      parts.push(dateFieldLabel);
      if (formValue.dateFrom || formValue.dateTo) {
        const from = formValue.dateFrom ? this.formatDateShort(formValue.dateFrom) : '...';
        const to = formValue.dateTo ? this.formatDateShort(formValue.dateTo) : '...';
        parts.push(`${from} - ${to}`);
      }
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  }

  /**
   * Format date for summary display
   */
  private formatDateShort(date: Date): string {
    return date.toLocaleDateString(this.locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Apply filters (called on button click or Enter key)
   */
  applyFilters(): void {
    // Validate date range manually
    this.validateDateRange();
    if (this.dateRangeError()) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const formValue = this.filterForm.value;
    const statusValue = formValue.status;
    
    // Type guard: if statusValue is truthy and not empty string, it must be ExtractionStatus
    const status: ExtractionStatus | undefined = 
      statusValue && typeof statusValue === 'string' && statusValue.length > 0 
        ? (statusValue as ExtractionStatus) 
        : undefined;
    
    // Only include dateField if it's selected, otherwise default to CREATED_AT
    const dateFieldValue = formValue.dateField;
    const dateField: DateFieldType = 
      dateFieldValue && typeof dateFieldValue === 'string' && dateFieldValue.length > 0
        ? (dateFieldValue as DateFieldType)
        : 'CREATED_AT'; // Default to CREATED_AT if not specified
    
    const filters: StandardRecordFilters = {
      dateField,
      status,
      dateFrom: formValue.dateFrom ? this.formatDateToISO(formValue.dateFrom) : undefined,
      dateTo: formValue.dateTo ? this.formatDateToISOEndOfDay(formValue.dateTo) : undefined,
    };

    this.dateRangeError.set(null);
    this.apply.emit(filters);
    
    // Keep focus on table - don't scroll
    // The table will handle focus management
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.reset({
      status: '',
      dateField: '',
      dateFrom: null,
      dateTo: null,
    });
    this.dateRangeError.set(null);
    this.clear.emit();
  }

  /**
   * Handle Enter key to apply filters
   */
  @HostListener('keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    // Only apply if focus is on form inputs, not buttons
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
      event.preventDefault();
      this.applyFilters();
    }
  }

  // Legacy method names for backward compatibility
  onApply(): void {
    this.applyFilters();
  }

  onClear(): void {
    this.clearFilters();
  }

  private formatDateToISO(date: Date): string {
    // Format as ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
    // For date-only, we'll use start of day for from, end of day for to
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  formatDateToISOEndOfDay(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59.999Z`;
  }
}
