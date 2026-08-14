import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DocTypeDefinition, DocTypeListItem, DocTypesByDomain, DomainListItem } from '../models/doc-type-definition.model';
import { ApiConfigService } from '../../../../core/config/api-config.service';

@Injectable({ providedIn: 'root' })
export class DocTypeService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);
  
  private get apiBaseUrl(): string {
    return this.apiConfig.getApiBaseUrl();
  }

  /**
   * Convert tenant ID to UUID format.
   * For mock data like "tenant-acme", maps to a fixed UUID.
   * For actual UUIDs, returns as-is.
   */
  private toTenantUuid(tenantId: string): string {
    // Check if it's already a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tenantId)) {
      return tenantId;
    }

    // Map mock tenant IDs to fixed UUIDs for development
    const mockTenantUuidMap: Record<string, string> = {
      'tenant-acme': '3c5f2c63-5d93-46a2-9ed2-07dbd1047bb0', // Fixed UUID for tenant-acme
    };

    return mockTenantUuidMap[tenantId] || tenantId; // Fallback to original if not mapped
  }

  getActiveDefinition(domainKey: string, docTypeKey: string, tenantId?: string): Observable<DocTypeDefinition> {
    let params = new HttpParams();
    if (tenantId) {
      const tenantUuid = this.toTenantUuid(tenantId);
      params = params.set('tenantId', tenantUuid);
    }
    return this.http.get<DocTypeDefinition>(
      `${this.apiBaseUrl}/api/doc-types/${encodeURIComponent(domainKey)}/${encodeURIComponent(docTypeKey)}/active`,
      { params }
    );
  }

  listActiveByTenant(tenantId: string): Observable<DocTypesByDomain> {
    // Convert tenantId to UUID format for backend
    const tenantUuid = this.toTenantUuid(tenantId);
    const params = new HttpParams().set('tenantId', tenantUuid);
    return this.http.get<DocTypesByDomain>(`${this.apiBaseUrl}/api/doc-types/by-tenant`, { params });
  }

  /**
   * GET /api/doc-types/domains
   * Returns the canonical domain list from the backend.
   */
  listDomains(): Observable<DomainListItem[]> {
    return this.http.get<DomainListItem[]>(`${this.apiBaseUrl}/api/doc-types/domains`);
  }
}


