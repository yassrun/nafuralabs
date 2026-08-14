
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent} from '@platform/lib/anatomy';
import type { BonCommandeClient } from '@app/ventes/models';

import { BccFacade } from '../services';
import { BCC_LISTING_CONFIG } from '../config';

type BCCStatusFilter = 'ALL' | 'RECU' | 'EN_COURS' | 'PARTIELLEMENT_FACTURE' | 'FACTURE';

@Component({
  selector: 'app-bcc-listing',
  standalone: true,
  imports: [
    ButtonComponent,
    ...ConfigDrivenListingPageImports
],
  templateUrl: './bcc-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class BccListingPage extends ConfigDrivenListingPage<BonCommandeClient> {
  readonly facade = inject(BccFacade);
  readonly config = BCC_LISTING_CONFIG;
  readonly headerTitle = 'Bons de commande clients';

  readonly statusFilter = signal<BCCStatusFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as BCCStatusFilter, label: 'Tous' },
    { id: 'RECU' as BCCStatusFilter, label: 'Reçus' },
    { id: 'EN_COURS' as BCCStatusFilter, label: 'En cours' },
    { id: 'PARTIELLEMENT_FACTURE' as BCCStatusFilter, label: 'Part. facturés' },
    { id: 'FACTURE' as BCCStatusFilter, label: 'Facturés' },
  ];
  readonly currentChip = computed(() => this.statusFilter());

  selectChip(id: BCCStatusFilter): void {
    this.statusFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
