import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { CostingMethodFacade } from '../services';
import type { CostingMethodListItem } from '../models';
import { buildCostingMethodListingConfig } from '../config';

@Component({
  selector: 'app-costing-method-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './costing-method-listing.page.html',
  styleUrls: ['./costing-method-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class CostingMethodListingPage extends ConfigDrivenListingPage<CostingMethodListItem> {
  readonly facade = inject(CostingMethodFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildCostingMethodListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.costingMethod.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<CostingMethodListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
