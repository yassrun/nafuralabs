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
import type { Inspection, InspectionCreate } from '@applications/erp/hse/models';

import { InspectionFacade } from '../services';
import { buildInspectionDetailConfig } from '../config';

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './inspection-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class InspectionDetailPage extends ConfigDrivenDetailPage<Inspection> {
  private readonly crud = inject(InspectionFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Inspection, InspectionCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildInspectionDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('hse.inspection.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.thematique}` : this.translate.instant('hse.inspection.detailTitle');
  }

  protected override async handleCustomAction(event: DetailActionEvent<Inspection>): Promise<void> {
    const item = event.item;

    if (event.actionId === 'demarrer' && item) {
      const updated = await this.crud.demarrer(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.inspection.toasts.started').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'terminer' && item) {
      const updated = await this.crud.terminer(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.inspection.toasts.completed').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'annuler' && item) {
      const updated = await this.crud.annuler(item.id);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('hse.inspection.toasts.cancelled').replace('{numero}', updated.numero),
      );
      return;
    }

    await super.handleCustomAction(event);
  }
}
