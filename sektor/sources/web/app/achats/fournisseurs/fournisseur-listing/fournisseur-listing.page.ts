
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent, ToastService} from '@platform/lib/anatomy';
import type { Fournisseur } from '@app/achats/models';
import type { ReviewedExtraction } from '@platform/app/document-extraction/smart-import';
import {
  FournisseurImportService,
} from '@app/socle/shared/smart-import/handlers/fournisseur-import.handler';

import { FournisseurFacade } from '../services';
import { buildFournisseursListingConfig } from '../config';

@Component({
  selector: 'app-fournisseur-listing',
  standalone: true,
  imports: [
    ButtonComponent,
    RouterLink,
    ...ConfigDrivenListingPageImports
],
  templateUrl: './fournisseur-listing.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [ConfigDrivenListingPageStyles],
})
export class FournisseurListingPage extends ConfigDrivenListingPage<Fournisseur> {
  readonly facade = inject(FournisseurFacade);
  private readonly translate = inject(TranslateService);
  private readonly importer = inject(FournisseurImportService);
  private readonly smartImportToast = inject(ToastService);
  readonly config = buildFournisseursListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.fournisseur.headerTitle');

  async onSmartImportComplete(result: ReviewedExtraction): Promise<void> {
    try {
      const importResult = await this.importer.import(result.data);
      this.listingComponent?.refresh();
      this.smartImportToast.success(
        `${importResult.created} fournisseur(s) ajouté(s), ${importResult.skippedDuplicates} doublon(s) ignoré(s).`,
      );
    } catch (error) {
      console.error('[fournisseur-smart-import]', error);
      this.smartImportToast.error('Impossible d’ajouter les fournisseurs extraits.');
    }
  }
}
