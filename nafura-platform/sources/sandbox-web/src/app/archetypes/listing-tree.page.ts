import { Component, ChangeDetectionStrategy, computed, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScreenComponent } from '@platform/lib/anatomy/components/organisms/page-screen';
import type { PageHeaderConfig } from '@platform/lib/anatomy/components/molecules/page-header';
import {
  ListingTreeComponent,
  type ListingTreeAction,
  type ListingTreeConfig,
} from '@platform/lib/anatomy/components/organisms/listing-tree';
import {
  findTreeNode,
  nodeAllowsChildren,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@platform/lib/anatomy/components/organisms/tree-table';

export type BordereauType = 'LOT' | 'SOUS_LOT' | 'ARTICLE';

export interface BordereauRow {
  id: string;
  type: BordereauType;
  code: string;
  libelle: string;
  unite?: string;
  quantite?: number;
}

@Component({
  selector: 'sb-listing-tree',
  standalone: true,
  imports: [FormsModule, ScreenComponent, ListingTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-screen [header]="headerConfig">
      <div class="lab">
        <div class="lab__stage">
          <nf-listing-tree
            [config]="listingConfig()"
            [nodes]="nodes()"
            (action)="onAction($event)"
          >
            <ng-template #cell let-row let-column="column">
              @switch (column.key) {
                @case ('type') {
                  <span class="badge" [attr.data-type]="row.type">{{ typeLabel(row.type) }}</span>
                }
                @case ('code') {
                  <span class="code">{{ row.code }}</span>
                }
                @case ('libelle') {
                  <span class="libelle">{{ row.libelle }}</span>
                }
                @case ('unite') {
                  {{ row.unite || '—' }}
                }
                @case ('quantite') {
                  {{ row.quantite ?? '—' }}
                }
              }
            </ng-template>
          </nf-listing-tree>
        </div>
        <aside class="lab__opts">
          <h2>Configuration</h2>
          <p class="lab__hint">Chrome aligné sur nf-listing-flat. Les built-ins add-node / add-child se relabelent via config.actionLabels (lot · sous-lot · article).</p>
          <button type="button" class="lab__go" (click)="revealNested()">Révéler l’article 01.01.01</button>
          <label><input type="checkbox" [ngModel]="optSearch()" (ngModelChange)="optSearch.set($event)" /> Search</label>
          <label><input type="checkbox" [ngModel]="optColumns()" (ngModelChange)="optColumns.set($event)" /> Visibilité colonnes</label>
          <label><input type="checkbox" [ngModel]="optTreeActions()" (ngModelChange)="optTreeActions.set($event)" /> Actions arbre</label>
          <label><input type="checkbox" [ngModel]="optBulkSelect()" (ngModelChange)="optBulkSelect.set($event)" /> Sélection multiple</label>
          <label><input type="checkbox" [ngModel]="optReadonly()" (ngModelChange)="optReadonly.set($event)" /> Lecture seule</label>
          <label><input type="checkbox" [ngModel]="optMetierActions()" (ngModelChange)="optMetierActions.set($event)" /> Labels métier (lot / article)</label>
        </aside>
      </div>
    </nf-screen>
  `,
  styles: [
    `
      .lab {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 240px;
        gap: 16px;
        min-height: 0;
        height: 100%;
      }
      .lab__stage {
        min-width: 0;
        min-height: 0;
      }
      .lab__opts {
        border-left: 1px solid var(--nf-color-border, #e5e7eb);
        padding-left: 14px;
        font-size: 13px;
      }
      .lab__opts h2 {
        margin: 0 0 6px;
        font-size: 0.75rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--nf-text-muted, #6b7280);
      }
      .lab__hint {
        margin: 0 0 12px;
        color: var(--nf-text-muted, #6b7280);
        font-size: 12px;
      }
      .lab__go {
        display: block;
        width: 100%;
        margin: 0 0 12px;
        padding: 6px 10px;
        border: 1px solid var(--nf-color-border, #e5e7eb);
        border-radius: 6px;
        background: var(--nf-color-surface, #fff);
        font-size: 12px;
        cursor: pointer;
      }
      .lab__go:hover {
        background: var(--nf-color-gray-50, #f9fafb);
      }
      .lab__opts label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        background: #f3f4f6;
        color: #374151;
      }
      .badge[data-type='LOT'] {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .badge[data-type='SOUS_LOT'] {
        background: #e0e7ff;
        color: #4338ca;
      }
      .badge[data-type='ARTICLE'] {
        background: #f3f4f6;
        color: #4b5563;
      }
      .code {
        font-variant-numeric: tabular-nums;
        color: var(--nf-text-muted, #6b7280);
      }
      .libelle {
        font-weight: 500;
      }
      @media (max-width: 800px) {
        .lab {
          grid-template-columns: 1fr;
        }
        .lab__opts {
          border-left: 0;
          padding-left: 0;
          border-top: 1px solid var(--nf-color-border, #e5e7eb);
          padding-top: 12px;
        }
      }
    `,
  ],
})
export class ListingTreePage {
  readonly tree = viewChild(ListingTreeComponent);
  readonly optSearch = signal(true);
  readonly optColumns = signal(true);
  readonly optTreeActions = signal(true);
  readonly optBulkSelect = signal(true);
  readonly optReadonly = signal(false);
  readonly optMetierActions = signal(true);

  readonly nodes = signal<NfTreeNode<BordereauRow>[]>(stampKind(SEED));

  private readonly columns: NfTreeTableColumn<BordereauRow>[] = [
    { key: 'type', label: 'Type', width: '5rem' },
    { key: 'code', label: 'Code', width: '7rem' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'unite', label: 'Unité', width: '5rem', align: 'center' },
    { key: 'quantite', label: 'Qté', width: '5rem', align: 'end' },
  ];

  readonly headerConfig: PageHeaderConfig = {
    title: 'Bordereau',
    subtitle: 'nf-listing-tree · même chrome que nf-listing-flat · actions overridables',
  };

  readonly listingConfig = computed((): ListingTreeConfig<BordereauRow> => ({
    columns: this.columns,
    treeColumnKey: 'libelle',
    searchFields: ['code', 'libelle'],
    emptyMessage: 'Aucun lot / article',
    readonly: this.optReadonly(),
    allowsChildren: (n) => NODE_KINDS[n.data.type].allowsChildren,
    actionLabels: this.optMetierActions()
      ? {
          addNode: 'Ajouter un lot',
          addChild: ({ selected }) => {
            if (selected?.type === 'LOT') return 'Ajouter un sous-lot';
            if (selected?.type === 'SOUS_LOT') return 'Ajouter un article';
            return 'Ajouter un enfant';
          },
        }
      : undefined,
    features: {
      search: this.optSearch(),
      columnToggle: this.optColumns(),
      treeActions: this.optTreeActions(),
      bulkSelect: this.optBulkSelect(),
    },
  }));

  revealNested(): void {
    this.tree()?.reveal('art-1');
  }

  onAction(ev: ListingTreeAction): void {
    if (ev.id === 'add-node') {
      const row = ev.selectedId ? this.findRow(this.nodes(), ev.selectedId) : null;
      if (row) this.addSibling(row);
      else this.addRoot();
      return;
    }
    if (ev.id === 'add-child' && ev.selectedId) {
      this.addChild(ev.selectedId);
      return;
    }
    if (ev.id === 'delete' && ev.selectedId) {
      this.deleteNode(ev.selectedId);
      return;
    }
    if (ev.id === 'delete-many' && ev.selectedIds?.length) {
      this.nodes.update((xs) => {
        let next = xs;
        for (const id of ev.selectedIds!) next = this.removeNode(next, id);
        return next;
      });
    }
  }

  typeLabel(type: BordereauType): string {
    if (type === 'SOUS_LOT') return 'Sous-lot';
    if (type === 'ARTICLE') return 'Article';
    return 'Lot';
  }

  private addRoot(): void {
    const id = `lot-${Date.now()}`;
    this.nodes.update((xs) => [
      ...xs,
      makeKindNode({
        id,
        type: 'LOT',
        code: String(xs.length + 1).padStart(2, '0'),
        libelle: 'Nouveau lot',
      }),
    ]);
  }

  private addChild(parentId: string): void {
    const parentNode = findTreeNode(this.nodes(), parentId);
    if (!parentNode || !nodeAllowsChildren(parentNode, (n) => NODE_KINDS[n.data.type].allowsChildren)) {
      return;
    }
    const parent = parentNode.data;
    const id = `n-${Date.now()}`;
    const childType: BordereauType = parent.type === 'LOT' ? 'SOUS_LOT' : 'ARTICLE';
    const child = makeKindNode({
      id,
      type: childType,
      code: `${parent.code}.01`,
      libelle: childType === 'SOUS_LOT' ? 'Nouveau sous-lot' : 'Nouvel article',
      unite: childType === 'ARTICLE' ? 'u' : undefined,
      quantite: childType === 'ARTICLE' ? 1 : undefined,
    });
    this.nodes.update((xs) => this.mapTree(xs, parentId, (node) => ({
      ...node,
      children: [...(node.children ?? []), child],
    })));
  }

  private addSibling(row: BordereauRow): void {
    if (row.type === 'LOT') {
      this.addRoot();
      return;
    }
    const parentId = this.findParentId(this.nodes(), row.id);
    if (parentId) this.addChild(parentId);
  }

  private deleteNode(id: string): void {
    this.nodes.update((xs) => this.removeNode(xs, id));
  }

  private removeNode(
    nodes: NfTreeNode<BordereauRow>[],
    id: string
  ): NfTreeNode<BordereauRow>[] {
    return nodes
      .filter((n) => n.data.id !== id)
      .map((n) =>
        n.children?.length ? { ...n, children: this.removeNode(n.children, id) } : n
      );
  }

  private findRow(nodes: NfTreeNode<BordereauRow>[], id: string): BordereauRow | null {
    for (const n of nodes) {
      if (n.data.id === id) return n.data;
      if (n.children?.length) {
        const hit = this.findRow(n.children, id);
        if (hit) return hit;
      }
    }
    return null;
  }

  private findParentId(
    nodes: NfTreeNode<BordereauRow>[],
    id: string,
    parent: string | null = null
  ): string | null {
    for (const n of nodes) {
      if (n.data.id === id) return parent;
      if (n.children?.length) {
        const hit = this.findParentId(n.children, id, n.data.id);
        if (hit) return hit;
      }
    }
    return null;
  }

  private mapTree(
    nodes: NfTreeNode<BordereauRow>[],
    id: string,
    map: (n: NfTreeNode<BordereauRow>) => NfTreeNode<BordereauRow>
  ): NfTreeNode<BordereauRow>[] {
    return nodes.map((n) => {
      if (n.data.id === id) return map(n);
      if (!n.children?.length) return n;
      return { ...n, children: this.mapTree(n.children, id, map) };
    });
  }
}

/** Kind rules for this tree — nf-listing-tree only reads `allowsChildren`. */
const NODE_KINDS: Record<BordereauType, { allowsChildren: boolean }> = {
  LOT: { allowsChildren: true },
  SOUS_LOT: { allowsChildren: true },
  ARTICLE: { allowsChildren: false },
};

function makeKindNode(data: BordereauRow): NfTreeNode<BordereauRow> {
  const allows = NODE_KINDS[data.type].allowsChildren;
  return {
    key: data.id,
    data,
    allowsChildren: allows,
    leaf: !allows,
    children: allows ? [] : undefined,
  };
}

function stampKind(nodes: NfTreeNode<BordereauRow>[]): NfTreeNode<BordereauRow>[] {
  return nodes.map((n) => {
    const allows = NODE_KINDS[n.data.type].allowsChildren;
    return {
      ...n,
      allowsChildren: allows,
      leaf: !allows,
      children: n.children?.length ? stampKind(n.children) : n.children,
    };
  });
}

const SEED: NfTreeNode<BordereauRow>[] = [
  {
    key: 'lot-1',
    data: { id: 'lot-1', type: 'LOT', code: '01', libelle: 'Gros œuvre' },
    children: [
      {
        key: 'sl-1',
        data: { id: 'sl-1', type: 'SOUS_LOT', code: '01.01', libelle: 'Terrassement' },
        children: [
          {
            key: 'art-1',
            leaf: true,
            data: {
              id: 'art-1',
              type: 'ARTICLE',
              code: '01.01.01',
              libelle: 'Décapage terre végétale',
              unite: 'm³',
              quantite: 85,
            },
          },
          {
            key: 'art-2',
            leaf: true,
            data: {
              id: 'art-2',
              type: 'ARTICLE',
              code: '01.01.02',
              libelle: 'Remblai compacté',
              unite: 'm³',
              quantite: 120,
            },
          },
        ],
      },
      {
        key: 'sl-2',
        data: { id: 'sl-2', type: 'SOUS_LOT', code: '01.02', libelle: 'Fondations' },
        children: [
          {
            key: 'art-3',
            leaf: true,
            data: {
              id: 'art-3',
              type: 'ARTICLE',
              code: '01.02.01',
              libelle: 'Béton de propreté',
              unite: 'm³',
              quantite: 12,
            },
          },
          {
            key: 'art-4',
            leaf: true,
            data: {
              id: 'art-4',
              type: 'ARTICLE',
              code: '01.02.02',
              libelle: 'Semelles filantes',
              unite: 'ml',
              quantite: 48,
            },
          },
        ],
      },
    ],
  },
  {
    key: 'lot-2',
    data: { id: 'lot-2', type: 'LOT', code: '02', libelle: 'Second œuvre' },
    children: [
      {
        key: 'art-5',
        leaf: true,
        data: {
          id: 'art-5',
          type: 'ARTICLE',
          code: '02.01',
          libelle: 'Cloisons sèches',
          unite: 'm²',
          quantite: 180,
        },
      },
      {
        key: 'art-6',
        leaf: true,
        data: {
          id: 'art-6',
          type: 'ARTICLE',
          code: '02.02',
          libelle: 'Faux plafonds',
          unite: 'm²',
          quantite: 95,
        },
      },
    ],
  },
  {
    key: 'lot-3',
    data: { id: 'lot-3', type: 'LOT', code: '03', libelle: 'Menuiserie' },
    children: [
      {
        key: 'art-7',
        leaf: true,
        data: {
          id: 'art-7',
          type: 'ARTICLE',
          code: '03.01',
          libelle: 'Portes bois intérieur',
          unite: 'u',
          quantite: 24,
        },
      },
      {
        key: 'art-8',
        leaf: true,
        data: {
          id: 'art-8',
          type: 'ARTICLE',
          code: '03.02',
          libelle: 'Fenêtres aluminium',
          unite: 'u',
          quantite: 18,
        },
      },
    ],
  },
  {
    key: 'lot-4',
    data: { id: 'lot-4', type: 'LOT', code: '04', libelle: 'Peinture' },
    children: [
      {
        key: 'art-9',
        leaf: true,
        data: {
          id: 'art-9',
          type: 'ARTICLE',
          code: '04.01',
          libelle: 'Peinture acrylique murs',
          unite: 'm²',
          quantite: 640,
        },
      },
    ],
  },
  {
    key: 'lot-5',
    data: { id: 'lot-5', type: 'LOT', code: '05', libelle: 'Fluides' },
    children: [
      {
        key: 'sl-3',
        data: { id: 'sl-3', type: 'SOUS_LOT', code: '05.01', libelle: 'Plomberie' },
        children: [
          {
            key: 'art-10',
            leaf: true,
            data: {
              id: 'art-10',
              type: 'ARTICLE',
              code: '05.01.01',
              libelle: 'Réseau eau froide / chaude',
              unite: 'ml',
              quantite: 210,
            },
          },
        ],
      },
      {
        key: 'sl-4',
        data: { id: 'sl-4', type: 'SOUS_LOT', code: '05.02', libelle: 'Électricité' },
        children: [
          {
            key: 'art-11',
            leaf: true,
            data: {
              id: 'art-11',
              type: 'ARTICLE',
              code: '05.02.01',
              libelle: 'Tableau général basse tension',
              unite: 'u',
              quantite: 1,
            },
          },
          {
            key: 'art-12',
            leaf: true,
            data: {
              id: 'art-12',
              type: 'ARTICLE',
              code: '05.02.02',
              libelle: 'Chemin de câbles',
              unite: 'ml',
              quantite: 85,
            },
          },
        ],
      },
    ],
  },
  {
    key: 'lot-6',
    data: { id: 'lot-6', type: 'LOT', code: '06', libelle: 'Chambres froides' },
    children: [
      {
        key: 'art-13',
        leaf: true,
        data: {
          id: 'art-13',
          type: 'ARTICLE',
          code: '06.01',
          libelle: 'Panneaux sandwich isolation',
          unite: 'm²',
          quantite: 320,
        },
      },
    ],
  },
];
