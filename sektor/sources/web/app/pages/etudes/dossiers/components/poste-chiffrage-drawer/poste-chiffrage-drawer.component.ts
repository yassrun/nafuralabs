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
import { CommentThreadPanelComponent } from '@platform/features/collaboration/comment';
import { TranslateModule } from '@ngx-translate/core';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import {
  origineUi,
  resolveOrigineCout,
  type OrigineCoutUi,
} from '../../utils/poste-chiffrage-mode.util';
import {
  PosteDecompositionPanelComponent,
  type PosteSaveSnapshot,
} from '../poste-decomposition-panel/poste-decomposition-panel.component';
import { PosteAvisPanelComponent } from '../poste-avis-panel/poste-avis-panel.component';

export interface PosteChiffrageDrawerData {
  /** Copie de travail — jamais la référence live de l’arbre. */
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
  /** Présent uniquement si saved — pour patcher la tree à la fermeture. */
  snapshot?: PosteSaveSnapshot;
}

@Component({
  selector: 'app-poste-chiffrage-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    ButtonComponent,
    PosteDecompositionPanelComponent,
    PosteAvisPanelComponent,
    CommentThreadPanelComponent,
    TranslateModule,
  ],
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
  readonly closing = signal(false);

  /** Copie isolée : toute édition reste dans le drawer jusqu’à Enregistrer et fermer. */
  readonly posteDraft = signal<BordereauTreeRow>(structuredClone(this.data.poste));

  readonly origine = signal<OrigineCoutUi>(
    origineUi(
      resolveOrigineCout({
        origineCout: this.posteDraft().origineCout,
        mode: this.posteDraft().mode,
        prixUnitaire: this.posteDraft().prixUnitaire,
      }),
    ),
  );

  /** Fil social platform — polymorphe sur le nœud DPGF. */
  readonly commentEntityType = 'dpgf_noeud';
  readonly commentEntityId = this.posteDraft().id ?? '';

  onDirty(dirty: boolean): void {
    this.dirty.set(dirty);
    this.data.onDirtyChange?.(dirty);
  }

  onOrigine(origine: OrigineCoutUi): void {
    this.origine.set(origine);
  }

  async setOrigine(origine: OrigineCoutUi): Promise<void> {
    if (this.origine() === origine) return;
    await this.panel()?.setOrigineUi(origine);
  }

  /**
   * CTA unique : persiste la copie, ferme, et renvoie le snapshot pour la tree.
   * Sans save → `{ saved: false }` → tree intacte.
   */
  async saveAndClose(): Promise<void> {
    if (this.closing()) return;
    const panel = this.panel();
    if (!panel) {
      this.dialogRef.close({ saved: false });
      return;
    }
    if (!this.dirty()) {
      this.dialogRef.close({ saved: false });
      return;
    }
    this.closing.set(true);
    try {
      const snapshot = await panel.sauvegarderPoste();
      if (!snapshot) return;
      this.dirty.set(false);
      this.data.onDirtyChange?.(false);
      this.dialogRef.close({ saved: true, snapshot });
    } finally {
      this.closing.set(false);
    }
  }

  /** Abandon (✕) — tree non touchée. */
  async requestClose(): Promise<void> {
    if (this.closing()) return;
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
    this.dialogRef.close({ saved: false });
  }

  /** Appelé par le workspace avant de quitter l’étape. */
  isDirty(): boolean {
    return this.dirty();
  }
}
