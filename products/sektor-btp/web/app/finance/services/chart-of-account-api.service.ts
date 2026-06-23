import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

import {
  type ApiChartOfAccount,
  accountToCompte,
  compteToAccountCreate,
  compteToAccountUpdate,
} from './comptabilite-finance.mapper';
import type { Compte, CompteCreate, CompteUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class ChartOfAccountApiService extends FeatureApiService<
  Compte,
  CompteCreate,
  CompteUpdate
> {
  protected override basePath = '/api/v1/chart-of-accounts';

  async listAll(): Promise<Compte[]> {
    const rows = await this.get<ApiChartOfAccount[]>(this.basePath);
    return (rows ?? []).map(accountToCompte);
  }

  override async getById(id: string | number): Promise<Compte> {
    const row = await this.get<ApiChartOfAccount>(`${this.basePath}/${id}`);
    return accountToCompte(row);
  }

  override async create(data: CompteCreate): Promise<Compte> {
    const row = await this.post<ApiChartOfAccount>(this.basePath, compteToAccountCreate(data));
    return accountToCompte(row);
  }

  override async update(id: string | number, data: CompteUpdate): Promise<Compte> {
    const row = await this.put<ApiChartOfAccount>(
      `${this.basePath}/${id}`,
      compteToAccountUpdate(data),
    );
    return accountToCompte(row);
  }

  override async delete(id: string | number): Promise<void> {
    await super.delete(id);
  }

  async resetToSeed(): Promise<Compte[]> {
    const rows = await this.post<ApiChartOfAccount[]>(`${this.basePath}/reset`, {});
    return (rows ?? []).map(accountToCompte);
  }
}
