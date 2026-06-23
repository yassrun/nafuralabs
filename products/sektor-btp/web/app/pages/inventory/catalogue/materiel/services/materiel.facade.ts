/**
 * Matériel Facade — Business logic for fleet equipment management
 */

import { Injectable, inject } from '@angular/core';
import { GridFacade } from '@lib/anatomy';
import { MaterielApiService } from './materiel-api.service';
import type { Materiel, MaterielCreate, MaterielUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class MaterielFacade extends GridFacade<Materiel, MaterielCreate, MaterielUpdate> {
  protected override api = inject(MaterielApiService);
}
