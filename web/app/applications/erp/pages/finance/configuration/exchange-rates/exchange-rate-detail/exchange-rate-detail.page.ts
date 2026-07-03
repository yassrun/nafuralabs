/**
 * ExchangeRate Detail Page — Generated once (wrapper file).
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

import { ExchangeRatesFacade } from '../services';
import type { ExchangeRate, ExchangeRateCreate } from '../models';
import { EXCHANGE_RATE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-exchange-rate-detail',
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
export class ExchangeRateDetailPage extends ConfigDrivenDetailPage<ExchangeRate> {
  private readonly crud = inject(ExchangeRatesFacade);
  readonly facade = createDetailFacadeFromCrud<ExchangeRate, ExchangeRateCreate>({
    crud: this.crud,
  });
  readonly config = EXCHANGE_RATE_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Exchange Rate';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Exchange Rate Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<ExchangeRate>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
