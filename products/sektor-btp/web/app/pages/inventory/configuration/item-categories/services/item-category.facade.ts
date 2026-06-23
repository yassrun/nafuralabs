/**
 * ItemCategory Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject, computed } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import type { TreeEditorNode } from '@lib/anatomy/components/organisms/tree-editor';
import { ItemCategoriesApiService } from './item-category-api.service';
import type { ItemCategory, ItemCategoryCreate, ItemCategoryUpdate } from '../models';

function toTreeNodes(items: ItemCategory[]): TreeEditorNode[] {
  const byParent = new Map<string | null, ItemCategory[]>();

  for (const item of items) {
    const parentKey = item.parentId ?? null;
    const bucket = byParent.get(parentKey) ?? [];
    bucket.push(item);
    byParent.set(parentKey, bucket);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.code.localeCompare(b.code));
  }

  const nodes: TreeEditorNode[] = [];
  for (const siblings of byParent.values()) {
    siblings.forEach((item, index) => {
      nodes.push({
        id: item.id,
        label: `${item.code} — ${item.name}`,
        parentId: item.parentId ?? null,
        order: index,
      });
    });
  }

  return nodes;
}

@Injectable({ providedIn: 'root' })
export class ItemCategoriesFacade extends GridFacade<ItemCategory, ItemCategoryCreate, ItemCategoryUpdate> {
  protected override api = inject(ItemCategoriesApiService);

  readonly treeNodes = computed(() => toTreeNodes(this.items()));

  hasChildren(id: string): boolean {
    return this.items().some((item) => item.parentId === id);
  }
}
