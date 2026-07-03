/**
 * UnitOfMeasure Detail Page — Generated once (wrapper file).
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

import { UnitOfMeasuresFacade } from '../services';
import type { UnitOfMeasure, UnitOfMeasureCreate } from '../models';
import { UNIT_OF_MEASURE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-unit-of-measure-detail',
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
export class UnitOfMeasureDetailPage extends ConfigDrivenDetailPage<UnitOfMeasure> {
  private readonly crud = inject(UnitOfMeasuresFacade);
  readonly facade = createDetailFacadeFromCrud<UnitOfMeasure, UnitOfMeasureCreate>({
    crud: this.crud,
  });
  readonly config = UNIT_OF_MEASURE_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Unit Of Measure';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Unit Of Measure Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<UnitOfMeasure>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
