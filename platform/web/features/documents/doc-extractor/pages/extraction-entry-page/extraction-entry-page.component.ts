/**
 * Extraction Entry Page
 * 
 * Main entry point for the extraction flow with:
 * - Fast path section (recent doc types, last workspace, import CTA)
 * - Search functionality (search doc types and templates)
 * - Category cards for discovery
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { TenantContextService } from '../../../../../core/tenant/tenant.context';
import { DocTypeService } from '../../services/doc-type.service';
import { DocTypeListItem, DocTypesByDomain, DomainListItem } from '../../models/doc-type-definition.model';
import { FlipIconRtlDirective } from '../../../../../lib/anatomy/directives';

interface RecentDocType {
  domainKey: string;
  docTypeKey: string;
  name: string;
  icon: string;
  color: string;
  lastUsed: Date;
}

interface DomainCard {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  docTypeCount: number;
}

@Component({
  selector: 'app-extraction-entry-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatTooltipModule,
    TranslateModule,
    FlipIconRtlDirective,
  ],
  templateUrl: './extraction-entry-page.component.html',
  styleUrl: './extraction-entry-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionEntryPage {
  private readonly router = inject(Router);
  private readonly docTypeService = inject(DocTypeService);
  private readonly tenantContext = inject(TenantContextService);
  private readonly translate = inject(TranslateService);

  // State
  readonly loading = signal(false);
  readonly docTypesByDomain = signal<DocTypesByDomain | null>(null);
  readonly searchQuery = new FormControl<string>('', { nonNullable: true });
  readonly searchResults = signal<DocTypeListItem[]>([]);
  readonly showSearchResults = signal(false);

  // Recent doc types (mocked for now, would come from localStorage/API)
  readonly recentDocTypes = signal<RecentDocType[]>([
    {
      domainKey: 'logistic',
      docTypeKey: 'BL',
      name: 'Bon de livraison',
      icon: 'local_shipping',
      color: '#3f51b5',
      lastUsed: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
    {
      domainKey: 'finance',
      docTypeKey: 'INVOICE',
      name: 'Invoice',
      icon: 'receipt_long',
      color: '#4caf50',
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      domainKey: 'logistic',
      docTypeKey: 'PACKING_LIST',
      name: 'Packing list',
      icon: 'inventory_2',
      color: '#3f51b5',
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ]);

  // Last workspace (mocked)
  readonly lastWorkspace = signal<RecentDocType | null>({
    domainKey: 'logistic',
    docTypeKey: 'BL',
    name: 'Bon de livraison',
    icon: 'local_shipping',
    color: '#3f51b5',
    lastUsed: new Date(Date.now() - 1000 * 60 * 30),
  });

  // Selected domain for templates view
  readonly selectedDomain = signal<string | null>(null);

  // Domain cards computed from docTypesByDomain
  readonly domainCards = computed<DomainCard[]>(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];

    return Object.entries(byDomain.domains).map(([domainKey, domainData]) => {
      const metadata = this.getDomainMetadata(domainKey);
      return {
        id: domainKey,
        label: this.getDomainLabel(domainKey),
        description: metadata.description,
        icon: metadata.icon,
        color: metadata.color,
        docTypeCount: domainData.docTypes.length,
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  });

  // Templates for selected domain
  readonly selectedDomainTemplates = computed(() => {
    const domain = this.selectedDomain();
    if (!domain) return [];
    
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];

    return byDomain.domains[domain]?.docTypes ?? [];
  });

  readonly selectedDomainLabel = computed(() => {
    const domain = this.selectedDomain();
    if (!domain) return '';
    return this.getDomainLabel(domain);
  });

  // All doc types flattened for search
  readonly allDocTypes = computed<DocTypeListItem[]>(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];

    const all: DocTypeListItem[] = [];
    Object.entries(byDomain.domains).forEach(([domainKey, domainData]) => {
      domainData.docTypes.forEach(docType => {
        all.push({ ...docType, domainKey } as DocTypeListItem & { domainKey: string });
      });
    });
    return all;
  });

  constructor() {
    // Load doc types on init
    effect(() => {
      const tenantId = this.tenantContext.tenantId();
      if (tenantId) {
        this.loadDocTypes(tenantId);
      }
    });

    // Search functionality
    this.searchQuery.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
    ).subscribe(query => {
      if (!query?.trim()) {
        this.searchResults.set([]);
        this.showSearchResults.set(false);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = this.allDocTypes().filter(dt => 
        dt.name.toLowerCase().includes(lowerQuery) ||
        dt.docTypeKey.toLowerCase().includes(lowerQuery) ||
        (dt.description?.toLowerCase().includes(lowerQuery) ?? false)
      );
      this.searchResults.set(results.slice(0, 8)); // Limit to 8 results
      this.showSearchResults.set(true);
    });
  }

  private loadDocTypes(tenantId: string): void {
    this.loading.set(true);
    this.docTypeService.listActiveByTenant(tenantId).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.docTypesByDomain.set(data);
      },
      error: () => {
        this.loading.set(false);
        this.docTypesByDomain.set(null);
      },
    });
  }

  // Navigation actions
  onImportDocument(): void {
    // Navigate to workspace with import dialog
    // For now, navigate to extraction entry with a flag
    const last = this.lastWorkspace();
    if (last) {
      this.router.navigate(['/doc-extractor/extraction/workspace', last.domainKey, last.docTypeKey], {
        queryParams: { import: true },
      });
    } else {
      // If no last workspace, show domain selection
      this.router.navigate(['/doc-extractor/extraction']);
    }
  }

  onRecentDocTypeClick(recent: RecentDocType): void {
    this.navigateToWorkspace(recent.domainKey, recent.docTypeKey);
  }

  onContinueLastWorkspace(): void {
    const last = this.lastWorkspace();
    if (last) {
      this.navigateToWorkspace(last.domainKey, last.docTypeKey);
    }
  }

  onDomainClick(domainId: string): void {
    this.selectedDomain.set(domainId);
  }

  onBackToCategories(): void {
    this.selectedDomain.set(null);
  }

  onTemplateClick(domainKey: string, docTypeKey: string): void {
    this.navigateToWorkspace(domainKey, docTypeKey);
  }

  onSearchResultClick(docType: DocTypeListItem & { domainKey?: string }): void {
    const domainKey = (docType as any).domainKey || this.findDomainForDocType(docType.docTypeKey);
    if (domainKey) {
      this.navigateToWorkspace(domainKey, docType.docTypeKey);
    }
    this.clearSearch();
  }

  onCreateCustomDocType(): void {
    this.router.navigate(['/doc-extractor/doc-types'], {
      queryParams: { create: true },
    });
  }

  clearSearch(): void {
    this.searchQuery.setValue('');
    this.showSearchResults.set(false);
  }

  private navigateToWorkspace(domainKey: string, docTypeKey: string): void {
    this.router.navigate(['/doc-extractor/extraction/workspace', domainKey, docTypeKey]);
  }

  private findDomainForDocType(docTypeKey: string): string | null {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return null;

    for (const [domainKey, domainData] of Object.entries(byDomain.domains)) {
      if (domainData.docTypes.some(dt => dt.docTypeKey === docTypeKey)) {
        return domainKey;
      }
    }
    return null;
  }

  private getDomainLabel(domainKey: string): string {
    const labelMap: Record<string, string> = {
      'finance': 'Accounting & Finance',
      'btp': 'Construction / BTP',
      'logistic': 'Logistics',
      'inventory': 'Inventory',
    };
    return labelMap[domainKey] || domainKey.charAt(0).toUpperCase() + domainKey.slice(1);
  }

  private getDomainMetadata(domainKey: string): { description: string; icon: string; color: string } {
    const metadataMap: Record<string, { description: string; icon: string; color: string }> = {
      'logistic': {
        description: 'Delivery notes, transport docs, stock flows.',
        icon: 'local_shipping',
        color: '#3f51b5',
      },
      'finance': {
        description: 'Invoices, receipts, bank statements.',
        icon: 'account_balance',
        color: '#4caf50',
      },
      'btp': {
        description: 'Construction documents, building permits, site reports.',
        icon: 'construction',
        color: '#ff9800',
      },
      'inventory': {
        description: 'Stock management, warehouse documents.',
        icon: 'inventory_2',
        color: '#9c27b0',
      },
    };

    return metadataMap[domainKey] || {
      description: `Documents related to ${domainKey}.`,
      icon: 'folder',
      color: '#757575',
    };
  }

  getTemplateMetadata(docType: DocTypeListItem): { fields: number; hasTables: boolean; exportFormats: string[] } {
    // Mock metadata - in real implementation, this would come from the doc type definition
    return {
      fields: 18,
      hasTables: true,
      exportFormats: ['Excel', 'JSON'],
    };
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

