/**
 * UnitOfMeasure Facade — Generated once (wrapper file).
 * Add custom business logic here. This file is never overwritten.
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { UnitOfMeasuresApiService } from './unit-of-measure-api.service';
import type { UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasuresFacade extends GridFacade<UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate> {
  protected override api = inject(UnitOfMeasuresApiService);

  // ─── Custom Business Actions ──────────────────────────────────────────────
  // Add entity-specific operations below:

  // async archiveItem(id: string): Promise<UnitOfMeasure> {
  //   return this.updateItem(id, { isActive: false } as UnitOfMeasureUpdate);
  // }
}
