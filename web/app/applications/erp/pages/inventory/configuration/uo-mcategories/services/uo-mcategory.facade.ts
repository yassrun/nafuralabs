/**
 * UoMCategory Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { UoMCategoriesApiService } from './uo-mcategory-api.service';
import type { UoMCategory, UoMCategoryCreate, UoMCategoryUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class UoMCategoriesFacade extends GridFacade<UoMCategory, UoMCategoryCreate, UoMCategoryUpdate> {
  protected override api = inject(UoMCategoriesApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<UoMCategory> {
  //   return this.updateItem(id, { isActive: false } as UoMCategoryUpdate);
  // }
}
