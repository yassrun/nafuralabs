import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';

import type { Situation } from '@applications/erp/chantiers/models';

import { SituationFacade } from '../services';
import { buildSituationsListingConfig } from '../config';

type QuickFilter =
  | 'ALL'
  | 'BROUILLON'
  | 'A_VALIDER'
  | 'A_FACTURER'
  | 'EN_RETARD_PAIEMENT'
  | 'MES_SITUATIONS';

interface QuickFilterChip {
  id: QuickFilter;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-situation-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './situation-listing.page.html',
  styleUrls: ['./situation-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class SituationListingPage extends ConfigDrivenListingPage<Situation> {
  readonly facade = inject(SituationFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildSituationsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.situation.title');

  readonly quickFilter = signal<QuickFilter>('ALL');
  readonly selectedChantier = signal<string>('');

  readonly chips: QuickFilterChip[] = [
    { id: 'ALL', label: 'Toutes' },
    { id: 'BROUILLON', label: 'Brouillons' },
    { id: 'A_VALIDER', label: 'À valider' },
    { id: 'A_FACTURER', label: 'À facturer' },
    { id: 'EN_RETARD_PAIEMENT', label: 'En retard paiement' },
    { id: 'MES_SITUATIONS', label: 'Mes situations' },
  ];

  readonly currentChip = computed(() => this.quickFilter());
  readonly chantierOptions = computed(
    () => (this.facade.lookups()?.['chantiers'] ?? []) as { key: string; value: string }[],
  );

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    const filters = id === 'ALL' ? {} : { quick: id };
    this.listingComponent?.onFilterChange(filters);
  }

  onChantierChange(chantierId: string): void {
    this.selectedChantier.set(chantierId);
    const filters = chantierId ? { chantierId } : { chantierId: undefined };
    this.listingComponent?.onFilterChange(filters);
  }
}
