import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ListingTreeComponent, type ListingTreeAction, type ListingTreeConfig } from '../../lib/anatomy/components/organisms/listing-tree';
import type { NfTreeNode } from '../../lib/anatomy/components/organisms/tree-table';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import { LISTING_PAGE } from './listing-page.context';
import type { Row } from './listing-page.types';
import { columnsOf, formatValue } from './listing-properties';

/**
 * The tree layout of `nf-listing-page`: rows nested by their parent property, with add, add child, edit and delete.
 * Internal to `platform/listing`; loaded on first use of a tree view.
 */
@Component({
  selector: 'nf-listing-tree-view',
  standalone: true,
  imports: [ListingTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-listing-tree
      [config]="treeConfig()!"
      [nodes]="nodes()"
      [loading]="page.loading()"
      [readonly]="!canCreate()"
      [selectedKey]="selectedKey()"
      (rowClick)="selectedKey.set(rowKey($event))"
      (rowDblClick)="edit($event)"
      (action)="onAction($event)" />
  `,
  styles: `:host { display: contents; }`,
})
export class ListingTreeViewComponent {
  protected readonly page = inject(LISTING_PAGE);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly selectedKey = signal<string | null>(null);

  protected readonly treeConfig = computed((): ListingTreeConfig<Row> | null => {
    const view = this.page.view();
    if (view.layout !== 'tree' || !view.tree) return null;
    const properties = this.page.properties();
    const columns = columnsOf(view.show ?? Object.keys(properties), properties, (key, value, row) =>
      this.translate.instant(formatValue(properties[key], value, row as Row)),
    );
    return {
      columns: columns.map((column) => ({ key: column.key, label: column.label, field: column.field })),
      treeColumnKey: columns[0]?.key ?? 'id',
      emptyMessage: this.page.config().emptyMessage,
      initialExpand: 'all',
      features: { search: true, filters: false, columnToggle: false, treeActions: true, bulkSelect: false },
      actionLabels: view.tree.labels,
    };
  });

  protected readonly nodes = computed((): NfTreeNode<Row>[] => {
    const parentField = this.page.view().tree?.parentField;
    if (!parentField) return [];
    const byId = new Map<string, NfTreeNode<Row>>();
    for (const row of this.page.items()) byId.set(String(row['id']), { key: String(row['id']), data: row, children: [], expanded: true });
    const roots: NfTreeNode<Row>[] = [];
    for (const node of byId.values()) {
      const parent = node.data[parentField] != null ? byId.get(String(node.data[parentField])) : undefined;
      (parent ? parent.children! : roots).push(node);
    }
    return roots;
  });

  protected readonly canCreate = computed(() => !!this.page.action(this.page.view().tree?.create));

  protected rowKey(row: Row): string {
    return String(row['id']);
  }

  protected edit(row: Row): void {
    const action = this.page.action(this.page.view().tree?.edit);
    if (action) void this.page.execute(action, row);
  }

  protected async onAction(event: ListingTreeAction): Promise<void> {
    const tree = this.page.view().tree!;
    const create = this.page.action(tree.create);
    if (event.id === 'add-node' && create) {
      await this.page.execute(create, undefined, { [tree.parentField]: null });
    } else if (event.id === 'add-child' && create && event.selectedId) {
      await this.page.execute(create, undefined, { [tree.parentField]: event.selectedId });
    } else if (event.id === 'delete' && event.selectedId) {
      try {
        await firstValueFrom(this.http.delete(this.page.url(`${this.page.config().endpoint}/${encodeURIComponent(event.selectedId)}`)));
        if (tree.deleted) this.toast.success(this.translate.instant(tree.deleted));
      } catch {
        this.toast.error(this.translate.instant('Action failed'));
      }
      await this.page.reload();
    }
  }
}
