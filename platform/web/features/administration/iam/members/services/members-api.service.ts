import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { TenantContextService } from '@core/tenant/tenant.context';

import type { Member, MemberInvite, MemberUpdate } from '../models';

interface TenantMemberRoleApiResponse {
  id: string;
  name: string;
  isSystem?: boolean;
}

interface TenantMemberApiResponse {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  roles: TenantMemberRoleApiResponse[];
  status: string;
  joinedAt: string | null;
  lastActivityAt: string | null;
}

interface MemberListApiResponse {
  items: TenantMemberApiResponse[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class MembersApiService extends FeatureApiService<
  Member,
  MemberInvite,
  MemberUpdate
> {
  private readonly tenantContext = inject(TenantContextService);

  protected override basePath = '/api/tenants';
  protected override searchFields = ['email', 'firstName', 'lastName'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Member>> {
    const params = this.buildTenantQueryParams(query);
    const payload = await this.get<MemberListApiResponse>(this.membersPath(), params);
    return {
      items: (payload.items ?? []).map((item) => this.toMember(item)),
      total: Number(payload.total ?? 0),
    };
  }

  override async getById(id: string | number): Promise<Member> {
    const payload = await this.get<TenantMemberApiResponse>(`${this.membersPath()}/${id}`);
    return this.toMember(payload);
  }

  override async create(data: MemberInvite): Promise<Member> {
    const payload = await this.post<TenantMemberApiResponse>(
      `${this.membersPath()}/invite`,
      {
        email: data.email,
        roles: data.roleIds ?? [],
        message: data.message,
      }
    );
    return this.toMember(payload);
  }

  override async update(id: string | number, data: MemberUpdate): Promise<Member> {
    const memberId = String(id);

    if (Array.isArray(data.roles) && data.roles.length > 0) {
      await this.patchRequest(`${this.membersPath()}/${memberId}/roles`, {
        roles: data.roles,
      });
    }

    const status = this.toApiStatus(data.status);
    if (status) {
      await this.patchRequest(`${this.membersPath()}/${memberId}/status`, { status });
    }

    return this.getById(memberId);
  }

  async resendInvitation(id: string | number): Promise<void> {
    await this.post(`${this.membersPath()}/${encodeURIComponent(String(id))}/resend-invitation`, {});
  }

  override async patch(id: string | number, data: Partial<MemberUpdate>): Promise<Member> {
    return this.update(id, data as MemberUpdate);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.membersPath()}/${id}`);
  }

  private membersPath(): string {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required.');
    }
    return `/api/tenants/${tenantId}/members`;
  }

  private buildTenantQueryParams(query?: ListQuery): HttpParams {
    let params = new HttpParams();
    if (!query) return params;

    if (query.page !== undefined) {
      params = params.set('page', String(Math.max(Number(query.page) - 1, 0)));
    }
    if (query.pageSize !== undefined) {
      params = params.set('pageSize', String(query.pageSize));
    }
    if (query.sortBy) {
      params = params.set('sort', query.sortBy);
    }
    if (query.sortDirection) {
      params = params.set('direction', query.sortDirection);
    }

    for (const [key, rawValue] of Object.entries(query)) {
      if (
        rawValue === undefined ||
        rawValue === null ||
        (typeof rawValue === 'string' && rawValue.trim().length === 0) ||
        key === 'page' ||
        key === 'pageSize' ||
        key === 'sortBy' ||
        key === 'sortDirection'
      ) {
        continue;
      }
      if (key === 'status') {
        params = params.set('status', this.toApiStatus(String(rawValue)) ?? String(rawValue));
      } else {
        params = params.set(key, String(rawValue));
      }
    }

    return params;
  }

  private toMember(item: TenantMemberApiResponse): Member {
    const firstName = item.firstName ?? '';
    const lastName = item.lastName ?? '';
    const displayName = item.displayName ?? (`${firstName} ${lastName}`.trim() || item.email);
    const status = this.fromApiStatus(item.status);

    return {
      id: item.userId,
      email: item.email,
      firstName,
      lastName,
      displayName,
      status,
      roles: item.roles ?? [],
      roleIds: (item.roles ?? []).map((role) => role.id),
      invitedAt: status === 'invited' ? item.joinedAt : null,
      joinedAt: item.joinedAt,
      lastActivityAt: item.lastActivityAt,
      createdAt: item.joinedAt ?? item.lastActivityAt ?? new Date().toISOString(),
      updatedAt: item.lastActivityAt ?? item.joinedAt ?? new Date().toISOString(),
    };
  }

  private fromApiStatus(status: string): Member['status'] {
    switch ((status || '').toLowerCase()) {
      case 'invited':
        return 'invited';
      case 'suspended':
        return 'suspended';
      case 'active':
      default:
        return 'active';
    }
  }

  private toApiStatus(status: string | undefined): 'active' | 'suspended' | 'invited' | null {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case 'suspended':
        return 'suspended';
      case 'invited':
        return 'invited';
      case 'active':
        return 'active';
      default:
        return null;
    }
  }
}
