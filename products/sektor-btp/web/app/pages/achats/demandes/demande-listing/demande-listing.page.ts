import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent} from '@lib/anatomy';
import type { DemandeAchat } from '@applications/erp/achats/models';

import { DemandeFacade } from '../services';
import { buildDemandesListingConfig } from '../config';

type QuickFilter = 'ALL' | 'A_APPROUVER' | 'MES_DEMANDES' | 'URGENT' | 'NON_CONVERTIES';

@Component({
  selector: 'app-demande-listing',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, TranslateModule, ...ConfigDrivenListingPageImports],
  templateUrl: './demande-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class DemandeListingPage extends ConfigDrivenListingPage<DemandeAchat> {
  readonly facade = inject(DemandeFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildDemandesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.demande.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'achats.demande.chips.all' },
    { id: 'A_APPROUVER' as QuickFilter, labelKey: 'achats.demande.chips.aApprouver' },
    { id: 'NON_CONVERTIES' as QuickFilter, labelKey: 'achats.demande.chips.nonConverties' },
    { id: 'URGENT' as QuickFilter, labelKey: 'achats.demande.chips.urgent' },
    { id: 'MES_DEMANDES' as QuickFilter, labelKey: 'achats.demande.chips.mesDemandes' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { quick: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
