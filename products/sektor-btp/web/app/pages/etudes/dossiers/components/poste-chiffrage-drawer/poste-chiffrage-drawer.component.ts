import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, ConfirmDialogService } from '@lib/anatomy';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import {
  modeUi,
  resolvePosteChiffrageMode,
  type PosteChiffrageModeUi,
} from '../../utils/poste-chiffrage-mode.util';
import { PosteDecompositionPanelComponent } from '../poste-decomposition-panel/poste-decomposition-panel.component';

export interface PosteChiffrageDrawerData {
  poste: BordereauTreeRow;
  dossierId: string;
  cpsDocumentId: string | null;
  modifiable: boolean;
  fgDefaut: number;
  margeDefaut: number;
  tvaDefaut: number;
  onDirtyChange?: (dirty: boolean) => void;
}

export interface PosteChiffrageDrawerResult {
  saved: boolean;
}

@Component({
  selector: 'app-poste-chiffrage-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDialogModule, ButtonComponent, PosteDecompositionPanelComponent],
  templateUrl: './poste-chiffrage-drawer.component.html',
  styleUrl: './poste-chiffrage-drawer.component.scss',
})
export class PosteChiffrageDrawerComponent {
  private readonly dialogRef = inject(
    MatDialogRef<PosteChiffrageDrawerComponent, PosteChiffrageDrawerResult | null>,
  );
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly data = inject<PosteChiffrageDrawerData>(MAT_DIALOG_DATA);

  readonly panel = viewChild(PosteDecompositionPanelComponent);
  readonly dirty = signal(false);
  readonly savedOnce = signal(false);
  readonly modeUi = signal<PosteChiffrageModeUi>(
    modeUi(
      resolvePosteChiffrageMode({
        mode: this.data.poste.mode,
        prixUnitaire: this.data.poste.prixUnitaire,
      }),
    ),
  );

  onDirty(dirty: boolean): void {
    this.dirty.set(dirty);
    this.data.onDirtyChange?.(dirty);
  }

  onModeUi(mode: PosteChiffrageModeUi): void {
    this.modeUi.set(mode);
  }

  onPanelChange(): void {
    this.savedOnce.set(true);
    this.dirty.set(false);
  }

  async setMode(mode: PosteChiffrageModeUi): Promise<void> {
    if (this.modeUi() === mode) return;
    await this.panel()?.setModeUi(mode);
  }

  async save(): Promise<void> {
    const panel = this.panel();
    if (!panel) return;
    await panel.sauvegarderPoste();
  }

  async requestClose(): Promise<void> {
    if (this.dirty()) {
      const ok = await this.confirmDialog.confirm({
        title: 'Modifications non enregistrées',
        message:
          'Vous avez des modifications non enregistrées sur ce poste. Les abandonner et fermer ?',
        variant: 'danger',
        confirmLabel: 'Abandonner',
        cancelLabel: 'Rester sur le poste',
      });
      if (!ok) return;
    }
    this.dialogRef.close({ saved: this.savedOnce() });
  }

  /** Appelé par le workspace avant de quitter l’étape. */
  isDirty(): boolean {
    return this.dirty();
  }
}
