import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent} from '@lib/anatomy';
import type { BonCommande } from '@applications/erp/achats/models';

import { BcFacade } from '../services';
import { buildBcListingConfig } from '../config';

type QuickFilter = 'ALL' | 'A_VALIDER' | 'EN_COURS_LIVRAISON' | 'EN_RETARD' | 'A_FACTURER';

@Component({
  selector: 'app-bc-listing',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, TranslateModule, ...ConfigDrivenListingPageImports],
  templateUrl: './bc-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class BcListingPage extends ConfigDrivenListingPage<BonCommande> {
  readonly facade = inject(BcFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildBcListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.commande.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'achats.commande.chips.all' },
    { id: 'A_VALIDER' as QuickFilter, labelKey: 'achats.commande.chips.aValider' },
    { id: 'EN_COURS_LIVRAISON' as QuickFilter, labelKey: 'achats.commande.chips.enCoursLivraison' },
    { id: 'EN_RETARD' as QuickFilter, labelKey: 'achats.commande.chips.enRetard' },
    { id: 'A_FACTURER' as QuickFilter, labelKey: 'achats.commande.chips.aFacturer' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { quick: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
