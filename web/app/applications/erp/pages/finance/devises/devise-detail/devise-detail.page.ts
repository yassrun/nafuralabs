import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';

import type {
  Devise,
  DeviseCreate,
} from '@applications/erp/finance/models';

import { DeviseFacade } from '../services';
import { buildDeviseDetailConfig } from '../config';

@Component({
  selector: 'app-devise-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-detail
        #detail
        [config]="config"
        [mode]="mode()"
        [item]="item()"
        [lookups]="lookups()"
        [loading]="isLoading()"
        [saving]="isSaving()"
        (action)="onAction($event)">
      </nf-entity-detail>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenDetailPageStyles],
})
export class DeviseDetailPage extends ConfigDrivenDetailPage<Devise> {
  private readonly crud = inject(DeviseFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<Devise, DeviseCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildDeviseDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('finance.devise.actionNew');
    const item = this.item();
    return item
      ? `${item.code} — ${item.libelle}`
      : this.translate.instant('finance.devise.detailTitle');
  }
}
