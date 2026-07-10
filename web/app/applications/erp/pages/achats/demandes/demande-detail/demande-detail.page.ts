import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';
import type { DAStatus, DemandeAchat, DemandeAchatCreate } from '@applications/erp/achats/models';
import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

import { DemandeFacade } from '../services';
import { buildDemandeDetailConfig } from '../config';

@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, TranslateModule, ...ConfigDrivenDetailPageImports, SubmitApprovalButtonComponent],
  templateUrl: './demande-detail.page.html',
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
export class DemandeDetailPage extends ConfigDrivenDetailPage<DemandeAchat> {
  private readonly crud = inject(DemandeFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<DemandeAchat, DemandeAchatCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildDemandeDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('achats.demande.createTitle');
    const item = this.item();
    if (!item) return this.translate.instant('achats.demande.detailTitle');
    const chantier = item.chantierName ?? this.translate.instant('achats.demande.detailHeaderFallback');
    return `${item.numero} — ${chantier}`;
  }

  protected override async handleCustomAction(event: DetailActionEvent<DemandeAchat>): Promise<void> {
    const item = event.item;
    const statusActions: Partial<Record<string, DAStatus>> = {
      soumettre: 'SOUMISE',
      approuver: 'APPROUVEE',
    };

    if (event.actionId in statusActions && item) {
      const next = statusActions[event.actionId]!;
      const updated = await this.crud.changeStatus(item.id, next);
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('achats.demande.toasts.statusUpdated').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'rejeter' && item) {
      const result = await this.confirmDialog.prompt({
        title: this.translate.instant('achats.demande.confirms.rejeter.title'),
        fields: [{
          key: 'note',
          label: 'achats.demande.confirms.rejeter.notePlaceholder',
          required: true,
        }],
        confirmLabel: this.translate.instant('achats.demande.confirms.rejeter.confirmLabel'),
        cancelLabel: this.translate.instant('common.actions.cancel'),
      });
      if (!result) return;
      const note = result['note'];
      if (!note?.trim()) {
        this.showError(this.translate.instant('achats.common.errors.missingMotif'));
        return;
      }
      const updated = await this.crud.changeStatus(item.id, 'REJETEE', note.trim());
      this.item.set(updated);
      this.showSuccess(
        this.translate.instant('achats.demande.toasts.rejected').replace('{numero}', updated.numero),
      );
      return;
    }

    if (event.actionId === 'convertir_bc' && item) {
      await this.router.navigate(['/achats/commandes/new'], {
        queryParams: { daId: item.id, daNumero: item.numero, chantierId: item.chantierId },
      });
      return;
    }

    await super.handleCustomAction(event);
  }
}
