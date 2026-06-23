import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';

import type { CompteFinancier, MouvementTresorerie, Rapprochement } from '../models';
import {
  type ApiBankAccount,
  type ApiBankStatement,
  type ApiMovementCandidate,
  bankAccountToCompte,
  movementCandidateToUi,
  rapprochementToSavePayload,
  statementToRapprochement,
} from './rapprochement-finance.mapper';
import type { RapprochementCreate, RapprochementUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class BankReconciliationApiService extends FeatureApiService<Rapprochement, never, never> {
  protected override basePath = '/api/v1/bank-statements';

  async listAccounts(): Promise<CompteFinancier[]> {
    const rows = await this.get<ApiBankAccount[]>('/api/v1/bank-accounts');
    return (rows ?? []).map(bankAccountToCompte);
  }

  async accountingBalance(accountId: string, at: string): Promise<number> {
    const params = new HttpParams().set('at', at);
    const value = await this.get<number>(`/api/v1/bank-accounts/${accountId}/balance`, params);
    return Number(value);
  }

  async listHistorique(bankAccountId?: string): Promise<Rapprochement[]> {
    let params: HttpParams | undefined;
    if (bankAccountId) {
      params = new HttpParams().set('bankAccountId', bankAccountId);
    }
    const rows = await this.get<ApiBankStatement[]>(this.basePath, params);
    return (rows ?? []).map(statementToRapprochement);
  }

  async getRapprochement(id: string): Promise<Rapprochement> {
    const row = await this.get<ApiBankStatement>(`${this.basePath}/${id}`);
    return statementToRapprochement(row);
  }

  async listMovementCandidates(
    accountId: string,
    from: string,
    to: string,
    excludeStatementId?: string,
  ): Promise<MouvementTresorerie[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (excludeStatementId) {
      params = params.set('excludeStatementId', excludeStatementId);
    }
    const rows = await this.get<ApiMovementCandidate[]>(
      `/api/v1/bank-accounts/${accountId}/movement-candidates`,
      params,
    );
    return (rows ?? []).map(movementCandidateToUi);
  }

  async saveRapprochement(
    id: string | null,
    payload: RapprochementCreate | RapprochementUpdate,
    pairs: { mouvementId: string; releveLigneId: string }[],
  ): Promise<Rapprochement> {
    const body = rapprochementToSavePayload(payload, pairs);
    const row = id
      ? await this.put<ApiBankStatement>(`${this.basePath}/${id}`, body)
      : await this.post<ApiBankStatement>(this.basePath, body);
    return statementToRapprochement(row);
  }

  async deleteRapprochement(id: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async autoMatchStatement(id: string): Promise<Rapprochement> {
    const row = await this.post<ApiBankStatement>(`${this.basePath}/${id}/auto-match`, {});
    return statementToRapprochement(row);
  }

  async importStatement(
    bankAccountId: string,
    file: File,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<Rapprochement> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankAccountId', bankAccountId);
    if (periodStart) formData.append('periodStart', periodStart);
    if (periodEnd) formData.append('periodEnd', periodEnd);
    const row = await firstValueFrom(
      this.http.post<ApiBankStatement>(this.resolveUrl(`${this.basePath}/import`), formData),
    );
    return statementToRapprochement(row);
  }
}
