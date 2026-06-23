import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { Pointage, PointageMode, PointageStatus } from '../models';

interface PointageApiDto {
  id: string;
  date: string;
  chantierId: string;
  chantierCode?: string;
  employeId: string;
  employeNom?: string;
  mode: PointageMode;
  heureArrivee?: string;
  heureDepart?: string;
  heuresNormales?: number;
  heuresSup?: number;
  status: PointageStatus;
  journeeBatchId?: string;
  posteBudgetaireId?: string;
}

export interface PointageUpdatePayload {
  mode?: PointageMode;
  heureArrivee?: string;
  heureDepart?: string;
  heuresNormales?: number;
  heuresSup?: number;
  status?: PointageStatus;
  posteBudgetaireId?: string;
}

export interface ChantierPointageSynthese {
  chantierId: string;
  from: string;
  to: string;
  joursPointes: number;
  joursPresents: number;
  heuresNormales: number;
  heuresSup: number;
  heuresTotal: number;
}

function toPointage(row: PointageApiDto): Pointage {
  return {
    id: row.id,
    date: row.date,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode ?? row.chantierId,
    employeId: row.employeId,
    employeNom: row.employeNom ?? row.employeId,
    mode: row.mode,
    heureArrivee: row.heureArrivee,
    heureDepart: row.heureDepart,
    heuresNormales: row.heuresNormales != null ? Number(row.heuresNormales) : undefined,
    heuresSup: row.heuresSup != null ? Number(row.heuresSup) : undefined,
    pointePar: 'Chef chantier',
    status: row.status,
    syncStatus: 'SYNCED',
    journeeBatchId: row.journeeBatchId,
  };
}

function monthBounds(mois: string): { from: string; to: string } {
  const [year, month] = mois.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${mois}-01`,
    to: `${mois}-${String(lastDay).padStart(2, '0')}`,
  };
}

@Injectable({ providedIn: 'root' })
export class PointageApiService extends FeatureApiService<Pointage, never, PointageUpdatePayload> {
  protected override basePath = '/api/v1/rh/pointages';

  async listByDate(chantierId: string | undefined, date: string): Promise<Pointage[]> {
    let params = new HttpParams().set('date', date);
    if (chantierId) {
      params = params.set('chantierId', chantierId);
    }
    const rows = await this.get<PointageApiDto[]>(this.basePath, params);
    return (rows ?? []).map(toPointage);
  }

  async listForPeriod(
    chantierId: string | undefined,
    from: string,
    to: string,
  ): Promise<Pointage[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (chantierId) {
      params = params.set('chantierId', chantierId);
    }
    const rows = await this.get<PointageApiDto[]>(this.basePath, params);
    return (rows ?? []).map(toPointage);
  }

  async listForMonth(chantierId: string | undefined, mois: string): Promise<Pointage[]> {
    const { from, to } = monthBounds(mois);
    return this.listForPeriod(chantierId || undefined, from, to);
  }

  async listByEmploye(employeId: string, from: string, to: string): Promise<Pointage[]> {
    const params = new HttpParams()
      .set('employeId', employeId)
      .set('from', from)
      .set('to', to);
    const rows = await this.get<PointageApiDto[]>(`${this.basePath}/by-employe`, params);
    return (rows ?? []).map(toPointage);
  }

  async updatePointage(id: string, data: PointageUpdatePayload): Promise<Pointage> {
    const row = await this.put<PointageApiDto>(`${this.basePath}/${id}`, data);
    return toPointage(row);
  }

  async validateBatch(batchId: string): Promise<void> {
    await this.post<unknown>(`/api/v1/rh/pointage-batches/${batchId}/valider`, {});
  }

  async syntheseChantier(
    chantierId: string,
    from: string,
    to: string,
  ): Promise<ChantierPointageSynthese> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.get<ChantierPointageSynthese>(
      `/api/v1/chantiers/${chantierId}/pointages/synthese`,
      params,
    );
  }
}
