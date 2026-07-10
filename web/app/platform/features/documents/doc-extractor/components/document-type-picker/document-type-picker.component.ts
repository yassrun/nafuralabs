/**
 * Document Type Picker Dialog
 * 
 * Premium, structured picker for selecting document types.
 * Replaces plain dropdowns with an enterprise-grade selection experience.
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { DocTypeListItem, DocTypesByDomain } from '../../models/doc-type-definition.model';

export interface DocumentTypePickerData {
  docTypesByDomain: DocTypesByDomain;
  selectedDomainKey?: string | null;
  selectedDocTypeKey?: string | null;
}

export interface DocumentTypePickerResult {
  domainKey: string;
  docTypeKey: string;
}

@Component({
  selector: 'app-document-type-picker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './document-type-picker.component.html',
  styleUrl: './document-type-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTypePickerComponent {
  private readonly dialogRef = inject(MatDialogRef<DocumentTypePickerComponent, DocumentTypePickerResult>);
  private readonly data = inject<DocumentTypePickerData>(MAT_DIALOG_DATA);

  // Input data from dialog data
  readonly docTypesByDomain = signal<DocTypesByDomain | null>(this.data?.docTypesByDomain || null);
  readonly selectedDomainKey = signal<string | null>(this.data?.selectedDomainKey || null);
  readonly selectedDocTypeKey = signal<string | null>(this.data?.selectedDocTypeKey || null);

  // Search
  readonly searchQuery = new FormControl<string>('', { nonNullable: true });
  readonly searchQueryValue = signal<string>('');

  constructor() {
    // Debounce search input
    this.searchQuery.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((value) => {
        this.searchQueryValue.set(value.toLowerCase().trim());
      });
  }

  /**
   * Get domain label for display.
   */
  getDomainLabel(domainKey: string): string {
    const labelMap: Record<string, string> = {
      'finance': 'Accounting & Finance',
      'btp': 'Construction / BTP',
      'logistic': 'Logistics',
      'inventory': 'Inventory',
    };
    return labelMap[domainKey] || domainKey.charAt(0).toUpperCase() + domainKey.slice(1);
  }

  /**
   * Get domain icon.
   */
  getDomainIcon(domainKey: string): string {
    const iconMap: Record<string, string> = {
      'logistic': 'local_shipping',
      'finance': 'account_balance',
      'btp': 'construction',
      'inventory': 'inventory_2',
    };
    return iconMap[domainKey] || 'folder';
  }

  /**
   * Get grouped and filtered document types.
   */
  readonly groupedDocTypes = computed(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];

    const search = this.searchQueryValue();
    const groups: Array<{
      domainKey: string;
      label: string;
      icon: string;
      docTypes: Array<DocTypeListItem & { domainKey: string }>;
    }> = [];

    Object.entries(byDomain.domains).forEach(([domainKey, domainData]) => {
      const filtered = domainData.docTypes.filter((docType) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
          docType.name.toLowerCase().includes(searchLower) ||
          docType.docTypeKey.toLowerCase().includes(searchLower) ||
          domainKey.toLowerCase().includes(searchLower) ||
          this.getDomainLabel(domainKey).toLowerCase().includes(searchLower)
        );
      });

      if (filtered.length > 0) {
        groups.push({
          domainKey,
          label: this.getDomainLabel(domainKey),
          icon: this.getDomainIcon(domainKey),
          docTypes: filtered.map((dt) => ({ ...dt, domainKey })),
        });
      }
    });

    // Sort groups by label
    return groups.sort((a, b) => a.label.localeCompare(b.label));
  });

  /**
   * Check if a document type is selected.
   */
  isSelected(domainKey: string, docTypeKey: string): boolean {
    return (
      this.selectedDomainKey() === domainKey && this.selectedDocTypeKey() === docTypeKey
    );
  }

  /**
   * Select a document type and close the dialog.
   */
  selectDocType(domainKey: string, docTypeKey: string): void {
    this.dialogRef.close({ domainKey, docTypeKey });
  }

  /**
   * Cancel selection.
   */
  cancel(): void {
    this.dialogRef.close();
  }
}
