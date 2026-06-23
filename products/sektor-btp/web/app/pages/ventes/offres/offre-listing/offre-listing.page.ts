import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent} from '@lib/anatomy';
import type { OffreCommerciale } from '@applications/erp/ventes/models';

import { OffreFacade } from '../services';
import { buildOffreListingConfig } from '../config';

type OffreStatusFilter = 'ALL' | 'BROUILLON' | 'ENVOYEE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE';

@Component({
  selector: 'app-offre-listing',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, ...ConfigDrivenListingPageImports],
  templateUrl: './offre-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class OffreListingPage extends ConfigDrivenListingPage<OffreCommerciale> {
  readonly facade = inject(OffreFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildOffreListingConfig(this.translate);
  readonly headerTitle = 'Offres commerciales';

  readonly statusFilter = signal<OffreStatusFilter>('ALL');
  readonly chips = [
    { id: 'ALL' as OffreStatusFilter, label: 'Toutes' },
    { id: 'BROUILLON' as OffreStatusFilter, label: 'Brouillon' },
    { id: 'ENVOYEE' as OffreStatusFilter, label: 'Envoyées' },
    { id: 'ACCEPTEE' as OffreStatusFilter, label: 'Acceptées' },
    { id: 'REFUSEE' as OffreStatusFilter, label: 'Refusées' },
    { id: 'EXPIREE' as OffreStatusFilter, label: 'Expirées' },
  ];
  readonly currentChip = computed(() => this.statusFilter());

  selectChip(id: OffreStatusFilter): void {
    this.statusFilter.set(id);
    const filters = id === 'ALL' ? {} : { status: id };
    this.listingComponent?.onFilterChange(filters);
  }
}
