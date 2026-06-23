import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { StatusTransitionEvent } from '@lib/anatomy/types';
import type { BonCommandeClient, BCClientCreate, BCClientStatus } from '@applications/erp/ventes/models';

import { BccFacade } from '../services';
import { BCC_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-bcc-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './bcc-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class BccDetailPage extends ConfigDrivenDetailPage<BonCommandeClient> {
  private readonly crud = inject(BccFacade);

  readonly facade = createDetailFacadeFromCrud<BonCommandeClient, BCClientCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = BCC_DETAIL_CONFIG;

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouveau bon de commande client';
    const item = this.item();
    return item ? `${item.numero} — ${item.clientName ?? ''}` : 'Détail BCC';
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    const updated = await this.crud.changeStatus(
      String(id),
      event.action as BCClientStatus,
    );
    if (updated) this.item.set(updated);
  }
}
