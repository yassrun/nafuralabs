import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent, StatusTransitionEvent } from '@lib/anatomy/types';
import type { Conge, CongeCreate } from '@applications/erp/rh/models';
import { SubmitApprovalButtonComponent } from '@applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component';

import { CongeFacade } from '../services';
import { buildCongeDetailConfig } from '../config';

@Component({
  selector: 'app-conge-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, ...ConfigDrivenDetailPageImports, SubmitApprovalButtonComponent],
  templateUrl: './conge-detail.page.html',
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
export class CongeDetailPage extends ConfigDrivenDetailPage<Conge> {
  private readonly translate = inject(TranslateService);
  private readonly crud = inject(CongeFacade);

  readonly facade = createDetailFacadeFromCrud<Conge, CongeCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildCongeDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('rh.conge.titleNew');
    const item = this.item();
    return item ? `${item.numero} — ${item.employeNom ?? ''}` : this.translate.instant('rh.conge.titleDetail');
  }

  protected override async handleCustomAction(event: DetailActionEvent<Conge>): Promise<void> {
    const item = event.item;

    if (event.actionId === 'approuver' && item) {
      const updated = await this.crud.approuver(item.id);
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.conge.toasts.approved', { numero: updated.numero }));
      return;
    }

    if (event.actionId === 'refuser' && item) {
      const result = await this.confirmDialog.prompt({
        title: this.translate.instant('rh.conge.prompts.motifRefus'),
        fields: [{ key: 'motif', label: 'rh.conge.prompts.motifRefus', required: true }],
      confirmLabel: 'OK',
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });
    if (!result) return;
    const motif = result['motif'];
      if (!motif?.trim()) {
        this.showError(this.translate.instant('rh.conge.prompts.motifObligatoire'));
        return;
      }
      const updated = await this.crud.refuser(item.id, motif.trim());
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.conge.toasts.refused', { numero: updated.numero }));
      return;
    }

    if (event.actionId === 'demarrer' && item) {
      const updated = await this.crud.demarrer(item.id);
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.conge.toasts.started', { numero: updated.numero }));
      return;
    }

    if (event.actionId === 'solder' && item) {
      const updated = await this.crud.solder(item.id);
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.conge.toasts.closed', { numero: updated.numero }));
      return;
    }

    await super.handleCustomAction(event);
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const item = this.item();
    if (!item?.id) return;

    this.isTransitioning.set(true);
    try {
      let updated: Conge;
      switch (event.endpoint) {
        case 'approve':
          updated = await this.crud.approuver(item.id);
          this.showSuccess(this.translate.instant('rh.conge.toasts.approved', { numero: updated.numero }));
          break;
        case 'refuse': {
          const motif = event.note?.trim();
          if (!motif) {
            this.showError(this.translate.instant('rh.conge.prompts.motifObligatoire'));
            return;
          }
          updated = await this.crud.refuser(item.id, motif);
          this.showSuccess(this.translate.instant('rh.conge.toasts.refused', { numero: updated.numero }));
          break;
        }
        case 'start':
          updated = await this.crud.demarrer(item.id);
          this.showSuccess(this.translate.instant('rh.conge.toasts.started', { numero: updated.numero }));
          break;
        case 'close':
          updated = await this.crud.solder(item.id);
          this.showSuccess(this.translate.instant('rh.conge.toasts.closed', { numero: updated.numero }));
          break;
        default:
          await super.handleTransition(event);
          return;
      }
      this.item.set(updated);
    } catch (err) {
      this.showError((err as Error).message ?? 'Transition impossible');
    } finally {
      this.isTransitioning.set(false);
    }
  }
}
