import { Component, inject, OnInit, AfterViewInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { buildSortieListingConfig } from './config/listing/listing.config';
import { SortieFacade, type SortieListItem } from './services/sortie.facade';

@Component({
  selector: 'app-sortie-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports, TranslateModule],
  templateUrl: './sortie-listing.page.html',
  styleUrls: ['./sortie-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class SortieListingPage extends ConfigDrivenListingPage<SortieListItem> implements OnInit, AfterViewInit {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(SortieFacade);
  readonly config = buildSortieListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.mouvement.sortie.headerTitle');

  readonly kpiMonth = signal<number>(0);
  readonly kpiValide = signal<number>(0);

  ngOnInit(): void {
    void this.loadKpis();
  }

  ngAfterViewInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const chantierBudgetId = qp.get('chantierBudgetId');
    const articleId = qp.get('articleId');
    if (!chantierBudgetId && !articleId) return;
    queueMicrotask(() => {
      const listing = this.listingComponent;
      if (!listing) return;
      listing.onFilterChange({
        ...listing.filterValues(),
        ...(chantierBudgetId ? { chantierBudgetId } : {}),
        ...(articleId ? { articleId } : {}),
      });
    });
  }

  private async loadKpis(): Promise<void> {
    try {
      const kpis = await this.facade.getKpis();
      this.kpiMonth.set(kpis.totalMonth);
      this.kpiValide.set(kpis.totalValide);
    } catch {
      // ignore
    }
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<SortieListItem>,
  ): Promise<void> {
    console.log('Unhandled listing action:', event.actionId, event);
  }
}
