import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type {
  ComposantDPU,
  DpuHistoriqueEntry,
  PrixDPU,
} from '@applications/erp/etudes/models';

@Injectable({ providedIn: 'root' })
export class DpuApiService extends FeatureApiService<PrixDPU> {
  protected override basePath = '/api/v1/etudes/dpu';

  async listByOuvrage(ouvrageId: string): Promise<PrixDPU[]> {
    const params = new HttpParams().set('ouvrageId', ouvrageId);
    return this.get<PrixDPU[]>(this.basePath, params);
  }

  async getComposants(id: string): Promise<ComposantDPU[]> {
    return this.get<ComposantDPU[]>(`${this.basePath}/${id}/composants`);
  }

  async addComposant(id: string, body: Omit<ComposantDPU, 'id' | 'total'>): Promise<ComposantDPU> {
    return firstValueFrom(
      this.http.post<ComposantDPU>(this.resolveUrl(`${this.basePath}/${id}/composants`), body),
    );
  }

  async recompute(id: string): Promise<PrixDPU> {
    return firstValueFrom(
      this.http.post<PrixDPU>(this.resolveUrl(`${this.basePath}/${id}/recompute`), {}),
    );
  }

  async createVersion(id: string): Promise<DpuHistoriqueEntry> {
    return firstValueFrom(
      this.http.post<DpuHistoriqueEntry>(this.resolveUrl(`${this.basePath}/${id}/versions`), {}),
    );
  }

  async createForOuvrage(ouvrageId: string): Promise<PrixDPU> {
    return firstValueFrom(
      this.http.post<PrixDPU>(this.resolveUrl(this.basePath), { ouvrageId }),
    );
  }
}
