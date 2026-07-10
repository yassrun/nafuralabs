import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { StatusTransitionEvent } from '@lib/anatomy/types';
import type { Formation, FormationCreate } from '@applications/erp/hse/models';

import { FormationFacade } from '../services';
import { buildFormationDetailConfig } from '../config';

@Component({
  selector: 'app-formation-detail',
  standalone: true,
  imports: [CommonModule, ...ConfigDrivenDetailPageImports],
  templateUrl: './formation-detail.page.html',
  styles: [ConfigDrivenDetailPageStyles],
})
export class FormationDetailPage extends ConfigDrivenDetailPage<Formation> {
  private readonly crud = inject(FormationFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Formation, FormationCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildFormationDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('hse.formation.createTitle');
    const item = this.item();
    return item ? `${item.numero} — ${item.titre}` : this.translate.instant('hse.formation.detailTitle');
  }

  override async handleTransition(event: StatusTransitionEvent): Promise<void> {
    const id = this.itemId();
    if (!id) return;
    let updated: Formation | null = null;
    switch (event.action) {
      case 'demarrer': updated = await this.crud.demarrer(String(id)); break;
      case 'terminer': updated = await this.crud.terminer(String(id)); break;
      case 'annuler': updated = await this.crud.annuler(String(id)); break;
      default: await super.handleTransition(event); return;
    }
    if (updated) this.item.set(updated);
  }
}
