import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConfigDrivenDetailPage, ConfigDrivenDetailPageImports, ConfigDrivenDetailPageStyles, createDetailFacadeFromCrud } from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { ContratAchat, ContratAchatCreate, ContratAchatStatus } from '@applications/erp/achats/models';
import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';
import { ContratFacade } from '../services';
import { buildContratDetailConfig } from '../config';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, TranslateModule, ...ConfigDrivenDetailPageImports, SubmitApprovalButtonComponent],
  templateUrl: './contrat-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles, `
    .approval-bar {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem 1rem; margin-bottom: 1rem;
      background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.5rem;
    }
    .approval-bar__label {
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--nf-color-text-secondary);
    }
  `],
})
export class ContratDetailPage extends ConfigDrivenDetailPage<ContratAchat> {
  private readonly crud = inject(ContratFacade);
  private readonly translate = inject(TranslateService);
  readonly facade = createDetailFacadeFromCrud<ContratAchat, ContratAchatCreate>({ crud: this.crud, lookups: () => this.crud.lookups() });
  readonly config = buildContratDetailConfig(this.translate);
  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('achats.contrat.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.fournisseurName ?? ''}` : this.translate.instant('achats.contrat.detailTitle');
  }
  protected override async handleCustomAction(event: DetailActionEvent<ContratAchat>): Promise<void> {
    const item = event.item;
    const statusMap: Partial<Record<string, ContratAchatStatus>> = { signer: 'SIGNE', activer: 'EN_COURS', resilier: 'RESILIE' };
    if (event.actionId in statusMap && item) {
      const updated = await this.crud.changeStatus(item.id, statusMap[event.actionId]!);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('achats.contrat.toasts.updated').replace('{numero}', updated.numero),
      );
      return;
    }
    await super.handleCustomAction(event);
  }
}
