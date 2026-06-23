import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { PointageMode, PointageStatus } from '../models';

export interface PointageBatchInput {
  id?: string;
  employeId: string;
  date: string;
  mode: PointageMode;
  heureArrivee?: string;
  heureDepart?: string;
  heuresNormales?: number;
  heuresSup?: number;
  status?: PointageStatus;
  posteBudgetaireId?: string;
}

export interface PointageBatchCreatePayload {
  clientId: string;
  chefEmployeId: string;
  chantierId: string;
  datePointage: string;
  gpsLat?: number;
  gpsLng?: number;
  signatureUrl?: string;
  photoUrl?: string;
  status?: string;
  pointages: PointageBatchInput[];
}

export interface PointageBatchDto {
  id: string;
  clientId: string;
  chantierId: string;
  datePointage: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class PointageBatchApiService extends FeatureApiService<PointageBatchDto, PointageBatchCreatePayload, never> {
  protected override basePath = '/api/v1/rh/pointage-batches';

  async createBatch(payload: PointageBatchCreatePayload): Promise<PointageBatchDto> {
    return this.post<PointageBatchDto>(this.basePath, payload);
  }
}
