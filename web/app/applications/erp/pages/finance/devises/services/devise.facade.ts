import { Injectable, inject } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type {
  Devise,
  DeviseCreate,
  DeviseUpdate,
} from '@applications/erp/finance/models';

import { DeviseApiService } from './devise-api.service';

@Injectable({ providedIn: 'root' })
export class DeviseFacade extends GridFacade<Devise, DeviseCreate, DeviseUpdate> {
  protected override api = inject(DeviseApiService);
}
