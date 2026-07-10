import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent, StatusTransitionEvent } from '@lib/anatomy/types';
import type { OffreCommerciale, OffreCreate, OffreStatus } from '@applications/erp/ventes/models';

import { OffreFacade } from '../services';
import { buildOffreDetailConfig } from '../config';

@Component({
  selector: 'app-offre-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './offre-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class OffreDetailPage extends ConfigDrivenDetailPage<OffreCommerciale> {
  private readonly crud = inject(OffreFacade);
  protected override readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<OffreCommerciale, OffreCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildOffreDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('ventes.offre.createTitle');
    const item = this.item();
    return item
      ? `${item.numero} — ${item.clientName ?? ''}`
      : this.translate.instant('ventes.offre.detailTitle');
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    const updated = await this.crud.changeStatus(
      String(id),
      event.action as OffreStatus,
      event.note,
    );
    if (updated) this.item.set(updated);
  }

  protected override async handleCustomAction(event: DetailActionEvent<OffreCommerciale>): Promise<void> {
    const item = event.item;
    if (!item) {
      await super.handleCustomAction(event);
      return;
    }
    if (event.actionId === 'convert_bcc') {
      const { offre, bcc } = await this.crud.convertToBcc(item.id);
      this.item.set(offre);
      this.showSuccess(`BCC ${bcc.numero} créé`);
      await this.router.navigate(['/ventes/bons-commandes-clients', bcc.id]);
      return;
    }
    if (event.actionId === 'open_bcc' && item.bccId) {
      await this.router.navigate(['/ventes/bons-commandes-clients', item.bccId]);
      return;
    }
    await super.handleCustomAction(event);
  }
}
