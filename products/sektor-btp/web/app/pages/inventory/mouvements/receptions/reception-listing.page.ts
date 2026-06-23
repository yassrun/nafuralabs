import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenListingPage,
  ConfigDrivenListingPageImports,
  ConfigDrivenListingPageStyles,
} from '@lib/anatomy';
import type { ListingActionEvent } from '@lib/anatomy/types';

import { FournisseurApiService } from '@applications/erp/pages/achats/fournisseurs/services/fournisseur-api.service';
import { BcApiService } from '@applications/erp/pages/achats/commandes/services/bc-api.service';
import { LocationsApiService } from '@applications/erp/pages/inventory/configuration/depots/services/location-api.service';

import { buildReceptionListingConfig } from './config/listing/listing.config';
import { ReceptionFacade, type ReceptionListItem } from './services/reception.facade';

export interface ReceptionPrerequisite {
  id: string;
  label: string;
  route: string;
  met: boolean;
}

@Component({
  selector: 'app-reception-listing',
  standalone: true,
  imports: [...ConfigDrivenListingPageImports, RouterLink, TranslateModule],
  templateUrl: './reception-listing.page.html',
  styleUrls: ['./reception-listing.page.scss'],
  styles: [ConfigDrivenListingPageStyles],
})
export class ReceptionListingPage extends ConfigDrivenListingPage<ReceptionListItem> implements OnInit {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly fournisseurApi = inject(FournisseurApiService);
  private readonly locationsApi = inject(LocationsApiService);
  private readonly bcApi = inject(BcApiService);

  readonly facade = inject(ReceptionFacade);
  readonly config = buildReceptionListingConfig(this.translate);
  readonly headerTitle = this.translate.instant('inventory.mouvement.reception.headerTitle');

  readonly prerequisites = signal<ReceptionPrerequisite[]>([]);
  readonly prerequisitesReady = signal(false);
  readonly canCreate = signal(true);

  ngOnInit(): void {
    void this.loadPrerequisites();
  }

  override async onAction(event: ListingActionEvent<ReceptionListItem>): Promise<void> {
    if (
      (event.actionId === 'new' || event.actionId === 'create' || event.actionId === 'scan_bl') &&
      !this.canCreate()
    ) {
      return;
    }
    await super.onAction(event);
  }

  protected override async handleCustomAction(
    event: ListingActionEvent<ReceptionListItem>
  ): Promise<void> {
    if (event.actionId === 'scan_bl' || event.actionId === 'create' || event.actionId === 'new') {
      if (!this.canCreate()) {
        return;
      }
    }

    if (event.actionId === 'scan_bl') {
      this.router.navigate(['/inventory/mouvements/receptions/new'], {
        queryParams: { scanBl: '1' },
      });
      return;
    }

    if (event.actionId === 'create' || event.actionId === 'new') {
      this.router.navigate(['/inventory/mouvements/receptions/new']);
      return;
    }

    console.log('Unhandled listing action:', event.actionId, event);
  }

  private async loadPrerequisites(): Promise<void> {
    const tr = (key: string, fallback: string) => {
      const v = this.translate.instant(key);
      return v === key ? fallback : v;
    };

    try {
      const [fournisseurs, depots, bonsCommande] = await Promise.all([
        this.fournisseurApi.getAll({ page: 0, size: 1 }),
        this.locationsApi.getAll({ page: 0, size: 1 }),
        this.bcApi.getAll({ page: 0, size: 1 }),
      ]);

      const checks: ReceptionPrerequisite[] = [
        {
          id: 'fournisseur',
          label: tr('inventory.mouvement.reception.prerequisites.fournisseur', 'Au moins un fournisseur'),
          route: '/achats/fournisseurs/new',
          met: (fournisseurs.total ?? fournisseurs.items?.length ?? 0) > 0,
        },
        {
          id: 'depot',
          label: tr('inventory.mouvement.reception.prerequisites.depot', 'Au moins un dépôt'),
          route: '/inventory/configuration/depots/new',
          met: (depots.total ?? depots.items?.length ?? 0) > 0,
        },
        {
          id: 'bc',
          label: tr('inventory.mouvement.reception.prerequisites.bc', 'Au moins un bon de commande'),
          route: '/achats/commandes/new',
          met: (bonsCommande.total ?? bonsCommande.items?.length ?? 0) > 0,
        },
      ];

      this.prerequisites.set(checks);
      this.canCreate.set(checks.every((c) => c.met));
    } catch {
      this.canCreate.set(true);
    } finally {
      this.prerequisitesReady.set(true);
    }
  }
}
