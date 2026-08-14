import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import {
  type ApiIndiceBtp,
  type ApiRevisionPrix,
  indiceBtpToUi,
  type IndiceBtpRow,
} from './revision-prix.mapper';

@Injectable({ providedIn: 'root' })
export class RevisionPrixApiService extends FeatureApiService<ApiRevisionPrix, unknown, unknown> {
  protected override basePath = '/api/v1/marches/revisions-prix';

  async listRevisions(contratId?: string): Promise<ApiRevisionPrix[]> {
    let params = new HttpParams();
    if (contratId) params = params.set('contratId', contratId);
    return (await this.get<ApiRevisionPrix[]>(this.basePath, params)) ?? [];
  }

  async calculer(contratMarcheId: string, periode: string): Promise<ApiRevisionPrix> {
    return this.post<ApiRevisionPrix>(`${this.basePath}/calculer`, { contratMarcheId, periode });
  }

  async appliquer(id: string): Promise<ApiRevisionPrix> {
    return this.post<ApiRevisionPrix>(`${this.basePath}/${id}/appliquer`, {});
  }

  async listIndices(periode: string): Promise<IndiceBtpRow[]> {
    const params = new HttpParams().set('periode', periode);
    const rows = await this.get<ApiIndiceBtp[]>('/api/v1/marches/indices-btp', params);
    return (rows ?? []).map(indiceBtpToUi);
  }
}
