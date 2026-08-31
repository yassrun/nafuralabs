import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ButtonComponent } from '@platform/lib/anatomy';

import type { DpuComposantType } from '@app/etudes/models';
import { NATURE_TYPE_DPU, normalizeNature, type Nature } from '@app/catalogue/models';
import {
  ArticlePickerComponent,
  type ArticlePickerContext,
  type ArticlePickerResult,
} from '@app/catalogue/components/article-picker/article-picker.component';
import type { UniteOption } from '../../utils/unite-options.util';

export interface CatalogItemPickDialogData {
  uniteOptions: UniteOption[];
  context?: ArticlePickerContext;
  presetNature?: Nature | null;
}

export interface CatalogItemPickDialogResult {
  itemId: string;
  name: string;
  code?: string;
  /** Identité catalogue (panier consultation / matching devis). */
  cleStable?: string;
  type: DpuComposantType;
  unite: string;
  unitOfMeasureId?: string;
  quantite: number;
  prixUnitaire: number;
  sourcePrix: 'TARIF';
}

@Component({
  selector: 'app-catalog-item-pick-dialog',
  standalone: true,
  imports: [MatDialogModule, ButtonComponent, ArticlePickerComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Choisir un article</h2>
        <nf-button variant="ghost" (clicked)="close()" aria-label="Fermer">✕</nf-button>
      </header>
      <app-article-picker
        [context]="data.context ?? 'dpu'"
        [presetNature]="data.presetNature ?? null"
        [uniteOptions]="data.uniteOptions"
        (picked)="onPicked($event)"
        (cancelled)="close()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .dialog-shell {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      min-width: min(40rem, 94vw);
      background: var(--nf-color-surface, #fff);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }
    header h2 {
      margin: 0;
      font-size: 1.125rem;
    }
  `,
})
export class CatalogItemPickDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CatalogItemPickDialogComponent, CatalogItemPickDialogResult | null>,
  );
  readonly data = inject<CatalogItemPickDialogData>(MAT_DIALOG_DATA);

  onPicked(result: ArticlePickerResult): void {
    this.dialogRef.close({
      itemId: result.item.id,
      name: result.item.name,
      code: result.item.code,
      cleStable: result.item.cleStable || result.item.code,
      type: NATURE_TYPE_DPU[normalizeNature(result.item.nature)],
      unite: result.unite,
      unitOfMeasureId: result.item.unitOfMeasureId,
      quantite: result.quantite,
      prixUnitaire: result.prixUnitaire,
      sourcePrix: 'TARIF',
    });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

export function openCatalogItemPicker(
  dialog: MatDialog,
  data: CatalogItemPickDialogData = { uniteOptions: [] },
): Promise<CatalogItemPickDialogResult | null> {
  return firstValueFrom(
    dialog
      .open(CatalogItemPickDialogComponent, {
        width: '42rem',
        autoFocus: false,
        restoreFocus: true,
        data: {
          uniteOptions: data.uniteOptions ?? [],
          context: data.context ?? 'lookup',
          presetNature: data.presetNature,
        },
      })
      .afterClosed(),
  );
}
