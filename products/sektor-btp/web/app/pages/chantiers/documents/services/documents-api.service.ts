import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { DocumentChantier } from '../models';

export interface DocumentQuery extends ListQuery {
  chantierId?: string;
  types?: string[];
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ApiDocumentChantier {
  id: string;
  chantierId: string;
  chantierCode?: string;
  type: string;
  titre: string;
  fichier: string;
  storageKey?: string;
  taille: number;
  uploadedAt: string;
  uploadedPar: string;
  tags?: string[];
}

function apiToUi(row: ApiDocumentChantier): DocumentChantier {
  return {
    id: row.id,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode ?? row.chantierId,
    type: row.type as DocumentChantier['type'],
    titre: row.titre,
    fichier: row.fichier,
    storageKey: row.storageKey,
    taille: Number(row.taille ?? 0),
    uploadedAt: row.uploadedAt,
    uploadedPar: row.uploadedPar,
    tags: row.tags,
  };
}

@Injectable({ providedIn: 'root' })
export class DocumentsApiService extends FeatureApiService<DocumentChantier, never, never> {
  protected override basePath = '/api/v1/chantiers';

  override async getAll(query?: ListQuery): Promise<ListResponse<DocumentChantier>> {
    return this.list(query as DocumentQuery | undefined);
  }

  async list(query?: DocumentQuery): Promise<ListResponse<DocumentChantier>> {
    const q = query ?? {};
    let params = new HttpParams()
      .set('page', String(Math.max(0, Number(q.page ?? 1) - 1)))
      .set('size', String(Math.max(1, Number(q.pageSize ?? 48))));
    const search = String(q['search'] ?? '').trim();
    if (search) params = params.set('search', search);
    if (q.chantierId) params = params.set('chantierId', q.chantierId);
    if (q.types?.length) params = params.set('types', q.types.join(','));
    if (q.uploadedBy?.trim()) params = params.set('uploadedBy', q.uploadedBy.trim());
    if (q.dateFrom) params = params.set('dateFrom', q.dateFrom);
    if (q.dateTo) params = params.set('dateTo', q.dateTo);

    const response = await this.get<unknown>(`${this.basePath}/documents`, params);
    const normalized = this.normalizeListResponse(response);
    const items = (normalized.items as ApiDocumentChantier[]).map(apiToUi);
    return { items, total: normalized.total ?? items.length };
  }

  async getByChantierId(chantierId: string): Promise<DocumentChantier[]> {
    const rows = await this.get<ApiDocumentChantier[]>(`${this.basePath}/${chantierId}/documents`);
    return (rows ?? []).map(apiToUi);
  }

  async createForChantier(
    chantierId: string,
    data: {
      type: string;
      titre: string;
      fichier: string;
      storageKey?: string;
      taille: number;
      uploadedAt: string;
      uploadedPar: string;
      tags?: string[];
    },
  ): Promise<DocumentChantier> {
    const row = await this.post<ApiDocumentChantier>(`${this.basePath}/${chantierId}/documents`, data);
    return apiToUi(row);
  }

  async updateForChantier(
    chantierId: string,
    id: string,
    data: Partial<Pick<DocumentChantier, 'titre' | 'type' | 'tags'>>,
  ): Promise<DocumentChantier> {
    const row = await this.put<ApiDocumentChantier>(
      `${this.basePath}/${chantierId}/documents/${id}`,
      data,
    );
    return apiToUi(row);
  }

  async deleteForChantier(chantierId: string, id: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${chantierId}/documents/${id}`);
  }
}
