import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@lib/anatomy';
import type { Employe } from '@applications/erp/rh/models';

import { EmployeFacade } from '../services';
import { buildEmployesListingConfig } from '../config';

type QuickFilter = 'ALL' | 'ACTIF' | 'SUSPENDU';

@Component({
  selector: 'app-employe-listing',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './employe-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class EmployeListingPage extends ConfigDrivenListingPage<Employe> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(EmployeFacade);
  readonly config = buildEmployesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('rh.employe.listing.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, label: this.translate.instant('rh.employe.listing.chips.all') },
    { id: 'ACTIF' as QuickFilter, label: this.translate.instant('rh.employe.listing.chips.actifs') },
    { id: 'SUSPENDU' as QuickFilter, label: this.translate.instant('rh.employe.listing.chips.suspendus') },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { statut: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
