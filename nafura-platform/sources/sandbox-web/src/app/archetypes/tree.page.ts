import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';

import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import { ListingControlsComponent } from '@platform/lib/anatomy/components/molecules/listing-controls';
import { ListingActionsComponent } from '@platform/lib/anatomy/components/molecules/listing-actions';
import {
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@platform/lib/anatomy/components/organisms/tree-table';
import type { FilterFieldConfig } from '@platform/lib/anatomy/types';

/** Études-like hierarchy: LOT → SOUS_LOT → ARTICLE */
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
  selector: 'sb-tree',
  standalone: true,
  imports: [
    PageShellComponent,
    PageHeaderComponent,
    ListingControlsComponent,
    ListingActionsComponent,
    TreeTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig" />

      <div class="toolbar">
        <nf-listing-controls
          [showColumnsButton]="false"
          [filterActive]="filterActive()"
          [filterFields]="filterFields"
          [filterValues]="filterValues()"
          [search]="search()"
          (filterChange)="onFilterChange($event)"
          (searchChange)="search.set($event)"
        />
        <nf-listing-actions
          mode="tree"
          [selectedId]="selectedId()"
          [canAddChild]="canAddChild()"
          addNodeLabel="Ajouter un nœud"
          addChildLabel="Ajouter un enfant"
          deleteLabel="Supprimer"
          deleteConfirmTitle="Confirmer la suppression"
          deleteConfirmMessage="Supprimer ce nœud et ses enfants ? Cette action est irréversible."
          deleteConfirmLabel="Supprimer"
          expandAllLabel="Tout déplier"
          collapseAllLabel="Tout replier"
          (actionClick)="onAction($event)"
        />
      </div>

      <nf-tree-table
        [nodes]="filteredNodes()"
        [columns]="columns"
        treeColumnKey="libelle"
        [rowClickable]="true"
        [rowClass]="rowClass"
        [expandedKeys]="expandedKeys()"
        (expandedKeysChange)="expandedKeys.set($event)"
        (rowClick)="onRowClick($event)"
        emptyMessage="Aucun lot / article"
        minWidth="40rem"
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
      </nf-tree-table>
    </nf-page-shell>
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
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
      :host ::ng-deep tr.row--selected {
        background: var(--nf-color-primary-50, #eff6ff) !important;
      }
    `,
  ],
})
export class TreePage {
  readonly headerConfig = {
    title: 'Arbre du bordereau',
    subtitle: 'nf-tree · nf-tree-table + listing-actions (études pattern)',
  };

  readonly search = signal('');
  readonly filterValues = signal<Record<string, unknown>>({});
  readonly selectedId = signal<string | null>('lot-1');
  readonly expandedKeys = signal<ReadonlySet<string>>(new Set(['lot-1', 'sl-1']));

  readonly nodes = signal<NfTreeNode<BordereauRow>[]>([
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
  ]);

  readonly columns: NfTreeTableColumn<BordereauRow>[] = [
    { key: 'type', label: 'Type', width: '5rem' },
    { key: 'code', label: 'Code', width: '7rem' },
    { key: 'libelle', label: 'Libellé' },
    { key: 'unite', label: 'Unité', width: '5rem', align: 'center' },
    { key: 'quantite', label: 'Qté', width: '5rem', align: 'end' },
  ];

  readonly filterFields: FilterFieldConfig[] = [
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

  readonly filterActive = computed(() => Object.keys(this.filterValues()).length > 0);

  readonly selectedRow = computed(() => {
    const id = this.selectedId();
    return id ? this.findRow(this.nodes(), id) : null;
  });

  readonly canAddChild = computed(() => {
    const row = this.selectedRow();
    return !!row && row.type !== 'ARTICLE';
  });

  readonly filteredNodes = computed(() => {
    const q = this.search().trim().toLowerCase();
    const type = this.filterValues()['type'] as BordereauType | undefined;
    if (!q && !type) return this.nodes();
    return this.filterTree(this.nodes(), (row) => {
      if (type && row.type !== type) return false;
      if (q) {
        const hay = `${row.code} ${row.libelle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  readonly rowClass = (row: BordereauRow): Record<string, boolean> => ({
    'row--selected': row.id === this.selectedId(),
  });

  typeLabel(type: BordereauType): string {
    if (type === 'LOT') return 'Lot';
    if (type === 'SOUS_LOT') return 'S-lot';
    return 'Art.';
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
  }

  onRowClick(row: BordereauRow): void {
    this.selectedId.set(row.id);
  }

  onAction(id: string): void {
    switch (id) {
      case 'expand-all':
        this.expandedKeys.set(this.collectExpandableKeys(this.nodes()));
        break;
      case 'collapse-all':
        this.expandedKeys.set(new Set());
        break;
      case 'add-node': {
        const row = this.selectedRow();
        if (row) this.onAddSibling(row);
        else this.onAddRoot();
        break;
      }
      case 'add-child': {
        const sel = this.selectedId();
        if (sel) this.onAddChild(sel);
        break;
      }
      case 'delete': {
        const sel = this.selectedId();
        if (sel) this.onDelete(sel);
        break;
      }
    }
  }

  onAddRoot(): void {
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
    this.selectedId.set(id);
  }

  onAddChild(parentId: string): void {
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
    this.nodes.update((xs) =>
      this.mapTree(xs, parentId, (node) => ({
        ...node,
        children: [...(node.children ?? []), child],
      }))
    );
    this.expandedKeys.update((keys) => new Set([...keys, parentId]));
    this.selectedId.set(id);
  }

  onAddSibling(row: BordereauRow): void {
    if (row.type === 'LOT') {
      this.onAddRoot();
      return;
    }
    const parentId = this.findParentId(this.nodes(), row.id);
    if (parentId) this.onAddChild(parentId);
  }

  onDelete(id: string): void {
    this.nodes.update((xs) => this.removeNode(xs, id));
    if (this.selectedId() === id) this.selectedId.set(null);
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

  private collectExpandableKeys(nodes: NfTreeNode<BordereauRow>[]): Set<string> {
    const keys = new Set<string>();
    const walk = (list: NfTreeNode<BordereauRow>[]) => {
      for (const n of list) {
        if (n.children?.length) {
          keys.add(n.key);
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return keys;
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

  private filterTree(
    nodes: NfTreeNode<BordereauRow>[],
    pred: (row: BordereauRow) => boolean
  ): NfTreeNode<BordereauRow>[] {
    const out: NfTreeNode<BordereauRow>[] = [];
    for (const n of nodes) {
      const kids = n.children?.length ? this.filterTree(n.children, pred) : [];
      if (pred(n.data) || kids.length) {
        out.push({ ...n, children: kids.length ? kids : n.children });
      }
    }
    return out;
  }
}
