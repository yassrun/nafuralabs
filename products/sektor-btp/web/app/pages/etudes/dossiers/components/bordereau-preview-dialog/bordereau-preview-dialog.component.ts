import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import {
  ButtonComponent,
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@lib/anatomy/components';

import { UnitOfMeasuresApiService } from '@app/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';

import {
  collectExpandKeys,
  countArticlesInNodes,
  importArbreToTreeNodes,
  type BordereauTreeRow,
  type ImportNoeudPreview,
} from '../../utils/bordereau-tree.util';
import {
  mapToReferentialCode,
  toUniteOptions,
  uniteOptionsForValue,
  type UniteOption,
} from '../../utils/unite-options.util';

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
  imports: [CommonModule, FormsModule, MatDialogModule, ButtonComponent, TreeTableComponent],
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
            Ajustez les unités (référentiel) ou retirez des lignes avant validation.
          </p>
        </div>
        <nf-button variant="ghost" (clicked)="fermer()">Fermer</nf-button>
      </header>

      <div class="preview__toolbar">
        <button type="button" class="preview__link" (click)="expandAll()">Tout déplier</button>
        <button type="button" class="preview__link" (click)="collapseAll()">Tout replier</button>
        @if (selectionCount() > 0) {
          <nf-button variant="secondary" size="sm" (clicked)="retirerSelection()">
            Retirer ({{ selectionCount() }})
          </nf-button>
        }
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
              @case ('select') {
                <input
                  type="checkbox"
                  class="preview__check"
                  [checked]="isSelected(row.key)"
                  (change)="toggleSelect(row.key, $any($event.target).checked)"
                />
              }
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
                @if (row.type === 'ARTICLE') {
                  <select
                    class="preview__select"
                    [ngModel]="row.unite ?? ''"
                    (ngModelChange)="onUniteChange(row.key, $event)"
                  >
                    <option value="">—</option>
                    @for (u of optionsFor(row); track u.code) {
                      <option [value]="u.code">{{ u.code }}</option>
                    }
                  </select>
                } @else {
                  —
                }
              }
              @case ('quantite') {
                {{ row.quantite ?? '—' }}
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
    .preview__titre { margin: 0 0 4px; font-size: 1.125rem; }
    .preview__aide {
      margin: 0;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary);
      max-width: 48rem;
    }
    .preview__toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
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
    .preview__libelle { overflow-wrap: anywhere; }
    .preview__select {
      min-width: 5.5rem;
      height: 30px;
      border: 1px solid var(--nf-color-border);
      border-radius: 4px;
      font-size: 0.75rem;
      background: var(--nf-color-bg-subtle);
    }
    .preview__check { width: 1rem; height: 1rem; cursor: pointer; }
  `,
})
export class BordereauPreviewDialogComponent {
  readonly data = inject<BordereauPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(
    MatDialogRef<BordereauPreviewDialogComponent, BordereauPreviewDialogResult | undefined>,
  );
  private readonly uomApi = inject(UnitOfMeasuresApiService);

  readonly columns: NfTreeTableColumn<BordereauTreeRow>[] = [
    { key: 'select', label: ' ', width: '2.75rem', align: 'center' },
    { key: 'type', label: 'Type', width: '5.5rem' },
    { key: 'code', label: 'Code', width: '7rem' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'unite', label: 'Unité', width: '9rem', align: 'center' },
    { key: 'quantite', label: 'Quantité', width: '6rem', align: 'end' },
  ];

  readonly arbre = signal<ImportNoeudPreview[]>([]);
  readonly nodes = signal<NfTreeNode<BordereauTreeRow>[]>([]);
  readonly expandedKeys = signal<Set<string>>(new Set());
  readonly selectedKeys = signal<Set<string>>(new Set());
  readonly uniteOptions = signal<UniteOption[]>([]);
  readonly articleCount = computed(() => countArticlesInNodes(this.nodes()));
  readonly selectionCount = computed(() => this.selectedKeys().size);

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

  optionsFor(row: BordereauTreeRow): UniteOption[] {
    return uniteOptionsForValue(this.uniteOptions(), row.unite);
  }

  isSelected(key: string): boolean {
    return this.selectedKeys().has(key);
  }

  toggleSelect(key: string, checked: boolean): void {
    const next = new Set(this.selectedKeys());
    if (checked) next.add(key);
    else next.delete(key);
    this.selectedKeys.set(next);
  }

  onUniteChange(nodeKey: string, code: string): void {
    const path = this.keyToPath(nodeKey);
    if (!path) return;
    const noeud = this.getNoeudAt(path);
    if (!noeud) return;
    noeud.unite = code || null;
    this.refreshNodes(false);
  }

  retirerSelection(): void {
    const keys = [...this.selectedKeys()];
    // Remove deepest first
    keys
      .map((k) => ({ k, depth: (k.match(/\//g) ?? []).length }))
      .sort((a, b) => b.depth - a.depth)
      .forEach(({ k }) => {
        const path = this.keyToPath(k);
        if (path) this.removeAt(path);
      });
    this.selectedKeys.set(new Set());
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
    let list = this.arbre();
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
