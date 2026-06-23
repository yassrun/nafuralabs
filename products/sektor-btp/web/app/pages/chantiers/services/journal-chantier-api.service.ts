import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

export interface ApiJournalChantierRow {
  id: string;
  chantierId: string;
  date: string;
  auteur: string;
  contenu: string;
  type: string;
}

export interface JournalChantierCreate {
  date: string;
  auteur: string;
  contenu: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class JournalChantierApiService extends FeatureApiService<ApiJournalChantierRow, JournalChantierCreate, never> {
  protected override basePath = '/api/v1/chantiers';

  async listForChantier(chantierId: string): Promise<ApiJournalChantierRow[]> {
    const rows = await this.get<ApiJournalChantierRow[]>(`${this.basePath}/${chantierId}/journal`);
    return rows ?? [];
  }

  async createForChantier(chantierId: string, data: JournalChantierCreate): Promise<ApiJournalChantierRow> {
    return this.post<ApiJournalChantierRow>(`${this.basePath}/${chantierId}/journal`, data);
  }
}
