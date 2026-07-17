import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles, ButtonComponent, ToastService} from '@lib/anatomy';
import type { Fournisseur } from '@applications/erp/achats/models';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/features/documents/smart-import';
import {
  FOURNISSEUR_IMPORT_DEFINITION,
  FournisseurImportService,
} from '@applications/erp/shared/smart-import/handlers/fournisseur-import.handler';

import { FournisseurFacade } from '../services';
import { buildFournisseursListingConfig } from '../config';

type QuickFilter = 'ALL' | 'ACTIFS' | 'INACTIFS' | 'TOP_NOTES';

@Component({
  selector: 'app-fournisseur-listing',
  standalone: true,
  imports: [
    ButtonComponent,CommonModule, TranslateModule, SmartImportTriggerComponent, ...ConfigDrivenListingPageImports],
  templateUrl: './fournisseur-listing.page.html',
  styles: [ConfigDrivenListingPageStyles],
})
export class FournisseurListingPage extends ConfigDrivenListingPage<Fournisseur> {
  readonly facade = inject(FournisseurFacade);
  private readonly translate = inject(TranslateService);
  private readonly importer = inject(FournisseurImportService);
  private readonly smartImportToast = inject(ToastService);
  readonly importDefinition = FOURNISSEUR_IMPORT_DEFINITION;
  readonly config = buildFournisseursListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('achats.fournisseur.headerTitle');

  readonly quickFilter = signal<QuickFilter>('ACTIFS');
  readonly chips = [
    { id: 'ALL' as QuickFilter, labelKey: 'achats.fournisseur.chips.all' },
    { id: 'ACTIFS' as QuickFilter, labelKey: 'achats.fournisseur.chips.actifs' },
    { id: 'INACTIFS' as QuickFilter, labelKey: 'achats.fournisseur.chips.inactifs' },
    { id: 'TOP_NOTES' as QuickFilter, labelKey: 'achats.fournisseur.chips.topNotes' },
  ];
  readonly currentChip = computed(() => this.quickFilter());

  selectChip(id: QuickFilter): void {
    this.quickFilter.set(id);
    let filters: Record<string, unknown> = {};
    if (id === 'ACTIFS') filters = { isActive: true };
    else if (id === 'INACTIFS') filters = { isActive: false };
    else if (id === 'TOP_NOTES') filters = { isActive: true };
    this.listingComponent?.onFilterChange(filters);
  }

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
