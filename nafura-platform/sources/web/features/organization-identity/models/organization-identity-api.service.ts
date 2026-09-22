import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';

import {
  EMPTY_ORGANIZATION_IDENTITY,
  type OrganizationIdentity,
} from './organization-identity.model';

@Injectable({ providedIn: 'root' })
export class OrganizationIdentityApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  private url(): string {
    return `${this.apiConfig.getApiBaseUrl()}/api/v1/organization/identity`;
  }

  async get(): Promise<OrganizationIdentity> {
    try {
      return await firstValueFrom(this.http.get<OrganizationIdentity>(this.url()));
    } catch {
      return { ...EMPTY_ORGANIZATION_IDENTITY };
    }
  }

  async save(payload: OrganizationIdentity): Promise<OrganizationIdentity> {
    return firstValueFrom(this.http.put<OrganizationIdentity>(this.url(), payload));
  }
}
