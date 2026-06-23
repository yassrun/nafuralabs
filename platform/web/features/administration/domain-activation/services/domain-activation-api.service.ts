import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { ApiConfigService } from '@core/config/api-config.service';
import { TenantContextService } from '@core/tenant/tenant.context';

import type { DomainActivationStatus } from '../models/domain-activation.model';

/** Backend response shape per spec GET /api/tenants/{tenantId}/domains */
interface TenantDomainApiResponse {
  domainId?: string;
  code?: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  isLocked: boolean;
  activatedAt: string | null;
  entityCount?: number;
  entities?: string[];
}

@Injectable({ providedIn: 'root' })
export class DomainActivationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly tenantContext = inject(TenantContextService);

  getDomains(): Observable<DomainActivationStatus[]> {
    return this.http
      .get<TenantDomainApiResponse[]>(
        `${this.apiConfig.getApiBaseUrl()}${this.domainsPath()}`
      )
      .pipe(map((items) => (items ?? []).map((item) => this.toDomainStatus(item))));
  }

  setDomainEnabled(domainCode: string, enabled: boolean): Observable<DomainActivationStatus> {
    return this.http
      .patch<TenantDomainApiResponse>(
        `${this.apiConfig.getApiBaseUrl()}${this.domainsPath()}/${domainCode}`,
        { enabled }
      )
      .pipe(map((item) => this.toDomainStatus(item)));
  }

  activateDomain(domainId: string): Observable<DomainActivationStatus> {
    return this.setDomainEnabled(domainId, true);
  }

  deactivateDomain(domainId: string): Observable<DomainActivationStatus> {
    return this.setDomainEnabled(domainId, false);
  }

  private domainsPath(): string {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required.');
    }
    return `/api/tenants/${tenantId}/domains`;
  }

  private toDomainStatus(item: TenantDomainApiResponse): DomainActivationStatus {
    const domainId = item.domainId ?? item.code ?? '';
    return {
      domainId,
      name: item.name,
      description: item.description ?? null,
      icon: item.icon ?? null,
      isActive: item.isActive === true,
      isLocked: item.isLocked === true,
      activatedAt: item.activatedAt ?? null,
      entityCount: item.entityCount ?? (item.entities?.length ?? 0),
      entities: item.entities ?? [],
    };
  }
}
