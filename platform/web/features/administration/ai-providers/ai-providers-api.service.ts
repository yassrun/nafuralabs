import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface AiProviderCard {
  id: string;
  displayName: string;
  keyConfigured: boolean;
  models: string[];
  active: boolean;
}

export interface AiProvidersState {
  activeProvider: string;
  activeModel: string;
  providers: AiProviderCard[];
}

export interface UpdateAiProviderPayload {
  provider: string;
  model: string;
}

@Injectable({ providedIn: 'root' })
export class AiProvidersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private resolveUrl(path: string): string {
    const base = this.apiConfig.getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  getState(): Promise<AiProvidersState> {
    return firstValueFrom(
      this.http.get<AiProvidersState>(this.resolveUrl('/api/v1/platform/admin/ai-providers'))
    );
  }

  update(payload: UpdateAiProviderPayload): Promise<AiProvidersState> {
    return firstValueFrom(
      this.http.put<AiProvidersState>(
        this.resolveUrl('/api/v1/platform/admin/ai-providers'),
        payload
      )
    );
  }
}
