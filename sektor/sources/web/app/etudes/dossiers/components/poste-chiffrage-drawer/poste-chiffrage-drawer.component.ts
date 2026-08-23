import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ButtonComponent, ConfirmDialogService } from '@platform/lib/anatomy';
import { CommentThreadPanelComponent } from '@platform/app/commentaire';
import { TranslateModule } from '@ngx-translate/core';

import type { PrixDPU } from '@app/etudes/models';

import type { BordereauTreeRow } from '../../utils/bordereau-tree.util';
import {
  GuestAccessApiService,
  type GuestComment,
} from '../../services/guest-access-api.service';
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
  guestReadOnly?: boolean;
  guestToken?: string;
  externalDpu?: PrixDPU | null;
  externalDescriptifCps?: string | null;
}

export interface PosteChiffrageDrawerResult {
  saved: boolean;
  /** Snapshot du poste persisté (saveAndClose **ou** Extraire/auto-save puis ✕). */
  snapshot?: PosteSaveSnapshot;
}

@Component({
  selector: 'app-poste-chiffrage-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
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
  private readonly guestApi = inject(GuestAccessApiService);
  readonly data = inject<PosteChiffrageDrawerData>(MAT_DIALOG_DATA);
  readonly guestReadOnly = !!this.data.guestReadOnly;

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

  readonly guestComments = signal<GuestComment[]>([]);
  readonly guestCommentDraft = signal('');
  readonly guestCommentBusy = signal(false);
  readonly guestCommentError = signal<string | undefined>(undefined);

  constructor() {
    if (this.guestReadOnly && this.data.guestToken && this.commentEntityId) {
      void this.loadGuestComments();
    }
  }

  private async loadGuestComments(): Promise<void> {
    const token = this.data.guestToken;
    if (!token || !this.commentEntityId) return;
    try {
      this.guestComments.set(await this.guestApi.listComments(token, this.commentEntityId));
    } catch {
      this.guestCommentError.set('Impossible de charger les commentaires.');
    }
  }

  async submitGuestComment(): Promise<void> {
    const token = this.data.guestToken;
    const text = this.guestCommentDraft().trim();
    if (!token || !this.commentEntityId || !text || this.guestCommentBusy()) return;
    this.guestCommentBusy.set(true);
    this.guestCommentError.set(undefined);
    try {
      const created = await this.guestApi.addComment(token, this.commentEntityId, text);
      this.guestComments.update((list) => [...list, created]);
      this.guestCommentDraft.set('');
    } catch {
      this.guestCommentError.set('Envoi impossible. Réessayez.');
    } finally {
      this.guestCommentBusy.set(false);
    }
  }

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
   * CTA unique : persiste, ferme, snapshot pour la tree.
   * Close propre (pas dirty) : snapshot du poste déjà persisté (Extraire).
   */
  async saveAndClose(): Promise<void> {
    if (this.closing()) return;
    const panel = this.panel();
    if (!panel) {
      this.dialogRef.close({ saved: false });
      return;
    }
    if (!this.dirty()) {
      const snapshot = (await panel.sauvegarderPoste()) ?? undefined;
      this.dialogRef.close({ saved: false, snapshot });
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

  /** ✕ — si Extraire a déjà persisté, renvoyer le snapshot pour l’arbre. */
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
    const snapshot = this.dirty()
      ? undefined
      : ((await this.panel()?.sauvegarderPoste()) ?? undefined);
    this.dialogRef.close({ saved: false, snapshot });
  }

  /** Appelé par le workspace avant de quitter l’étape. */
  isDirty(): boolean {
    return this.dirty();
  }
}
