import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ScreenComponent } from '@platform/lib/anatomy/components/organisms/page-screen';
import type { PageHeaderConfig } from '@platform/lib/anatomy/components/molecules/page-header';
import {
  ListingTreeComponent,
  type ListingTreeConfig,
} from '@platform/lib/anatomy/components/organisms/listing-tree';
import type { NfTreeNode, NfTreeTableColumn } from '@platform/lib/anatomy/components/organisms/tree-table';
import type { FilterFieldConfig } from '@platform/lib/anatomy/types';

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
            [canAddChild]="canAddChild()"
            (rowClick)="onRowClick($event)"
            (action)="onAction($event)"
          />
        </div>
        <aside class="lab__opts">
          <h2>Configuration</h2>
          <p class="lab__hint">Un header de colonnes · visibilité via l’œil. Expand / add-child = toolbar de vue.</p>
          <label><input type="checkbox" [ngModel]="optSearch()" (ngModelChange)="optSearch.set($event)" /> Search</label>
          <label><input type="checkbox" [ngModel]="optFilters()" (ngModelChange)="optFilters.set($event)" /> Filtres</label>
          <label><input type="checkbox" [ngModel]="optColumns()" (ngModelChange)="optColumns.set($event)" /> Visibilité colonnes</label>
          <label><input type="checkbox" [ngModel]="optTreeActions()" (ngModelChange)="optTreeActions.set($event)" /> Actions arbre</label>
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
      .lab__opts label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px;
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
  readonly optSearch = signal(true);
  readonly optFilters = signal(true);
  readonly optColumns = signal(true);
  readonly optTreeActions = signal(true);
  readonly selected = signal<BordereauRow | null>(null);

  readonly nodes = signal<NfTreeNode<BordereauRow>[]>(SEED);

  private readonly columns: NfTreeTableColumn<BordereauRow>[] = [
    { key: 'type', label: 'Type', width: '5rem' },
    { key: 'code', label: 'Code', width: '7rem' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'unite', label: 'Unité', width: '5rem', align: 'center' },
    { key: 'quantite', label: 'Qté', width: '5rem', align: 'end' },
  ];

  private readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Lot', value: 'LOT' },
        { label: 'Sous-lot', value: 'SOUS_LOT' },
        { label: 'Article', value: 'ARTICLE' },
      ],
    },
  ];

  readonly headerConfig: PageHeaderConfig = {
    title: 'Bordereau',
    subtitle: 'nf-listing-tree · un header colonnes + visibilité',
  };

  readonly listingConfig = computed((): ListingTreeConfig<BordereauRow> => ({
    columns: this.columns,
    treeColumnKey: 'libelle',
    filters: this.filterFields,
    searchFields: ['code', 'libelle'],
    emptyMessage: 'Aucun lot / article',
    features: {
      search: this.optSearch(),
      filters: this.optFilters(),
      columnToggle: this.optColumns(),
      treeActions: this.optTreeActions(),
    },
  }));

  readonly canAddChild = computed(() => {
    const row = this.selected();
    return !!row && row.type !== 'ARTICLE';
  });

  onRowClick(row: BordereauRow): void {
    this.selected.set(row);
  }

  onAction(ev: { id: string; selectedId: string | null }): void {
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
    }
  }

  private addRoot(): void {
    const id = `lot-${Date.now()}`;
    this.nodes.update((xs) => [
      ...xs,
      {
        key: id,
        data: {
          id,
          type: 'LOT',
          code: String(xs.length + 1).padStart(2, '0'),
          libelle: 'Nouveau lot',
        },
        children: [],
      },
    ]);
  }

  private addChild(parentId: string): void {
    const parent = this.findRow(this.nodes(), parentId);
    if (!parent || parent.type === 'ARTICLE') return;
    const id = `n-${Date.now()}`;
    const childType: BordereauType = parent.type === 'LOT' ? 'SOUS_LOT' : 'ARTICLE';
    const child: NfTreeNode<BordereauRow> = {
      key: id,
      leaf: childType === 'ARTICLE',
      data: {
        id,
        type: childType,
        code: `${parent.code}.01`,
        libelle: childType === 'SOUS_LOT' ? 'Nouveau sous-lot' : 'Nouvel article',
        unite: childType === 'ARTICLE' ? 'u' : undefined,
        quantite: childType === 'ARTICLE' ? 1 : undefined,
      },
      children: childType === 'ARTICLE' ? undefined : [],
    };
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
    if (this.selected()?.id === id) this.selected.set(null);
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

const SEED: NfTreeNode<BordereauRow>[] = [
  {
    key: 'lot-1',
    data: { id: 'lot-1', type: 'LOT', code: '01', libelle: 'Gros œuvre' },
    children: [
      {
        key: 'sl-1',
        data: { id: 'sl-1', type: 'SOUS_LOT', code: '01.01', libelle: 'Fondations' },
        children: [
          {
            key: 'art-1',
            leaf: true,
            data: {
              id: 'art-1',
              type: 'ARTICLE',
              code: '01.01.01',
              libelle: 'Béton de propreté',
              unite: 'm³',
              quantite: 12,
            },
          },
          {
            key: 'art-2',
            leaf: true,
            data: {
              id: 'art-2',
              type: 'ARTICLE',
              code: '01.01.02',
              libelle: 'Semelles filantes',
              unite: 'ml',
              quantite: 48,
            },
          },
        ],
      },
      {
        key: 'sl-2',
        data: { id: 'sl-2', type: 'SOUS_LOT', code: '01.02', libelle: 'Élévation' },
        children: [
          {
            key: 'art-3',
            leaf: true,
            data: {
              id: 'art-3',
              type: 'ARTICLE',
              code: '01.02.01',
              libelle: 'Maçonnerie parpaing',
              unite: 'm²',
              quantite: 220,
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
        key: 'art-4',
        leaf: true,
        data: {
          id: 'art-4',
          type: 'ARTICLE',
          code: '02.01',
          libelle: 'Cloisons sèches',
          unite: 'm²',
          quantite: 180,
        },
      },
    ],
  },
];
