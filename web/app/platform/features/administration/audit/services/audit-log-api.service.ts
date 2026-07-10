import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import {
  AuditApiService,
  AuditEventDto,
  AuditLogQueryParams,
  PageResponse,
} from '../../../collaboration/audit/services/audit-api.service';
import type { AuditLogEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditLogApiService {
  private readonly auditApi = inject(AuditApiService);

  async getLog(query?: ListQuery): Promise<ListResponse<AuditLogEntry>> {
    const params = this.toQueryParams(query);
    const response = await firstValueFrom(this.auditApi.getAuditLog(params));
    return this.toListResponse(response);
  }

  async getEntityTypes(): Promise<string[]> {
    return firstValueFrom(this.auditApi.getEntityTypes());
  }

  private toQueryParams(query?: ListQuery): AuditLogQueryParams {
    if (!query) {
      return { page: 0, size: 20, sort: 'eventAt', direction: 'desc' };
    }
    const page = Math.max(0, Number(query.page ?? 1) - 1);
    const size = Number(query.pageSize ?? 20);
    return {
      page,
      size,
      sort: (query.sortBy as string) || 'eventAt',
      direction: (query.sortDirection as 'asc' | 'desc') || 'desc',
      search: query['search'] as string | undefined,
      entityType: query['entityType'] as string | undefined,
      action: query['action'] as string | undefined,
      actor: query['actor'] as string | undefined,
      from: this.toIsoString(query['from']),
      to: this.toIsoString(query['to']),
    };
  }

  private toIsoString(v: unknown): string | undefined {
    if (v == null) return undefined;
    if (typeof v === 'string') return v || undefined;
    if (v instanceof Date) return v.toISOString();
    return String(v);
  }

  private toListResponse(response: PageResponse<AuditEventDto>): ListResponse<AuditLogEntry> {
    return {
      items: (response.content ?? []).map((dto) => this.toEntry(dto)),
      total: response.totalElements ?? 0,
    };
  }

  private toEntry(dto: AuditEventDto): AuditLogEntry {
    return {
      id: dto.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      actor: dto.actor,
      eventAt: dto.eventAt,
      details: dto.details,
      payload: dto.payload,
    };
  }
}
