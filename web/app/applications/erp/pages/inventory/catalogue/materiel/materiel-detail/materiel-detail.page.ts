/**
 * Matériel Detail Page with Affectations Tab
 */

import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';

import { MaterielFacade } from '../services';
import type { Materiel, MaterielCreate } from '../models';
import { buildMaterielDetailConfig } from '../config';
import { PARC_DETAIL_ROUTES } from '../config/detail/parc-routes';
import {
  MaterielAffectationApiService,
  apiToAffectationChantier,
} from '@applications/erp/inventory/services/materiel-affectation-api.service';
import type { AffectationChantier } from '@applications/erp/inventory/models';

@Component({
  selector: 'app-materiel-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports, CommonModule, TranslateModule],
  templateUrl: './materiel-detail.page.html',
  styleUrls: ['./materiel-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class MaterielDetailPage extends ConfigDrivenDetailPage<Materiel> {
  private readonly crud = inject(MaterielFacade);
  private readonly affectationApi = inject(MaterielAffectationApiService);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Materiel, MaterielCreate>({
    crud: this.crud,
  });
  readonly config = buildMaterielDetailConfig(
    this.translate,
    this.router.url.startsWith('/materiel/parc') ? PARC_DETAIL_ROUTES : undefined,
  );

  readonly affectations = signal<AffectationChantier[]>([]);

  constructor() {
    super();
    effect(() => {
      const item = this.item();
      if (item?.id) {
        void this.loadAffectations(item.id);
      } else {
        this.affectations.set([]);
      }
    });
  }

  private async loadAffectations(materielId: string): Promise<void> {
    const rows = await this.affectationApi.list({ materielId });
    this.affectations.set(rows.map(apiToAffectationChantier));
  }

  getStatusVariant(aff: AffectationChantier): string {
    return aff.dateFin ? 'neutral' : 'success';
  }

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return this.translate.instant('inventory.catalogue.materiel.headerTitleNew');
    const item = this.item();
    return item
      ? `${item.code} — ${item.name}`
      : this.translate.instant('inventory.catalogue.materiel.headerTitleDetail');
  }
}
