import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { BasePageClass } from '../../../../../core/pages/base-page.class';
import { BreadcrumbComponent } from '../../../../../core/components/breadcrumb/breadcrumb.component';
import { DocTypeService } from '../../services/doc-type.service';
import { TenantContextService } from '../../../../../core/tenant/tenant.context';
import { DocTypeListItem, DocTypesByDomain } from '../../models/doc-type-definition.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-doc-extractor-settings',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './doc-extractor-settings.component.html',
  styleUrl: './doc-extractor-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocExtractorSettingsComponent extends BasePageClass {
  private readonly docTypeService = inject(DocTypeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected override pageTitle = 'Document Type Definitions';

  readonly loading = signal(false);
  readonly docTypesByDomain = signal<DocTypesByDomain | null>(null);

  readonly domainsList = computed(() => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];
    return Object.keys(byDomain.domains).sort();
  });

  readonly getDocTypesForDomain = (domainKey: string): DocTypeListItem[] => {
    const byDomain = this.docTypesByDomain();
    if (!byDomain) return [];
    const domainData = byDomain.domains[domainKey];
    return domainData?.docTypes ?? [];
  };

  constructor() {
    super();
    // Load doc types when tenantId changes
    effect(() => {
      const tenantId = this.tenantContext.tenantId();
      if (tenantId) {
        this.loadDocTypes();
      }
    });
  }

  protected override onPageInit(): void {
    // Page initialization logic if needed
  }

  loadDocTypes(): void {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      this.snackBar.open('Tenant ID is required.', 'Dismiss', { duration: 5000 });
      return;
    }

    this.loading.set(true);
    this.docTypeService.listActiveByTenant(tenantId).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.docTypesByDomain.set(data);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.snackBar.open(this.humanizeHttpError(err), 'Dismiss', { duration: 6000 });
        this.docTypesByDomain.set(null);
      },
    });
  }

  viewDefinition(domainKey: string, docTypeKey: string): void {
    // TODO: Navigate to edit/view page or open dialog
    this.snackBar.open(
      `Viewing ${domainKey}/${docTypeKey} - Edit functionality coming soon`,
      'Dismiss',
      { duration: 3000 }
    );
  }

  createNew(): void {
    // TODO: Navigate to create page or open dialog
    this.snackBar.open('Create new definition - Coming soon', 'Dismiss', { duration: 3000 });
  }

  private humanizeHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const serverMsg =
        (typeof err.error === 'string' && err.error) ||
        (err.error && typeof err.error === 'object' && 'message' in err.error
          ? String((err.error as any).message)
          : '');
      return serverMsg || `Request failed (${err.status}).`;
    }
    return 'Unexpected error.';
  }
}


