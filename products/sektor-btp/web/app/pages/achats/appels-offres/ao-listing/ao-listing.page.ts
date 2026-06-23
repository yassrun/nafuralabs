import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent} from '@lib/anatomy';
import type { AppelOffre } from '@applications/erp/achats/models';

import { AoFacade } from '../services';
import { buildAoListingConfig } from '../config';

type QuickFilter = 'ALL' | 'EN_COURS' | 'A_CLOTURER' | 'ATTRIBUES';

@Component({
  selector: 'app-ao-listing',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, TranslateModule, ...ConfigDrivenListingPageImports],
  templateUrl: './ao-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class AoListingPage extends ConfigDrivenListingPage<AppelOffre> {
  readonly facade = inject(AoFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildAoListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.appelOffre.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'achats.appelOffre.chips.all' },
    { id: 'EN_COURS' as QuickFilter, labelKey: 'achats.appelOffre.chips.enCours' },
    { id: 'A_CLOTURER' as QuickFilter, labelKey: 'achats.appelOffre.chips.aCloturer' },
    { id: 'ATTRIBUES' as QuickFilter, labelKey: 'achats.appelOffre.chips.attribues' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { quick: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
