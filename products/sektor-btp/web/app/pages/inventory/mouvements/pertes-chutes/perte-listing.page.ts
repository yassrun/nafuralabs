import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { buildPerteListingConfig } from './config/listing/listing.config';
import { PerteFacade, type PerteListItem } from './services/perte.facade';

@Component({
  selector: 'app-perte-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports, TranslateModule],
  templateUrl: './perte-listing.page.html',
  styleUrls: ['./perte-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class PerteListingPage extends ConfigDrivenListingPage<PerteListItem> implements OnInit {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(PerteFacade);
  readonly config = buildPerteListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.mouvement.perte.headerTitle');

  readonly kpiMonth = signal<number>(0);
  readonly kpiTotal = signal<number>(0);

  ngOnInit(): void {
    void this.loadKpis();
  }

  private async loadKpis(): Promise<void> {
    try {
      const kpis = await this.facade.getKpis();
      this.kpiMonth.set(kpis.totalMonth);
      this.kpiTotal.set(kpis.totalChantier);
    } catch {
      // ignore
    }
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<PerteListItem>,
  ): Promise<void> {
    console.log('Unhandled listing action:', event.actionId, event);
  }
}
