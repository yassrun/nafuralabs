
import { Component, AfterViewInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles} from '@platform/lib/anatomy';
import type { BonCommande } from '@app/achats/models';

import { BcFacade } from '../services';
import { buildBcListingConfig } from '../config';

@Component({
  selector: 'app-bc-listing',
  standalone: true,
  imports: [
    ...ConfigDrivenListingPageImports
],
  templateUrl: './bc-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class BcListingPage extends ConfigDrivenListingPage<BonCommande> implements AfterViewInit {
  readonly facade = inject(BcFacade);
  private readonly translate = inject(TranslateService);
  readonly config = buildBcListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.commande.headerTitle');

  ngAfterViewInit(): void {
    const chantierId = this.route.snapshot.queryParamMap.get('chantierId')?.trim();
    if (chantierId) {
      this.listingComponent?.onFilterChange({ chantierId });
    }
  }
}
