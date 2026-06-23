import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { TenantContextService } from '@core/tenant/tenant.context';

import type { Role, RoleCreate, RoleUpdate } from '../models';

interface TenantRoleApiResponse {
  id: string;
  roleCode: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  priority: number;
  memberCount?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface PermissionGroupApiResponse {
  name: string;
  moduleId: string;
  permissions?: { code: string; name: string; description?: string; module?: string; category?: string }[];
}

@Injectable({ providedIn: 'root' })
export class RolesApiService extends FeatureApiService<Role, RoleCreate, RoleUpdate> {
  private readonly tenantContext = inject(TenantContextService);

  protected override basePath = '/api/tenants';
  protected override searchFields = ['name', 'description'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Role>> {
    let params = this.buildQueryParams(query);
    const search = (query as Record<string, unknown>)?.['search'];
    if (search !== undefined && search !== null && String(search).trim().length > 0) {
      params = params.set('search', String(search));
    }
    const type = (query as Record<string, unknown>)?.['type'];
    if (type) {
      params = params.set('type', String(type));
    }
    const payload = await this.get<unknown>(this.rolesPath(), params);
    const response = this.normalizeListResponse(payload) as ListResponse<TenantRoleApiResponse>;
    return {
      items: response.items.map((item) => this.toRole(item)),
      total: response.total,
    };
  }

  override async getById(id: string | number): Promise<Role> {
    const payload = await this.get<TenantRoleApiResponse>(`${this.rolesPath()}/${id}`);
    return this.toRole(payload);
  }

  override async create(data: RoleCreate): Promise<Role> {
    const body = {
      roleCode: data.roleCode?.trim() ?? '',
      name: data.name?.trim() ?? '',
      description: data.description?.trim() || null,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
    const payload = await this.post<TenantRoleApiResponse>(this.rolesPath(), body);
    return this.toRole(payload);
  }

  override async update(id: string | number, data: RoleUpdate): Promise<Role> {
    const body = {
      ...(data.name != null && { name: data.name.trim() }),
      ...(data.description != null && { description: data.description.trim() || null }),
      ...(data.permissions != null && { permissions: data.permissions }),
    };
    const payload = await this.patchRequest<TenantRoleApiResponse>(
      `${this.rolesPath()}/${encodeURIComponent(String(id))}`,
      body
    );
    return this.toRole(payload);
  }

  override async patch(id: string | number, data: Partial<RoleUpdate>): Promise<Role> {
    const body = {
      ...(data.name != null && { name: data.name.trim() }),
      ...(data.description != null && { description: data.description?.trim() || null }),
      ...(data.permissions != null && { permissions: data.permissions }),
    };
    const payload = await this.patchRequest<TenantRoleApiResponse>(
      `${this.rolesPath()}/${encodeURIComponent(String(id))}`,
      body
    );
    return this.toRole(payload);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.rolesPath()}/${encodeURIComponent(String(id))}`);
  }

  private rolesPath(): string {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required.');
    }
    return `/api/tenants/${tenantId}/roles`;
  }



  private toRole(item: TenantRoleApiResponse): Role {
    return {
      id: item.id,
      roleCode: item.roleCode ?? item.id,
      name: item.name,
      description: item.description ?? null,
      permissions: item.permissions ?? [],
      isSystem: item.isSystem ?? true,
      priority: Number(item.priority ?? 0),
      memberCount: item.memberCount ?? 0,
      createdAt: item.createdAt ?? null,
      updatedAt: item.updatedAt ?? null,
    };
  }

  /** Get paginated members assigned to a role. */
  async getRoleMembers(
    roleCode: string,
    page = 0,
    size = 20
  ): Promise<{ items: TenantMemberResponse[]; total: number; totalPages: number }> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) throw new Error('Tenant context is required.');
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    const payload = await this.get<PageResponse<TenantMemberApiResponse>>(
      `/api/tenants/${tenantId}/roles/${encodeURIComponent(roleCode)}/members`,
      params
    );
    const items = (payload.content ?? []).map((m) => toTenantMember(m));
    return {
      items,
      total: payload.totalElements ?? 0,
      totalPages: payload.totalPages ?? 0,
    };
  }

  /** Assign members to a role (add role, does not replace). */
  async assignMembersToRole(roleCode: string, memberIds: string[]): Promise<void> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) throw new Error('Tenant context is required.');
    await this.post(
      `/api/tenants/${tenantId}/roles/${encodeURIComponent(roleCode)}/members`,
      { memberIds }
    );
  }

  /** Get permissions catalog grouped by module (for the permission picker UI). */
  async getPermissionsCatalog(): Promise<PermissionGroupApiResponse[]> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) return [];
    const payload = await this.get<PermissionGroupApiResponse[]>(
      `/api/tenants/${tenantId}/permissions/catalog`
    );
    return Array.isArray(payload) ? payload : [];
  }

  /** Remove members from a role. */
  async removeMembersFromRole(roleCode: string, memberIds: string[]): Promise<void> {
    const tenantId = this.tenantContext.tenantId();
    if (!tenantId) throw new Error('Tenant context is required.');
    const url = this.resolveUrl(
      `/api/tenants/${tenantId}/roles/${encodeURIComponent(roleCode)}/members`
    );
    await firstValueFrom(
      this.http.delete<void>(url, { body: { memberIds } })
    );
  }
}

interface PageResponse<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
}

interface TenantMemberApiResponse {
  userId: string;
  email: string;
  displayName: string | null;
  roles: string[];
  status: string;
  joinedAt: string | null;
  lastActivityAt: string | null;
}

interface TenantMemberResponse {
  userId: string;
  email: string;
  displayName: string | null;
  status: string;
  joinedAt: string | null;
  lastActivityAt: string | null;
}

function toTenantMember(item: TenantMemberApiResponse): TenantMemberResponse {
  return {
    userId: item.userId,
    email: item.email,
    displayName: item.displayName ?? null,
    status: item.status,
    joinedAt: item.joinedAt ?? null,
    lastActivityAt: item.lastActivityAt ?? null,
  };
}
