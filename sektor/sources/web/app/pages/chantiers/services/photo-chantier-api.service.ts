import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';

export interface PhotoChantierApiRow {
  id: string;
  chantierId: string;
  chantierCode?: string;
  filename: string;
  contentType: string;
  storagePath: string;
  lat?: number;
  lng?: number;
  zone?: string;
  takenAt: string;
  exifJson?: string;
  uploadedBy: string;
  createdAt?: string;
  contentUrl?: string;
}

export interface PhotoChantierUrlResponse {
  id: string;
  url: string;
  storagePath: string;
}

@Injectable({ providedIn: 'root' })
export class PhotoChantierApiService extends FeatureApiService<PhotoChantierApiRow, never, never> {
  private readonly httpClient = inject(HttpClient);

  protected override basePath = '/api/v1/chantiers';

  async listByChantier(
    chantierId: string,
    query?: { zone?: string; date?: string },
  ): Promise<PhotoChantierApiRow[]> {
    const params = new URLSearchParams();
    if (query?.zone) {
      params.set('zone', query.zone);
    }
    if (query?.date) {
      params.set('date', query.date);
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const rows = await this.get<PhotoChantierApiRow[]>(`${this.basePath}/${chantierId}/photos${suffix}`);
    return rows ?? [];
  }

  async getContentUrl(photoId: string): Promise<PhotoChantierUrlResponse> {
    return this.get<PhotoChantierUrlResponse>(`/api/v1/photos/${photoId}/url`);
  }

  async deletePhoto(photoId: string): Promise<void> {
    await this.delete(`/api/v1/photos/${photoId}`);
  }

  async uploadPhoto(
    chantierId: string,
    file: File,
    meta?: { zone?: string; lat?: number; lng?: number; uploadedBy?: string; takenAt?: string },
  ): Promise<PhotoChantierApiRow> {
    const form = new FormData();
    form.append('file', file);
    if (meta?.zone) form.append('zone', meta.zone);
    if (meta?.lat != null) form.append('lat', String(meta.lat));
    if (meta?.lng != null) form.append('lng', String(meta.lng));
    if (meta?.uploadedBy) form.append('uploadedBy', meta.uploadedBy);
    if (meta?.takenAt) form.append('takenAt', meta.takenAt);
    const base = this.apiConfig.getApiBaseUrl();
    const url = `${base}${this.basePath}/${chantierId}/photos`;
    return firstValueFrom(this.httpClient.post<PhotoChantierApiRow>(url, form));
  }
}
