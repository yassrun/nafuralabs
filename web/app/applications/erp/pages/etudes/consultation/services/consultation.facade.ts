import { Injectable, inject } from '@angular/core';

import { GridFacade } from '@lib/anatomy';
import type {
  Consultation,
  ConsultationCreate,
  ConsultationUpdate,
} from '../models';

import { ConsultationApiService } from './consultation-api.service';

@Injectable({ providedIn: 'root' })
export class ConsultationFacade extends GridFacade<
  Consultation,
  ConsultationCreate,
  ConsultationUpdate
> {
  protected override api = inject(ConsultationApiService);
}
