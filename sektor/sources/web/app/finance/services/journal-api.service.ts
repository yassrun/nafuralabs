import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import {
  type ApiAccountingJournal,
  type ApiJournalSummary,
  journalCreateToApi,
  journalToApi,
  journalUpdateToApi,
  summaryToJournalSummary,
} from './comptabilite-finance.mapper';
import type { Journal, JournalCreate, JournalSummary, JournalUpdate } from '../models';

@Injectable({ providedIn: 'root' })
export class JournalApiService extends FeatureApiService<Journal, JournalCreate, JournalUpdate> {
  protected override basePath = '/api/v1/journals';

  async listAll(): Promise<Journal[]> {
    const rows = await this.get<ApiAccountingJournal[]>(this.basePath);
    return (rows ?? []).map(journalToApi);
  }

  async summaries(from?: string, to?: string): Promise<JournalSummary[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    const rows = await this.get<ApiJournalSummary[]>(`${this.basePath}/summaries`, params);
    return (rows ?? []).map(summaryToJournalSummary);
  }

  override async getById(id: string | number): Promise<Journal> {
    const row = await this.get<ApiAccountingJournal>(`${this.basePath}/${id}`);
    return journalToApi(row);
  }

  override async create(data: JournalCreate): Promise<Journal> {
    const row = await this.post<ApiAccountingJournal>(this.basePath, journalCreateToApi(data));
    return journalToApi(row);
  }

  override async update(id: string | number, data: JournalUpdate): Promise<Journal> {
    const row = await this.put<ApiAccountingJournal>(
      `${this.basePath}/${id}`,
      journalUpdateToApi(data),
    );
    return journalToApi(row);
  }
}
