import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage, ConfigDrivenListingPageImports, ConfigDrivenListingPageStyles, ButtonComponent} from '@lib/anatomy';
import type { ContratAchat } from '@applications/erp/achats/models';

import { ContratFacade } from '../services';
import { buildContratsListingConfig } from '../config';

type QuickFilter = 'ALL' | 'ACTIFS' | 'EXPIRATION_PROCHE' | 'ECHUS';

@Component({
  selector: 'app-contrat-listing',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, TranslateModule, ...ConfigDrivenListingPageImports],
  templateUrl: './contrat-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class ContratListingPage extends ConfigDrivenListingPage<ContratAchat> {
  readonly facade = inject(ContratFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildContratsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.contrat.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ACTIFS');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'achats.contrat.chips.all' },
    { id: 'ACTIFS' as QuickFilter, labelKey: 'achats.contrat.chips.actifs' },
    { id: 'EXPIRATION_PROCHE' as QuickFilter, labelKey: 'achats.contrat.chips.expirationProche' },
    { id: 'ECHUS' as QuickFilter, labelKey: 'achats.contrat.chips.echus' },
  ];
  readonly currentChip = computed(() => this.quickFilter());
  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    this.listingComponent?.onFilterChange(id === 'ALL' ? {} : { quick: id });
  }
}
