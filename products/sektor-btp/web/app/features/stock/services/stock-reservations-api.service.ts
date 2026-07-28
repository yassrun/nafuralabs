import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ReservationStock, ReservationStockStatus } from '../models';

/** API row from `/api/v1/stock-reservations`. */
export interface ApiStockReservation {
  id: string;
  itemId: string;
  quantity: number;
  uom?: string;
  chantierId: string;
  dateBesoin: string;
  dateExpiration: string;
  dateCreation: string;
  createdBy?: string;
  status: ReservationStockStatus;
  motif?: string;
}

export type StockReservationCreateBody = Omit<ApiStockReservation, 'id' | 'status' | 'dateCreation'>;

@Injectable({ providedIn: 'root' })
export class StockReservationsApiService extends FeatureApiService<ApiStockReservation, StockReservationCreateBody> {
  protected override basePath = '/api/v1/stock-reservations';

  async list(query?: { chantierId?: string; status?: ReservationStockStatus }): Promise<ApiStockReservation[]> {
    let params = new HttpParams();
    if (query?.chantierId) {
      params = params.set('chantierId', query.chantierId);
    }
    if (query?.status) {
      params = params.set('status', query.status);
    }
    return this.get<ApiStockReservation[]>(this.basePath, params);
  }

  async release(id: string): Promise<ApiStockReservation> {
    return this.post<ApiStockReservation>(`${this.basePath}/${id}/release`, {});
  }
}

export function apiToReservationStock(row: ApiStockReservation): ReservationStock {
  return {
    id: row.id,
    articleId: row.itemId,
    qte: Number(row.quantity),
    uom: row.uom ?? '',
    chantierId: row.chantierId,
    dateBesoin: row.dateBesoin,
    dateExpiration: row.dateExpiration,
    dateCreation: row.dateCreation,
    creePar: row.createdBy ?? '',
    status: row.status,
    motif: row.motif,
  };
}

export function reservationStockToCreateBody(
  input: Omit<ReservationStock, 'id' | 'dateCreation' | 'status'>,
): StockReservationCreateBody {
  return {
    itemId: input.articleId,
    quantity: input.qte,
    uom: input.uom,
    chantierId: input.chantierId,
    dateBesoin: input.dateBesoin,
    dateExpiration: input.dateExpiration,
    createdBy: input.creePar,
    motif: input.motif,
  };
}
