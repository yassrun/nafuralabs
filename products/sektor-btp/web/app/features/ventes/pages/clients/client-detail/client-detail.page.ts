import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { ClientVente, ClientVenteCreate } from '../models';

import { ClientVenteFacade } from '../services';
import { CLIENT_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './client-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class ClientDetailPage extends ConfigDrivenDetailPage<ClientVente> {
  private readonly crud = inject(ClientVenteFacade);

  readonly facade = createDetailFacadeFromCrud<ClientVente, ClientVenteCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = CLIENT_DETAIL_CONFIG;

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouveau client';
    const item = this.item();
    return item ? `${item.code} — ${item.nom}` : 'Détail client';
  }
}
