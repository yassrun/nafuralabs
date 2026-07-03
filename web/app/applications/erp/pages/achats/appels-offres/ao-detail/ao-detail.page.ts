import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { AOStatus, AppelOffre, AppelOffreCreate } from '@applications/erp/achats/models';

import { AoFacade } from '../services';
import { buildAoDetailConfig } from '../config';

import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

@Component({
  selector: 'app-ao-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...ConfigDrivenDetailPageImports, RouterLink, SubmitApprovalButtonComponent],
  templateUrl: './ao-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles, `
    .ao-toolbar { margin-bottom: 12px; }
    .ao-toolbar__link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600;
      background: var(--nf-color-primary-50); color: var(--nf-color-primary-700); text-decoration: none; border: 1px solid var(--nf-color-primary-200);
    }
    .ao-toolbar__link:hover { background: var(--nf-color-primary-100); }
    .ao-approval {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      margin: 0 0 12px; padding: 10px 14px; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 8px;
    }
    .ao-approval__label { font-size: 12px; font-weight: 600; color: var(--nf-color-text-secondary); }
  `],
})
export class AoDetailPage extends ConfigDrivenDetailPage<AppelOffre> {
  private readonly crud = inject(AoFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<AppelOffre, AppelOffreCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildAoDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('achats.appelOffre.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.objet}` : this.translate.instant('achats.appelOffre.detailTitle');
  }

  protected override async handleCustomAction(event: DetailActionEvent<AppelOffre>): Promise<void> {
    const item = event.item;
    const statusMap: Partial<Record<string, AOStatus>> = {
      publier: 'PUBLIEE', cloturer: 'CLOTUREE', infructueux: 'INFRUCTUEUSE',
    };
    if (event.actionId in statusMap && item) {
      const updated = await this.crud.changeStatus(item.id, statusMap[event.actionId]!);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('achats.appelOffre.toasts.statusUpdated').replace('{numero}', updated.numero),
      );
      return;
    }
    if (event.actionId === 'attribuer' && item) {
      const result = await this.confirmDialog.prompt({
        title: this.translate.instant('achats.appelOffre.prompts.fournisseurId'),
        fields: [{ key: 'fournisseurId', label: 'achats.appelOffre.prompts.fournisseurId', required: true }],
        confirmLabel: this.translate.instant('achats.appelOffre.actions.attribuer'),
        cancelLabel: this.translate.instant('common.actions.cancel'),
      });
      if (!result) return;
      const fournisseurId = result['fournisseurId'];
      if (!fournisseurId?.trim()) return;
      const { ao, bc } = await this.crud.attribuer(item.id, fournisseurId.trim());
      this.item.set(ao);
      this.showSuccess(
        bc
          ? this.translate.instant('achats.appelOffre.toasts.attribue').replace('{numero}', bc.numero)
          : `AO attribué au fournisseur ${fournisseurId.trim()}`,
      );
      return;
    }
    await super.handleCustomAction(event);
  }
}
