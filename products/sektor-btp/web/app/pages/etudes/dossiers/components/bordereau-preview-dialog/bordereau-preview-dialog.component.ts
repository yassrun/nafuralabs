import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import {
  ButtonComponent,
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';
import { ConfirmDialogService } from '@lib/anatomy';
import { firstValueFrom } from 'rxjs';

import { UnitOfMeasuresApiService } from '@app/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';

import {
  collectExpandKeys,
  countArticlesInNodes,
  importArbreToTreeNodes,
  type BordereauTreeRow,
  type ImportNoeudPreview,
} from '../../utils/bordereau-tree.util';
import { mapToReferentialCode, toUniteOptions, type UniteOption } from '../../utils/unite-options.util';
import {
  BordereauNoeudDialogComponent,
  childTypesFor,
  defaultChildType,
  siblingTypesFor,
  type BordereauNoeudDialogResult,
  type BordereauNoeudType,
} from '../bordereau-noeud-dialog/bordereau-noeud-dialog.component';

export interface BordereauPreviewDialogData {
  arbre: ImportNoeudPreview[];
  articleCount: number;
  fileName?: string;
  pieceId: string;
}

export interface BordereauPreviewDialogResult {
  confirmed: true;
  arbre: ImportNoeudPreview[];
  pieceId: string;
}

@Component({
  selector: 'app-bordereau-preview-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, ButtonComponent, TreeTableComponent],
  template: `
    <div class="preview">
      <header class="preview__header">
        <div>
          <h2 class="preview__titre">Aperçu de l’extraction</h2>
          <p class="preview__aide">
            Vérifiez l’arbre extrait
            @if (data.fileName) {
              depuis <strong>{{ data.fileName }}</strong>
            }
            — {{ articleCount() }} article{{ articleCount() === 1 ? '' : 's' }}.
            Modifiez la structure via la colonne Actions avant validation.
          </p>
        </div>
        <nf-button variant="ghost" (clicked)="fermer()">Fermer</nf-button>
      </header>

      <div class="preview__toolbar">
        <button type="button" class="preview__link" (click)="expandAll()">Tout déplier</button>
        <button type="button" class="preview__link" (click)="collapseAll()">Tout replier</button>
        <span class="preview__toolbar-spacer"></span>
        <nf-button variant="secondary" size="sm" (clicked)="ajouterLotRacine()">
          Ajouter un lot
        </nf-button>
      </div>

      <div class="preview__table">
        <nf-tree-table
          [nodes]="nodes()"
          [columns]="columns"
          treeColumnKey="libelle"
          [expandedKeys]="expandedKeys()"
          (expandedKeysChange)="expandedKeys.set($event)"
          minWidth="60rem"
          scrollHeight="480px"
          emptyMessage="Aucun nœud extrait"
        >
          <ng-template #cell let-row let-column="column">
            @switch (column.key) {
              @case ('type') {
                <span class="preview__badge">{{ row.type }}</span>
              }
              @case ('code') {
                <span class="preview__code">{{ row.code }}</span>
              }
              @case ('libelle') {
                <span class="preview__libelle">{{ row.libelle }}</span>
              }
              @case ('unite') {
                {{ row.type === 'ARTICLE' ? row.unite || '—' : '—' }}
              }
              @case ('quantite') {
                {{ row.type === 'ARTICLE' ? (row.quantite ?? '—') : '—' }}
              }
              @case ('actions') {
                <span class="preview__row-actions">
                  <button
                    type="button"
                    class="preview__action"
                    title="Modifier"
                    aria-label="Modifier"
                    (click)="modifier(row)"
                  >
                    ✎
                  </button>
                  @if (row.type !== 'ARTICLE') {
                    <button
                      type="button"
                      class="preview__action"
                      title="Ajouter un enfant"
                      aria-label="Ajouter un enfant"
                      (click)="ajouterEnfant(row)"
                    >
                      +↓
                    </button>
                  }
                  <button
                    type="button"
                    class="preview__action"
                    title="Ajouter au même niveau"
                    aria-label="Ajouter au même niveau"
                    (click)="ajouterMemeNiveau(row)"
                  >
                    +↔
                  </button>
                  <button
                    type="button"
                    class="preview__action preview__action--danger"
                    title="Supprimer"
                    aria-label="Supprimer"
                    (click)="supprimer(row)"
                  >
                    🗑
                  </button>
                </span>
              }
            }
          </ng-template>
        </nf-tree-table>
      </div>

      <footer class="preview__footer">
        <nf-button variant="ghost" (clicked)="fermer()">Annuler</nf-button>
        <nf-button variant="primary" [disabled]="articleCount() === 0" (clicked)="valider()">
          Valider l’arbre
        </nf-button>
      </footer>
    </div>
  `,
  styles: `
    .preview {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: min(1100px, 94vw);
      max-height: 88vh;
      padding: 4px;
    }
    .preview__header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .preview__titre {
      margin: 0 0 4px;
      font-size: 1.125rem;
    }
    .preview__aide {
      margin: 0;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary);
      max-width: 48rem;
    }
    .preview__toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .preview__toolbar-spacer {
      flex: 1 1 auto;
    }
    .preview__link {
      border: 0;
      background: transparent;
      color: var(--nf-color-primary-600, #0b6e7a);
      cursor: pointer;
      font-size: 0.8125rem;
      text-decoration: underline;
      padding: 0;
    }
    .preview__table {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      border: 1px solid var(--nf-color-border);
      border-radius: 8px;
      background: var(--nf-color-bg);
    }
    .preview__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 4px;
    }
    .preview__badge {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--nf-color-text-secondary);
    }
    .preview__code {
      font-family: ui-monospace, monospace;
      font-size: 0.75rem;
      color: var(--nf-color-text-secondary);
    }
    .preview__libelle {
      overflow-wrap: anywhere;
    }
    .preview__row-actions {
      display: inline-flex;
      gap: 0.15rem;
      white-space: nowrap;
    }
    .preview__action {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.9rem;
      line-height: 1;
      padding: 0.15rem 0.3rem;
      color: var(--nf-color-text-secondary);
    }
    .preview__action:hover {
      color: var(--nf-color-text-primary);
    }
    .preview__action--danger:hover {
      color: var(--nf-color-danger-600, #c0392b);
    }
  `,
})
export class BordereauPreviewDialogComponent {
  readonly data = inject<BordereauPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(
    MatDialogRef<BordereauPreviewDialogComponent, BordereauPreviewDialogResult | undefined>,
  );
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);

  readonly columns: NfTreeTableColumn<BordereauTreeRow>[] = [
    { key: 'type', label: 'Type', width: '5.5rem' },
    { key: 'code', label: 'Code', width: '7rem' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'unite', label: 'Unité', width: '5.5rem', align: 'center' },
    { key: 'quantite', label: 'Quantité', width: '6rem', align: 'end' },
    { key: 'actions', label: 'Actions', width: '8.5rem', align: 'center' },
  ];

  readonly arbre = signal<ImportNoeudPreview[]>([]);
  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly articleCount = computed(() => countArticlesInNodes(this.nodes()));

  constructor() {
    this.arbre.set(structuredClone(this.data.arbre ?? []));
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const page = await this.uomApi.getAll({ page: 0, pageSize: 500, sortBy: 'code' });
      this.uniteOptions.set(toUniteOptions(page.items ?? []));
    } catch {
      this.uniteOptions.set(toUniteOptions([]));
    }
    this.remapArbreUnites();
    this.refreshNodes();
  }

  async ajouterLotRacine(): Promise<void> {
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'root',
      allowedTypes: ['LOT'],
      defaultType: 'LOT',
      initial: { type: 'LOT', code: String(this.arbre().length + 1), libelle: '' },
    });
    if (!result) return;
    const root = structuredClone(this.arbre());
    root.push(this.toNoeud(result));
    this.arbre.set(root);
    this.refreshNodes();
  }

  async modifier(row: BordereauTreeRow): Promise<void> {
    const path = this.keyToPath(row.key);
    if (!path) return;
    const noeud = this.getNoeudAt(path);
    if (!noeud) return;
    const type = (noeud.type ?? 'ARTICLE').toUpperCase() as BordereauNoeudType;
    const result = await this.openNoeudDialog({
      mode: 'edit',
      placement: 'sibling',
      allowedTypes: [type],
      defaultType: type,
      initial: {
        type,
        code: noeud.code ?? '',
        libelle: noeud.libelle ?? '',
        unite: noeud.unite,
        quantite: noeud.quantite,
      },
    });
    if (!result) return;
    const root = structuredClone(this.arbre());
    const target = this.getNoeudAtOn(root, path);
    if (!target) return;
    target.type = result.type;
    target.code = result.code;
    target.libelle = result.libelle;
    target.unite = result.type === 'ARTICLE' ? result.unite : null;
    target.quantite = result.type === 'ARTICLE' ? result.quantite : null;
    this.arbre.set(root);
    this.refreshNodes(false);
  }

  async ajouterEnfant(row: BordereauTreeRow): Promise<void> {
    const path = this.keyToPath(row.key);
    if (!path) return;
    const allowed = childTypesFor(row.type);
    if (allowed.length === 0) return;
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'child',
      allowedTypes: allowed,
      defaultType: defaultChildType(row.type),
      initial: {
        type: defaultChildType(row.type),
        code: `${row.code}-1`,
        libelle: '',
        unite: this.uniteOptions()[0]?.code ?? 'U',
        quantite: 1,
      },
    });
    if (!result) return;
    const root = structuredClone(this.arbre());
    const parent = this.getNoeudAtOn(root, path);
    if (!parent) return;
    if (!parent.enfants) parent.enfants = [];
    parent.enfants.push(this.toNoeud(result));
    this.arbre.set(root);
    this.refreshNodes(false);
    this.expandedKeys.update((keys) => new Set([...keys, row.key]));
  }

  async ajouterMemeNiveau(row: BordereauTreeRow): Promise<void> {
    const path = this.keyToPath(row.key);
    if (!path) return;
    const allowed = siblingTypesFor(row.type);
    const siblingType = (row.type as BordereauNoeudType) || 'ARTICLE';
    const result = await this.openNoeudDialog({
      mode: 'create',
      placement: 'sibling',
      allowedTypes: allowed,
      defaultType: siblingType,
      initial: {
        type: siblingType,
        code: `${row.code}-bis`,
        libelle: '',
        unite: this.uniteOptions()[0]?.code ?? 'U',
        quantite: 1,
      },
    });
    if (!result) return;
    const root = structuredClone(this.arbre());
    if (path.length === 1) {
      root.splice(path[0] + 1, 0, this.toNoeud(result));
    } else {
      const parentPath = path.slice(0, -1);
      const parent = this.getNoeudAtOn(root, parentPath);
      if (!parent) return;
      if (!parent.enfants) parent.enfants = [];
      parent.enfants.splice(path[path.length - 1] + 1, 0, this.toNoeud(result));
    }
    this.arbre.set(root);
    this.refreshNodes(false);
  }

  async supprimer(row: BordereauTreeRow): Promise<void> {
    const path = this.keyToPath(row.key);
    if (!path) return;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Supprimer le nœud',
      message: `Supprimer « ${row.code} — ${row.libelle} » et ses éventuels enfants ?`,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    this.removeAt(path);
    this.refreshNodes();
  }

  expandAll(): void {
    const keys = new Set<string>();
    const walk = (list: NfTreeNode<BordereauTreeRow>[]) => {
      for (const n of list) {
        if (n.children?.length) {
          keys.add(n.key);
          walk(n.children);
        }
      }
    };
    walk(this.nodes());
    this.expandedKeys.set(keys);
  }

  collapseAll(): void {
    this.expandedKeys.set(new Set());
  }

  fermer(): void {
    this.ref.close(undefined);
  }

  valider(): void {
    this.ref.close({
      confirmed: true,
      arbre: this.arbre(),
      pieceId: this.data.pieceId,
    });
  }

  private async openNoeudDialog(partial: {
    mode: 'create' | 'edit';
    placement: 'root' | 'child' | 'sibling';
    allowedTypes: BordereauNoeudType[];
    defaultType: BordereauNoeudType;
    initial?: {
      type?: string;
      code?: string;
      libelle?: string;
      unite?: string | null;
      quantite?: number | null;
    };
  }): Promise<BordereauNoeudDialogResult | null> {
    const ref = this.dialog.open(BordereauNoeudDialogComponent, {
      width: '28rem',
      data: {
        ...partial,
        uniteOptions: this.uniteOptions(),
      },
    });
    return (await firstValueFrom(ref.afterClosed())) ?? null;
  }

  private toNoeud(result: BordereauNoeudDialogResult): ImportNoeudPreview {
    return {
      type: result.type,
      code: result.code,
      libelle: result.libelle,
      unite: result.type === 'ARTICLE' ? result.unite : null,
      quantite: result.type === 'ARTICLE' ? result.quantite : null,
      enfants: [],
    };
  }

  private remapArbreUnites(): void {
    const opts = this.uniteOptions();
    const walk = (list: ImportNoeudPreview[]) => {
      for (const n of list) {
        const type = (n.type ?? 'ARTICLE').toUpperCase();
        if (type === 'ARTICLE') {
          n.unite = mapToReferentialCode(n.unite, opts);
        }
        if (n.enfants?.length) walk(n.enfants);
      }
    };
    walk(this.arbre());
  }

  private refreshNodes(resetExpand = true): void {
    const nodes = importArbreToTreeNodes(this.arbre());
    this.nodes.set(nodes);
    if (resetExpand) {
      this.expandedKeys.set(collectExpandKeys(nodes, 0));
    }
  }

  /** Keys look like `/0-0-CODE/1-2-CODE` — recover numeric indices. */
  private keyToPath(key: string): number[] | null {
    const parts = key.split('/').filter(Boolean);
    const path: number[] = [];
    for (const part of parts) {
      const m = /^(\d+)-(\d+)-/.exec(part);
      if (!m) return null;
      path.push(Number(m[2]));
    }
    return path.length ? path : null;
  }

  private getNoeudAt(path: number[]): ImportNoeudPreview | null {
    return this.getNoeudAtOn(this.arbre(), path);
  }

  private getNoeudAtOn(root: ImportNoeudPreview[], path: number[]): ImportNoeudPreview | null {
    let list = root;
    let node: ImportNoeudPreview | null = null;
    for (const idx of path) {
      node = list[idx] ?? null;
      if (!node) return null;
      list = node.enfants ?? [];
    }
    return node;
  }

  private removeAt(path: number[]): void {
    if (path.length === 0) return;
    const root = structuredClone(this.arbre());
    if (path.length === 1) {
      root.splice(path[0], 1);
      this.arbre.set(root);
      return;
    }
    let list: ImportNoeudPreview[] = root;
    for (let i = 0; i < path.length - 1; i++) {
      const n = list[path[i]];
      if (!n) return;
      if (!n.enfants) n.enfants = [];
      list = n.enfants;
    }
    list.splice(path[path.length - 1], 1);
    this.arbre.set(root);
  }
}
