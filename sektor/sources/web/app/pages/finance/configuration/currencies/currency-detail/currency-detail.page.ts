/**
 * Currency Detail Page — Generated once (wrapper file).
 * Add custom detail behavior here. This file is never overwritten.
 */

import { Component, inject } from '@angular/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import type { DetailActionEvent } from '@lib/anatomy/types';

import { CurrenciesFacade } from '../services';
import type { Currency, CurrencyCreate } from '../models';
import { CURRENCY_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-currency-detail',
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
export class CurrencyDetailPage extends ConfigDrivenDetailPage<Currency> {
  private readonly crud = inject(CurrenciesFacade);
  readonly facade = createDetailFacadeFromCrud<Currency, CurrencyCreate>({
    crud: this.crud,
  });
  readonly config = CURRENCY_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Currency';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Currency Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Currency>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
