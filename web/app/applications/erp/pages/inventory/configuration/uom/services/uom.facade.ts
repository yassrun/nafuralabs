/**
 * Unit of Measure Configuration Facade — backed by `/api/v1/unit-of-measures`.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map, Observable } from 'rxjs';

import type { ListResponse, LookupContext, PartialCrudFacade } from '@lib/anatomy/types';
import { UnitOfMeasuresApiService } from '../../unit-of-measures/services/unit-of-measure-api.service';
import { UoMCategoriesApiService } from '../../uo-mcategories/services/uo-mcategory-api.service';
import type { UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate } from '../../unit-of-measures/models';
import type { UomConfig, UomCreate, UomListItem, UomUpdate } from '../models';

function toUom(dto: UnitOfMeasure): UomConfig {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    uomCategoryId: dto.uomCategoryId ?? '',
    isActive: dto.isActive ?? true,
  };
}

function toUnitCreate(data: UomCreate): UnitOfMeasureCreate {
  return {
    code: data.code,
    name: data.name,
    uomCategoryId: data.uomCategoryId || undefined,
    isActive: data.isActive,
  };
}

@Injectable({ providedIn: 'root' })
export class UomFacade implements PartialCrudFacade<UomConfig, UomCreate> {
  private readonly uomApi = inject(UnitOfMeasuresApiService);
  private readonly catApi = inject(UoMCategoriesApiService);

  readonly isLoading = signal(false);

  readonly items$ = from(this.loadItems()).pipe(map((r) => r.items));
  readonly items = toSignal(this.items$, { initialValue: [] });

  private readonly lookupsSignal = signal<LookupContext>({});
  readonly lookups = computed(() => this.lookupsSignal());

  async ensureLookups(): Promise<void> {
    const catRes = await this.catApi.getAll({ page: 0, pageSize: 500 });
    this.lookupsSignal.set({
      uomCategory: catRes.items.map((c) => ({ key: c.id, value: c.name })),
    });
  }

  async loadItems(): Promise<ListResponse<UomListItem>> {
    this.isLoading.set(true);
    try {
      const [uomRes, catRes] = await Promise.all([
        this.uomApi.getAll({ page: 0, pageSize: 500 }),
        this.catApi.getAll({ page: 0, pageSize: 500 }),
      ]);
      const catMap = new Map(catRes.items.map((c) => [c.id, c.name]));
      const enriched: UomListItem[] = uomRes.items.map((u) => {
        const base = toUom(u);
        return {
          ...base,
          uomCategoryName: u.uomCategoryId ? catMap.get(u.uomCategoryId) ?? u.uomCategoryId : undefined,
        };
      });
      return { items: enriched, total: uomRes.total };
    } finally {
      this.isLoading.set(false);
    }
  }

  async getItem(id: string): Promise<UomConfig> {
    await this.ensureLookups();
    const dto = await this.uomApi.getById(id);
    return toUom(dto);
  }

  async createItem(data: UomCreate): Promise<UomConfig> {
    const dto = await this.uomApi.create(toUnitCreate(data));
    return toUom(dto);
  }

  async updateItem(id: string, data: Partial<UomUpdate>): Promise<UomConfig> {
    const payload: UnitOfMeasureUpdate = {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.uomCategoryId !== undefined ? { uomCategoryId: data.uomCategoryId || undefined } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };
    const dto = await this.uomApi.update(id, payload);
    return toUom(dto);
  }

  async deleteItem(id: string): Promise<void> {
    return this.uomApi.delete(id);
  }

  getUomCategoriesForLookup(): Observable<{ id: string; name: string }[]> {
    return from(this.catApi.getAll({ page: 0, pageSize: 500 })).pipe(
      map((res) => res.items.map((c) => ({ id: c.id, name: `${c.code} - ${c.name}` }))),
    );
  }
}
