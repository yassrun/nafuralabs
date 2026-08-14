import { Injectable, inject } from '@angular/core';

import type { InventoryTx } from '../models';
import { InventoryTxesApiService } from '../../pages/inventory/mouvements/inventory-txes/services/inventory-tx-api.service';
import {
  apiDetailToInventaireTx,
  apiDetailToInventoryTx,
  type ApiInventoryTxDetail,
  type ApiInventoryTxRow,
  uiTxToWithLinesBody,
} from './inventory-tx.mapper';
import type { InventaireTx } from '../models';
import type { InventoryTxWithLinesBody, InventoryTxWithLinesUpdateBody } from './inventory-tx-api.types';

export interface MovementEnrichers {
  locationName?: (id?: string) => string | undefined;
  fournisseurName?: (id?: string) => string | undefined;
  motifName?: (id?: string) => string | undefined;
}

/**
 * Shared HTTP CRUD + workflow for inventory movement screens (réception, sortie, transfert…).
 */
@Injectable({ providedIn: 'root' })
export class InventoryMovementApiService {
  private readonly api = inject(InventoryTxesApiService);

  async listHeadersByType(txType: string, query?: { page?: number; pageSize?: number }) {
    const res = await this.api.listByTxType(txType, {
      page: query?.page ?? 0,
      pageSize: query?.pageSize ?? 500,
    });
    return res.items as ApiInventoryTxRow[];
  }

  async getDetail(id: string, enrich?: MovementEnrichers): Promise<InventoryTx> {
    const detail = await this.api.getDetail(id);
    return apiDetailToInventoryTx(detail as ApiInventoryTxDetail, enrich);
  }

  async create(input: Partial<InventoryTx>, enrich?: MovementEnrichers): Promise<InventoryTx> {
    const body: InventoryTxWithLinesBody = {
      ...uiTxToWithLinesBody(input),
      txType: input.txType!,
    };
    const detail = await this.api.createWithLines(body);
    return apiDetailToInventoryTx(detail as ApiInventoryTxDetail, enrich);
  }

  async update(id: string, input: Partial<InventoryTx>, enrich?: MovementEnrichers): Promise<InventoryTx> {
    const body: InventoryTxWithLinesUpdateBody = uiTxToWithLinesBody({ ...input, txType: input.txType });
    const detail = await this.api.updateWithLines(id, body);
    return apiDetailToInventoryTx(detail as ApiInventoryTxDetail, enrich);
  }

  async delete(id: string): Promise<void> {
    return this.api.delete(id);
  }

  async validate(id: string, enrich?: MovementEnrichers): Promise<InventoryTx> {
    await this.api.validate(id);
    return this.getDetail(id, enrich);
  }

  async cancel(id: string, enrich?: MovementEnrichers): Promise<InventoryTx> {
    await this.api.cancel(id);
    return this.getDetail(id, enrich);
  }

  async submit(id: string, enrich?: MovementEnrichers): Promise<InventoryTx> {
    await this.api.submit(id);
    return this.getDetail(id, enrich);
  }

  async getInventaireDetail(id: string, enrich?: MovementEnrichers): Promise<InventaireTx> {
    const detail = await this.api.getDetail(id);
    return apiDetailToInventaireTx(detail as ApiInventoryTxDetail, enrich);
  }

  async createInventaire(input: Partial<InventaireTx>, enrich?: MovementEnrichers): Promise<InventaireTx> {
    const body = { ...uiTxToWithLinesBody({ ...input, txType: 'INVENTAIRE' }), txType: 'INVENTAIRE' };
    const detail = await this.api.createWithLines(body);
    return apiDetailToInventaireTx(detail as ApiInventoryTxDetail, enrich);
  }

  async updateInventaire(
    id: string,
    input: Partial<InventaireTx>,
    enrich?: MovementEnrichers,
  ): Promise<InventaireTx> {
    const body = uiTxToWithLinesBody({ ...input, txType: 'INVENTAIRE' });
    const detail = await this.api.updateWithLines(id, body);
    return apiDetailToInventaireTx(detail as ApiInventoryTxDetail, enrich);
  }

  async validateInventaire(id: string, enrich?: MovementEnrichers): Promise<InventaireTx> {
    await this.api.validate(id);
    return this.getInventaireDetail(id, enrich);
  }
}
