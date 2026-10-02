import { AfterViewInit, Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {
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

@Component({
  selector: 'app-situation-listing',
  standalone: true,
  imports: [FormsModule, NfSelectComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './situation-listing.page.html',
  styleUrls: ['./situation-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class SituationListingPage extends ConfigDrivenListingPage<Situation> implements AfterViewInit {
  readonly facade = inject(SituationFacade);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });
  readonly config = buildSituationsListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.situation.title');

  readonly selectedChantier = signal<string>('');

  readonly searchChantiers: LookupSearchFn = (q) =>
    this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]);

  onChantierChange(chantierId: string): void {
    this.selectedChantier.set(chantierId);
    const filters = chantierId ? { chantierId } : { chantierId: undefined };
    this.listingComponent?.onFilterChange(filters);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { chantierId: chantierId || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  ngAfterViewInit(): void {
    const chantierId = this.route.snapshot.queryParamMap.get('chantierId')?.trim() ?? '';
    if (chantierId) {
      queueMicrotask(() => this.onChantierChange(chantierId));
    }
  }
}
