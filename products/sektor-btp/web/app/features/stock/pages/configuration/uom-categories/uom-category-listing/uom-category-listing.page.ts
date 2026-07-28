import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { UomCategoryFacade } from '../services';
import type { UomCategoryListItem } from '../models';
import { buildUomCategoryListingConfig } from '../config';

@Component({
  selector: 'app-uom-category-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './uom-category-listing.page.html',
  styleUrls: ['./uom-category-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class UomCategoryListingPage extends ConfigDrivenListingPage<UomCategoryListItem> {
  readonly facade = inject(UomCategoryFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildUomCategoryListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.configuration.uomCategory.headerTitle');

  protected override async handleCustomAction(
    event: ListingActionEvent<UomCategoryListItem>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled listing action:', event.actionId, event);
    }
  }
}
