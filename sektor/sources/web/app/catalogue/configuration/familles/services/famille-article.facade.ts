/**
 * Famille Article Configuration Facade — backed by `/api/v1/item-categories`.
 */

import { Injectable, computed, inject, signal } from '@angular/core';

import type { ListResponse, PartialCrudFacade } from '@platform/lib/anatomy/types';
import type { NfTreeNode } from '@platform/lib/anatomy/components';
import { ItemCategoriesApiService } from '../../item-categories/services/item-category-api.service';
import type { ItemCategory, ItemCategoryCreate, ItemCategoryUpdate } from '../../item-categories/models';
import type { FamilleArticleConfig, FamilleArticleCreate, FamilleArticleUpdate } from '../models';

function toFamille(dto: ItemCategory): FamilleArticleConfig {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    parentId: dto.parentId,
    isActive: dto.isActive ?? true,
  };
}

function toCategoryCreate(data: FamilleArticleCreate): ItemCategoryCreate {
  return {
    code: data.code,
    name: data.name,
    description: data.description,
    parentId: data.parentId,
    isActive: data.isActive,
  };
}

function toCategoryUpdate(data: Partial<FamilleArticleUpdate>): ItemCategoryUpdate {
  return {
    code: data.code,
    name: data.name,
    description: data.description,
    parentId: data.parentId,
    isActive: data.isActive,
  };
}

/** Nested tree for nf-tree-table (same shape as étude / chantiers lots). */
export function buildFamilleTreeNodes(
  items: FamilleArticleConfig[],
): NfTreeNode<FamilleArticleConfig>[] {
  const active = items.filter((item) => item.isActive !== false);
  const byParent = new Map<string | null, FamilleArticleConfig[]>();

  for (const item of active) {
    const parentKey = item.parentId ?? null;
    const bucket = byParent.get(parentKey) ?? [];
    bucket.push(item);
    byParent.set(parentKey, bucket);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.code.localeCompare(b.code));
  }

  function walk(parentId: string | null): NfTreeNode<FamilleArticleConfig>[] {
    const siblings = byParent.get(parentId) ?? [];
    return siblings.map((item) => {
      const children = walk(item.id);
      return {
        key: item.id,
        data: item,
        children: children.length ? children : undefined,
        leaf: children.length === 0,
        expanded: children.length > 0,
      };
    });
  }

  return walk(null);
}

@Injectable({ providedIn: 'root' })
export class FamilleArticleFacade implements PartialCrudFacade<FamilleArticleConfig, FamilleArticleCreate> {
  private readonly api = inject(ItemCategoriesApiService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly items = signal<FamilleArticleConfig[]>([]);
  readonly treeNodes = computed(() => buildFamilleTreeNodes(this.items()));

  hasChildren(id: string): boolean {
    return this.items().some((item) => item.parentId === id && item.isActive !== false);
  }

  /** Root familles only — for parent select. */
  rootOptions(): { value: string; label: string }[] {
    return this.items()
      .filter((f) => !f.parentId && f.isActive !== false)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((f) => ({ value: f.id, label: `${f.code} — ${f.name}` }));
  }

  async loadItems(): Promise<ListResponse<FamilleArticleConfig>> {
    this.isLoading.set(true);
    try {
      const res = await this.api.getAll({ page: 1, pageSize: 500 });
      const items = res.items.map(toFamille);
      this.items.set(items);
      return { items, total: res.total };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<FamilleArticleConfig> {
    const dto = await this.api.getById(id);
    return toFamille(dto);
  }

  async createItem(data: FamilleArticleCreate): Promise<FamilleArticleConfig> {
    this.isSaving.set(true);
    try {
      const dto = await this.api.create(toCategoryCreate(data));
      return toFamille(dto);
    } finally {
      this.isSaving.set(false);
    }
  }

  async updateItem(id: string, data: Partial<FamilleArticleUpdate>): Promise<FamilleArticleConfig> {
    this.isSaving.set(true);
    try {
      const dto = await this.api.update(id, toCategoryUpdate(data));
      return toFamille(dto);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteItem(id: string): Promise<void> {
    return this.api.delete(id);
  }
}
