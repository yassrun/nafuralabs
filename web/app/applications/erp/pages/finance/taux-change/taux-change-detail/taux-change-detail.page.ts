import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';

import type {
  TauxChange,
  TauxChangeCreate,
} from '@applications/erp/finance/models';

import { TauxChangeFacade } from '../services';
import { buildTauxChangeDetailConfig } from '../config';

@Component({
  selector: 'app-taux-change-detail',
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
export class TauxChangeDetailPage extends ConfigDrivenDetailPage<TauxChange> {
  private readonly crud = inject(TauxChangeFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<TauxChange, TauxChangeCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildTauxChangeDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('finance.tauxChange.actions.create');
    const item = this.item();
    return item
      ? `${item.deviseDeCode} → ${item.deviseVersCode} (${item.dateValidite})`
      : this.translate.instant('finance.tauxChange.entityName');
  }
}
