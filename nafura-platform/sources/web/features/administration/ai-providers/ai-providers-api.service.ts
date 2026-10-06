import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

export interface AiProviderCard {
  id: string;
  displayName: string;
  keyConfigured: boolean;
  byok: boolean;
  keyHint: string | null;
  models: string[];
  active: boolean;
}

export interface AiLimits {
  enabled: boolean;
  monthlyBudgetUsd: string | null;
  retainPayloads: boolean;
  byokAvailable: boolean;
}

export interface AiProvidersState {
  activeProvider: string;
  activeModel: string;
  providers: AiProviderCard[];
  limits: AiLimits;
}

export interface UpdateAiProviderPayload {
  provider: string;
  model: string;
}

export interface CredentialResponse {
  configured: boolean;
  keyHint: string | null;
}

export interface TestResponse {
  ok: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface UpdateLimitsPayload {
  enabled: boolean;
  monthlyBudgetUsd: string | null;
  retainPayloads: boolean;
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

  putCredential(provider: string, secret: string): Promise<CredentialResponse> {
    return firstValueFrom(
      this.http.put<CredentialResponse>(
        this.resolveUrl(`/api/v1/platform/admin/ai-providers/credentials/${provider}`),
        { secret }
      )
    );
  }

  revokeCredential(provider: string): Promise<CredentialResponse> {
    return firstValueFrom(
      this.http.delete<CredentialResponse>(
        this.resolveUrl(`/api/v1/platform/admin/ai-providers/credentials/${provider}`)
      )
    );
  }

  test(provider: string, model: string): Promise<TestResponse> {
    return firstValueFrom(
      this.http.post<TestResponse>(
        this.resolveUrl('/api/v1/platform/admin/ai-providers/test'),
        { provider, model }
      )
    );
  }

  updateLimits(payload: UpdateLimitsPayload): Promise<AiLimits> {
    return firstValueFrom(
      this.http.put<AiLimits>(
        this.resolveUrl('/api/v1/platform/admin/ai-providers/limits'),
        payload
      )
    );
  }
}
