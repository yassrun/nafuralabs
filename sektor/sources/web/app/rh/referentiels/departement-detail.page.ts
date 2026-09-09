import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@platform/lib/anatomy';
import type { RhNomenclature, RhNomenclatureCreate } from '@app/rh/models';

import { buildNomenclatureDetailConfig } from './config/detail';
import { RhDepartementFacade } from './services';

@Component({
  selector: 'app-rh-departement-detail',
  standalone: true,
  imports: [...ConfigDrivenDetailPageImports],
  template: `
    <nf-page-shell>
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <nf-entity-detail
        #detail
        [config]="config"
        [mode]="mode()"
        [item]="item()"
        [lookups]="lookups()"
        [loading]="isLoading()"
        [saving]="isSaving()"
        (action)="onAction($event)"
      />
    </nf-page-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [ConfigDrivenDetailPageStyles],
})
export class RhDepartementDetailPage extends ConfigDrivenDetailPage<RhNomenclature> {
  private readonly translate = inject(TranslateService);
  private readonly crud = inject(RhDepartementFacade);
  readonly facade = createDetailFacadeFromCrud<RhNomenclature, RhNomenclatureCreate>({
    crud: this.crud,
  });
  readonly config = buildNomenclatureDetailConfig(this.translate, 'departement');

  get headerTitle(): string {
    if (this.mode() === 'create') return this.translate.instant('rh.departement.titleNew');
    const item = this.item();
    return item
      ? `${item.code} — ${item.libelle}`
      : this.translate.instant('rh.departement.titleDetail');
  }
}
