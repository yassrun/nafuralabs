import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import { SmartImportTriggerComponent } from '@platform/features/documents/smart-import';
import { OuvrageImportHandlerRegistrar } from '@applications/erp/shared/smart-import/handlers/ouvrage-import.handler';

import type { Ouvrage } from '@applications/erp/etudes/models';

import { OuvrageFacade } from '../services';
import { buildOuvrageListingConfig } from '../config';

@Component({
  selector: 'app-ouvrage-listing',
  standalone: true,
  imports: [SmartImportTriggerComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './ouvrage-listing.page.html',
  styleUrls: ['./ouvrage-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class OuvrageListingPage extends ConfigDrivenListingPage<Ouvrage> {
  readonly facade = inject(OuvrageFacade);
  private readonly translate = inject(TranslateService);
  private readonly _importHandler = inject(OuvrageImportHandlerRegistrar);
  readonly config = buildOuvrageListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.bibliothequePrix.title');

  onSmartImportComplete(): void {
    this.listingComponent?.refresh();
  }
}
