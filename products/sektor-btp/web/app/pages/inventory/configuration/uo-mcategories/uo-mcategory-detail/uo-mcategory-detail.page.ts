/**
 * UoMCategory Detail Page — Generated once (wrapper file).
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

import { UoMCategoriesFacade } from '../services';
import type { UoMCategory, UoMCategoryCreate } from '../models';
import { UO_MCATEGORY_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-uo-mcategory-detail',
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
export class UoMCategoryDetailPage extends ConfigDrivenDetailPage<UoMCategory> {
  private readonly crud = inject(UoMCategoriesFacade);
  readonly facade = createDetailFacadeFromCrud<UoMCategory, UoMCategoryCreate>({
    crud: this.crud,
  });
  readonly config = UO_MCATEGORY_DETAIL_CONFIG;

  get headerTitle(): string {
    const mode = this.mode();
    if (mode === 'create') return 'New Uo M Category';
    const item = this.item();
    return item ? `${(item as any).name || (item as any).code || ''}` : 'Uo M Category Details';
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<UoMCategory>
  ): Promise<void> {
    switch (event.actionId) {
      default:
        console.log('Unhandled detail action:', event.actionId, event);
    }
  }
}
