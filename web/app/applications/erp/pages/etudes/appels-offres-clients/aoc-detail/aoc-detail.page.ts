import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import type {
  AppelOffreClient,
  AppelOffreClientCreate,
} from '@applications/erp/etudes/models';

import { AOCFacade } from '../services';
import { AOC_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-aoc-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  templateUrl: './aoc-detail.page.html',
  styleUrls: ['./aoc-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class AOCDetailPage extends ConfigDrivenDetailPage<AppelOffreClient> {
  private readonly crud = inject(AOCFacade);
  private readonly nav = inject(Router);

  readonly facade = createDetailFacadeFromCrud<AppelOffreClient, AppelOffreClientCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = AOC_DETAIL_CONFIG;

  readonly delaiRestant = computed(() => {
    const item = this.item();
    if (!item) return null;
    const target = new Date(item.dateLimiteDepot).getTime();
    return Math.round((target - Date.now()) / (1000 * 60 * 60 * 24));
  });

  get headerTitle(): string {
    if (this.mode() === 'create') return "Nouvel appel d'offres";
    const item = this.item();
    return item ? `${item.numero} — ${item.donneurOrdre}` : "Détail AO";
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<AppelOffreClient>,
  ): Promise<void> {
    if (event.actionId === 'convert_chantier' && event.item) {
      this.nav.navigate(['/chantiers/new'], {
        queryParams: { aocId: event.item.id },
      });
      return;
    }
    await super.handleCustomAction(event);
  }
}
