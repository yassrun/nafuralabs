import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';

import type {
  ConditionPaiement,
  ConditionPaiementCreate,
  EcheancePaiement,
} from '@applications/erp/finance/models';

import { ConditionPaiementFacade } from '../services';
import { buildConditionPaiementDetailConfig } from '../config';
import { EcheancesEditorComponent } from '../components/echeances-editor/echeances-editor.component';

@Component({
  selector: 'app-condition-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    EcheancesEditorComponent,
  ],
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

        <ng-template nfField="echeances" let-control>
          <app-echeances-editor
            [echeancesValue]="echeancesValue(item())"
            [conditionId]="item()?.id ?? ''"
            [readonly]="mode() === 'view'"
            (echeancesChange)="onEcheancesChange(control, $event)" />
        </ng-template>

      </nf-entity-detail>
    </nf-page-shell>
  `,
  styles: [ConfigDrivenDetailPageStyles],
})
export class ConditionDetailPage extends ConfigDrivenDetailPage<ConditionPaiement> {
  private readonly crud = inject(ConditionPaiementFacade);
  private readonly translate = inject(TranslateService);

  readonly facade = createDetailFacadeFromCrud<
    ConditionPaiement,
    ConditionPaiementCreate
  >({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = buildConditionPaiementDetailConfig(this.translate);

  get headerTitle(): string {
    if (this.mode() === 'create')
      return this.translate.instant('finance.common.actions.new');
    const item = this.item();
    return item
      ? `${item.code} — ${item.libelle}`
      : this.translate.instant('finance.conditionPaiement.entityName');
  }

  echeancesValue(item: ConditionPaiement | null): EcheancePaiement[] {
    return item?.echeances ?? [];
  }

  onEcheancesChange(control: unknown, value: EcheancePaiement[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
  }
}
