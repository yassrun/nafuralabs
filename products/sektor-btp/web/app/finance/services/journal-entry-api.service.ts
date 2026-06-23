import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import {
  type ApiJournalEntry,
  ecritureCreateToApi,
  ecritureUpdateToApi,
  entryToEcriture,
  entryToListItem,
} from './comptabilite-finance.mapper';
import type { Ecriture, EcritureCreate, EcritureListItem, EcritureUpdate } from '../models';

export interface JournalEntryQuery {
  journalCode?: string;
  from?: string;
  to?: string;
  status?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class JournalEntryApiService extends FeatureApiService<
  Ecriture,
  EcritureCreate,
  EcritureUpdate
> {
  protected override basePath = '/api/v1/journal-entries';

  async list(query: JournalEntryQuery = {}): Promise<EcritureListItem[]> {
    let params = new HttpParams();
    if (query.journalCode) params = params.set('journalCode', query.journalCode);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    const rows = await this.get<ApiJournalEntry[]>(this.basePath, params);
    return (rows ?? []).map(entryToListItem);
  }

  async listFull(query: JournalEntryQuery = {}): Promise<Ecriture[]> {
    let params = new HttpParams();
    if (query.journalCode) params = params.set('journalCode', query.journalCode);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    const rows = await this.get<ApiJournalEntry[]>(this.basePath, params);
    return (rows ?? []).map(entryToEcriture);
  }

  override async getById(id: string | number): Promise<Ecriture> {
    const row = await this.get<ApiJournalEntry>(`${this.basePath}/${id}`);
    return entryToEcriture(row);
  }

  async createWithJournal(journalId: string, data: EcritureCreate): Promise<Ecriture> {
    const row = await this.post<ApiJournalEntry>(
      this.basePath,
      ecritureCreateToApi(data, journalId),
    );
    return entryToEcriture(row);
  }

  override async update(id: string | number, data: EcritureUpdate): Promise<Ecriture> {
    const row = await this.put<ApiJournalEntry>(
      `${this.basePath}/${id}`,
      ecritureUpdateToApi(data),
    );
    return entryToEcriture(row);
  }

  async postEntry(id: string): Promise<Ecriture> {
    const row = await this.post<ApiJournalEntry>(`${this.basePath}/${id}/post`, {});
    return entryToEcriture(row);
  }
}
