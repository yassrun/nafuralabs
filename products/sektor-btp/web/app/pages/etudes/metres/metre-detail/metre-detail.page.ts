import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

import {
  ConfigDrivenDetailPage,
  ConfigDrivenDetailPageImports,
  ConfigDrivenDetailPageStyles,
  createDetailFacadeFromCrud,
} from '@lib/anatomy';
import { FieldTemplateDirective } from '@lib/anatomy/components/organisms/entity-detail';
import type { DetailActionEvent } from '@lib/anatomy/types';

import type {
  Metre,
  MetreCreate,
  MetreLigne,
} from '@applications/erp/etudes/models';
import { MetreTableEditorComponent } from '@applications/erp/etudes/components/metre-table-editor/metre-table-editor.component';

import { MetreFacade } from '../services';
import { METRE_DETAIL_CONFIG } from '../config';

@Component({
  selector: 'app-metre-detail',
  standalone: true,
  imports: [
    ...ConfigDrivenDetailPageImports,
    FieldTemplateDirective,
    MetreTableEditorComponent,
  ],
  templateUrl: './metre-detail.page.html',
  styleUrls: ['./metre-detail.page.scss'],
  styles: [ConfigDrivenDetailPageStyles],
})
export class MetreDetailPage extends ConfigDrivenDetailPage<Metre> {
  private readonly crud = inject(MetreFacade);
  private readonly nav = inject(Router);

  readonly facade = createDetailFacadeFromCrud<Metre, MetreCreate>({
    crud: this.crud,
    lookups: () => this.crud.lookups(),
  });
  readonly config = METRE_DETAIL_CONFIG;

  get headerTitle(): string {
    if (this.mode() === 'create') return 'Nouveau métré';
    const item = this.item();
    return item ? `${item.numero} — ${item.projetNom}` : 'Détail métré';
  }

  asFormControl(control: unknown): FormControl {
    return control as FormControl;
  }

  lignesValue(item: Metre | null): MetreLigne[] {
    return (item?.lignes ?? []) as MetreLigne[];
  }

  onLignesChange(control: unknown, value: MetreLigne[]): void {
    (control as FormControl).setValue(value);
    (control as FormControl).markAsDirty();
  }

  protected override async handleCustomAction(
    event: DetailActionEvent<Metre>,
  ): Promise<void> {
    if (event.actionId === 'open_dpgf') {
      const id = event.item?.id;
      if (id) {
        this.nav.navigate(['/etudes/metres', id, 'dpgf']);
      }
      return;
    }
    if (event.actionId === 'generate_devis') {
      const id = event.item?.id;
      if (id) {
        this.nav.navigate(['/etudes/devis/new'], { queryParams: { metreId: id } });
      }
      return;
    }
    await super.handleCustomAction(event);
  }
}
