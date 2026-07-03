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
import type { Employe, EmployeCreate, StatutEmploye } from '@applications/erp/rh/models';

import { EmployeFacade } from '../services';
import { buildEmployeDetailConfig } from '../config';

@Component({
  selector: 'app-employe-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './employe-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class EmployeDetailPage extends ConfigDrivenDetailPage<Employe> {
  private readonly translate = inject(TranslateService);
  private readonly crud = inject(EmployeFacade);

  readonly facade = createDetailFacadeFromCrud<Employe, EmployeCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildEmployeDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('rh.employe.titleNew');
    const item = this.item();
    return item ? `${item.matricule} — ${item.nom} ${item.prenom}` : this.translate.instant('rh.employe.titleDetail');
  }

  protected override async handleCustomAction(event: DetailActionEvent<Employe>): Promise<void> {
    const item = event.item;

    const transitionMap: Partial<Record<string, StatutEmploye>> = {
      suspendre: 'SUSPENDU',
      reactiver: 'ACTIF',
      solde: 'SOLDE',
    };

    if (event.actionId in transitionMap && item) {
      const next = transitionMap[event.actionId]!;
      const updated = await this.crud.changeStatut(item.id, next);
      this.item.set(updated);
      this.showSuccess(this.translate.instant('rh.employe.toasts.statutChanged', { matricule: updated.matricule }));
      return;
    }

    await super.handleCustomAction(event);
  }
}
