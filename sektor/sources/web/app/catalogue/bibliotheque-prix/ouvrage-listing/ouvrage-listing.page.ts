import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';
import {
  OUVRAGE_IMPORT_DEFINITION,
  OuvrageImportService,
} from '@app/socle/shared/smart-import/handlers/ouvrage-import.handler';

import type { Ouvrage } from '@app/etudes/models';

import { OuvrageFacade } from '../services';
import { buildOuvrageListingConfig } from '../config';

@Component({
  selector: 'app-ouvrage-listing',
  standalone: true,
  imports: [SmartImportTriggerComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './ouvrage-listing.page.html',
  styleUrls: ['./ouvrage-listing.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class OuvrageListingPage extends ConfigDrivenListingPage<Ouvrage> {
  readonly facade = inject(OuvrageFacade);
  private readonly translate = inject(TranslateService);
  private readonly importer = inject(OuvrageImportService);
  readonly importDefinition = OUVRAGE_IMPORT_DEFINITION;
  readonly config = buildOuvrageListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('chantiers.bibliothequePrix.title');

  async onSmartImportComplete(result: ReviewedExtraction): Promise<void> {
    await this.importer.import(result.data);
    this.listingComponent?.refresh();
  }
}
