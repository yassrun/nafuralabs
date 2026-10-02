
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@platform/lib/anatomy';
import type { Employe } from '@app/rh/models';
import type { ReviewedExtraction } from '@platform/app/document-extraction/smart-import';
import { EmployeImportService } from '@app/socle/shared/smart-import/handlers/employe-import.handler';

import { EmployeFacade } from '../services';
import { buildEmployesListingConfig } from '../config';

@Component({
  selector: 'app-employe-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports],
  templateUrl: './employe-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class EmployeListingPage extends ConfigDrivenListingPage<Employe> {
  private readonly translate = inject(TranslateService);
  readonly facade = inject(EmployeFacade);
  private readonly importer = inject(EmployeImportService);
  readonly config = buildEmployesListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('rh.employe.listing.headerTitle');

  async onSmartImportComplete(result: ReviewedExtraction): Promise<void> {
    await this.importer.import(result.data);
    this.listingComponent?.refresh();
  }
}
