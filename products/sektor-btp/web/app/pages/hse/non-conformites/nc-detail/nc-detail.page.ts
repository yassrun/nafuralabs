import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { NonConformite, NonConformiteCreate } from '@applications/erp/hse/models';

import { NcFacade } from '../services';
import { buildNcDetailConfig } from '../config';

@Component({
  selector: 'app-nc-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './nc-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class NcDetailPage extends ConfigDrivenDetailPage<NonConformite> {
  private readonly crud = inject(NcFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<NonConformite, NonConformiteCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildNcDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('hse.nonConformite.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.type}` : this.translate.instant('hse.nonConformite.detailTitle');
  }

  protected override async handleCustomAction(event: DetailActionEvent<NonConformite>): Promise<void> {
    const item = event.item;

    if (event.actionId === 'traiter' && item) {
      const updated = await this.crud.traiter(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.nonConformite.toasts.processed').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'verifier' && item) {
      const updated = await this.crud.verifier(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.nonConformite.toasts.verified').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'cloturer' && item) {
      const updated = await this.crud.cloturer(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.nonConformite.toasts.closed').replace('{numero}', updated.numero),
      );
      return;
    }

    await super.handleCustomAction(event);
  }
}
