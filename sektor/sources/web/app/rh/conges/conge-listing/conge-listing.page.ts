
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  ButtonComponent,
} from '@platform/lib/anatomy';
import type { Conge } from '@app/rh/models';

import { CongeFacade } from '../services';
import { buildCongesListingConfig } from '../config';

type QuickFilter = 'ALL' | 'DEMANDE' | 'APPROUVE' | 'EN_COURS';

@Component({
  selector: 'app-conge-listing',
  standalone: true,
  imports: [ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './conge-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class CongeListingPage extends ConfigDrivenListingPage<Conge> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(CongeFacade);
  readonly config = buildCongesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('rh.conge.listing.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, label: this.translate.instant('rh.conge.listing.chips.all') },
    { id: 'DEMANDE' as QuickFilter, label: this.translate.instant('rh.conge.listing.chips.demande') },
    { id: 'APPROUVE' as QuickFilter, label: this.translate.instant('rh.conge.listing.chips.approuve') },
    { id: 'EN_COURS' as QuickFilter, label: this.translate.instant('rh.conge.listing.chips.enCours') },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
