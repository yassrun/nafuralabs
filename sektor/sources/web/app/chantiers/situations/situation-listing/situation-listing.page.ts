
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  type LookupSearchFn,
} from '@platform/lib/anatomy';

import type { Situation } from '@app/chantiers/models';

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
  imports: [FormsModule, ButtonComponent, NfSelectComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './situation-listing.page.html',
  styleUrls: ['./situation-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class SituationListingPage extends ConfigDrivenListingPage<Situation> {
  readonly facade = inject(SituationFacade);
  private readonly translate = inject(TranslateService);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });
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
  readonly searchChantiers: LookupSearchFn = (q) =>
    this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]);

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
