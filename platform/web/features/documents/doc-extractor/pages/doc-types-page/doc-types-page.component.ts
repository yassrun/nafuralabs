/**
 * Doc Types Page
 * 
 * Document type definitions management:
 * - List of configured doc types
 * - Create new doc type
 * - Edit existing doc type
 * - Status management (Draft/Published/Deprecated)
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { TenantContextService } from '../../../../../core/tenant/tenant.context';
import { DocTypeService } from '../../services/doc-type.service';
import { DocTypeOrigin } from '../../models/doc-type-definition.model';

interface DocTypeItem {
  id: string;
  domainKey: string;
  docTypeKey: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  origin: DocTypeOrigin;
  tenantId?: string;
  version: number;
  fieldCount: number;
  hasTable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-doc-types-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './doc-types-page.component.html',
  styleUrl: './doc-types-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocTypesPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly docTypeService = inject(DocTypeService);
  private readonly tenantContext = inject(TenantContextService);

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly docTypes = signal<DocTypeItem[]>([]);

  // Filters (using signals for reactivity)
  readonly originFilter = new FormControl<string>('', { nonNullable: true });
  readonly domainFilter = new FormControl<string>('', { nonNullable: true });
  readonly searchQuery = new FormControl<string>('', { nonNullable: true });

  // Signal versions of filter values for reactivity in computed
  private readonly originValue = signal('');
  private readonly domainValue = signal('');
  private readonly searchValue = signal('');

  // Filtered doc types
  readonly filteredDocTypes = computed(() => {
    let types = this.docTypes();
    
    const origin = this.originValue();
    if (origin) {
      types = types.filter(t => t.origin === origin);
    }

    const domain = this.domainValue();
    if (domain) {
      types = types.filter(t => t.domainKey === domain);
    }

    const query = this.searchValue().toLowerCase();
    if (query) {
      types = types.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.docTypeKey.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    return types;
  });

  // Grouped doc types by domain
  readonly groupedDocTypes = computed(() => {
    const types = this.filteredDocTypes();
    const groups: { domainKey: string; docTypes: DocTypeItem[] }[] = [];
    const domainMap = new Map<string, DocTypeItem[]>();

    // Group by domain
    for (const dt of types) {
      if (!domainMap.has(dt.domainKey)) {
        domainMap.set(dt.domainKey, []);
      }
      domainMap.get(dt.domainKey)!.push(dt);
    }

    // Sort domains by predefined order
    const domainOrder = ['logistic', 'finance', 'inventory', 'btp'];
    const sortedDomains = Array.from(domainMap.keys()).sort((a, b) => {
      const indexA = domainOrder.indexOf(a);
      const indexB = domainOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    for (const domainKey of sortedDomains) {
      groups.push({
        domainKey,
        docTypes: domainMap.get(domainKey)!.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    return groups;
  });

  // Origin/Source options
  readonly originOptions = [
    { value: '', label: 'All Sources' },
    { value: 'SYSTEM', label: 'Doxura Standard' },
    { value: 'TENANT', label: 'Custom' },
  ];

  // Domain options
  readonly domainOptions = [
    { value: '', label: 'All Domains' },
    { value: 'logistic', label: 'Logistics' },
    { value: 'finance', label: 'Accounting & Finance' },
    { value: 'btp', label: 'Construction / BTP' },
    { value: 'inventory', label: 'Inventory' },
  ];

  constructor() {
    // Sync FormControl values to signals for reactivity
    this.originFilter.valueChanges.subscribe(v => this.originValue.set(v));
    this.domainFilter.valueChanges.subscribe(v => this.domainValue.set(v));
    this.searchQuery.valueChanges.subscribe(v => this.searchValue.set(v));

    // Load doc types from API
    effect(() => {
      const tenantId = this.tenantContext.tenantId();
      if (tenantId) {
        this.loading.set(true);
        this.error.set(null);
        this.docTypeService.listActiveByTenant(tenantId).subscribe({
          next: (data) => {
            // Transform API response to DocTypeItem array
            const items: DocTypeItem[] = [];
            if (data?.domains) {
              for (const domainKey of Object.keys(data.domains)) {
                const domainData = data.domains[domainKey];
                if (domainData?.docTypes) {
                  for (const dt of domainData.docTypes) {
                    items.push({
                      id: `${dt.domainKey}-${dt.docTypeKey}`,
                      domainKey: dt.domainKey,
                      docTypeKey: dt.docTypeKey,
                      name: dt.name,
                      description: dt.description || '',
                      status: 'PUBLISHED', // API returns only active/published types
                      origin: dt.origin || 'SYSTEM',
                      tenantId: dt.tenantId,
                      version: dt.activeVersion,
                      fieldCount: 0, // Not available from list endpoint
                      hasTable: false, // Not available from list endpoint
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    });
                  }
                }
              }
            }
            this.docTypes.set(items);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Failed to load doc types:', err);
            this.error.set('Failed to load document types');
            this.loading.set(false);
          },
        });
      }
    });

    // Handle create query param
    this.route.queryParams.subscribe(params => {
      if (params['create'] === 'true') {
        this.onCreateDocType();
      }
    });
  }

  // Actions
  onCreateDocType(): void {
    // Dedicated Doc Types area owns creation flow (placeholder)
    this.router.navigate(['/doc-extractor/doc-types'], {
      queryParams: { create: true },
    });
  }

  onEditDocType(docType: DocTypeItem): void {
    this.router.navigate(['/doc-extractor/doc-types', docType.domainKey, docType.docTypeKey], {
      queryParams: { version: docType.version },
    });
  }

  onViewInWorkspace(docType: DocTypeItem): void {
    this.router.navigate(['/doc-extractor/extraction/workspace', docType.domainKey, docType.docTypeKey]);
  }

  onDuplicateDocType(docType: DocTypeItem): void {
    // Would create a copy of the doc type
    console.log('Duplicate:', docType.docTypeKey);
  }

  onCloneDocType(docType: DocTypeItem): void {
    // Clone a system doc type to create a tenant-owned customized version
    console.log('Clone system doc type:', docType.docTypeKey);
    // TODO: Navigate to builder with cloned data
    this.router.navigate(['/doc-extractor/doc-types'], {
      queryParams: { clone: docType.id },
    });
  }

  onViewDocType(docType: DocTypeItem): void {
    // View a system doc type (read-only)
    this.router.navigate(['/doc-extractor/doc-types', docType.domainKey, docType.docTypeKey], {
      queryParams: { version: docType.version, readonly: true },
    });
  }

  onDeleteDocType(docType: DocTypeItem): void {
    // Delete a tenant-owned doc type
    if (docType.origin === 'SYSTEM') {
      console.warn('Cannot delete system doc types');
      return;
    }
    console.log('Delete:', docType.docTypeKey);
    // TODO: Confirm dialog + API call
  }

  clearFilters(): void {
    this.originFilter.setValue('');
    this.domainFilter.setValue('');
    this.searchQuery.setValue('');
    // Also reset signals directly (valueChanges will fire, but this ensures immediate update)
    this.originValue.set('');
    this.domainValue.set('');
    this.searchValue.set('');
  }

  // Helpers
  getStatusInfo(status: string): { label: string; variant: string } {
    const statusMap: Record<string, { label: string; variant: string }> = {
      'DRAFT': { label: 'Draft', variant: 'warning' },
      'PUBLISHED': { label: 'Published', variant: 'success' },
      'DEPRECATED': { label: 'Deprecated', variant: 'default' },
    };
    return statusMap[status] || { label: status, variant: 'default' };
  }

  getDomainLabel(domainKey: string): string {
    const labelMap: Record<string, string> = {
      'finance': 'Finance',
      'btp': 'BTP',
      'logistic': 'Logistics',
      'inventory': 'Inventory',
    };
    return labelMap[domainKey] || domainKey;
  }

  getDomainIcon(domainKey: string): string {
    const iconMap: Record<string, string> = {
      'logistic': 'local_shipping',
      'finance': 'account_balance',
      'btp': 'construction',
      'inventory': 'inventory_2',
    };
    return iconMap[domainKey] || 'folder';
  }

  getDomainColor(domainKey: string): string {
    const colorMap: Record<string, string> = {
      'logistic': '#3f51b5',
      'finance': '#4caf50',
      'btp': '#ff9800',
      'inventory': '#9c27b0',
    };
    return colorMap[domainKey] || '#757575';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
}

