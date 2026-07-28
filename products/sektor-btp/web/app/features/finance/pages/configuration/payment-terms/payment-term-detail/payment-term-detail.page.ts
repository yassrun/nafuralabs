/**
 * PaymentTerm Detail Page — Generated once (wrapper file).
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

import { PaymentTermsFacade } from '../services';
import type { PaymentTerm, PaymentTermCreate } from '../models';
import { PAYMENT_TERM_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-payment-term-detail',
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
export class PaymentTermDetailPage extends ConfigDrivenDetailPage<PaymentTerm> {
  private readonly crud = inject(PaymentTermsFacade);
  readonly facade = createDetailFacadeFromCrud<PaymentTerm, PaymentTermCreate>({
    crud: this.crud,
  });
  readonly config = PAYMENT_TERM_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Payment Term';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Payment Term Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<PaymentTerm>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
