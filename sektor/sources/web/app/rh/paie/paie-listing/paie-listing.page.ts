
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@platform/lib/anatomy';
import type { FichePaie } from '@app/rh/models';

import { PaieFacade } from '../services';
import { buildPaieListingConfig } from '../config';

type QuickFilter = 'ALL' | 'BROUILLON' | 'VALIDEE' | 'PAYEE';

@Component({
  selector: 'app-paie-listing',
  standalone: true,
  imports: [ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './paie-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class PaieListingPage extends ConfigDrivenListingPage<FichePaie> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(PaieFacade);
  readonly config = buildPaieListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('rh.paie.listing.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, label: this.translate.instant('rh.paie.listing.chips.all') },
    { id: 'BROUILLON' as QuickFilter, label: this.translate.instant('rh.paie.listing.chips.brouillon') },
    { id: 'VALIDEE' as QuickFilter, label: this.translate.instant('rh.paie.listing.chips.validee') },
    { id: 'PAYEE' as QuickFilter, label: this.translate.instant('rh.paie.listing.chips.payee') },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
