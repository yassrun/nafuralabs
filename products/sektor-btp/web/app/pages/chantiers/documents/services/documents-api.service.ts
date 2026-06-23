import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { DocumentChantier } from '../models';

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

  override async getAll(_query?: ListQuery): Promise<ListResponse<DocumentChantier>> {
    const rows = await this.get<ApiDocumentChantier[]>(`${this.basePath}/documents`);
    const items = (rows ?? []).map(apiToUi);
    return { items, total: items.length };
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
}
