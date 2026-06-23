import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  AttestationFournisseur,
  AttestationFournisseurCreate,
  AttestationFournisseurUpdate,
  PartnerAttestationsStatus,
} from '@applications/erp/achats/models';

import {
  type ApiAttestationFournisseur,
  type ApiPartnerAttestationsStatus,
  attestationCreateToApi,
  attestationToUi,
  attestationUpdateToApi,
  partnerAttestationsStatusToUi,
} from './attestations-fournisseur.mapper';

interface AttestationQuery extends ListQuery {
  partnerId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AttestationsFournisseurApiService extends FeatureApiService<
  AttestationFournisseur,
  AttestationFournisseurCreate,
  AttestationFournisseurUpdate
> {
  protected override basePath = '/api/v1/attestations-fournisseur';
  protected override searchFields = ['type', 'partnerId'];

  override async getAll(
    query?: ListQuery,
  ): Promise<ListResponse<AttestationFournisseur>> {
    const q = (query ?? {}) as AttestationQuery;
    let params = this.buildQueryParams({
      ...q,
      page: q.page ?? 0,
      pageSize: q.pageSize ?? 500,
      search: q['search'] as string | undefined,
    });
    if (q.partnerId) params = params.set('partnerId', q.partnerId);
    if (q.status) params = params.set('status', q.status);

    const rows = await this.get<ApiAttestationFournisseur[]>(this.basePath, params);
    const items = (rows ?? []).map(attestationToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<AttestationFournisseur> {
    const row = await this.get<ApiAttestationFournisseur>(`${this.basePath}/${id}`);
    return attestationToUi(row);
  }

  override async create(
    data: AttestationFournisseurCreate,
  ): Promise<AttestationFournisseur> {
    const row = await this.post<ApiAttestationFournisseur>(
      this.basePath,
      attestationCreateToApi(data),
    );
    return attestationToUi(row);
  }

  override async update(
    id: string | number,
    data: AttestationFournisseurUpdate,
  ): Promise<AttestationFournisseur> {
    const row = await this.put<ApiAttestationFournisseur>(
      `${this.basePath}/${id}`,
      attestationUpdateToApi(data),
    );
    return attestationToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async listByPartner(partnerId: string): Promise<AttestationFournisseur[]> {
    const res = await this.getAll({ page: 0, pageSize: 500, partnerId });
    return res.items;
  }

  async getPartnerStatus(partnerId: string): Promise<PartnerAttestationsStatus> {
    const row = await this.get<ApiPartnerAttestationsStatus>(
      `${this.basePath}/partner/${encodeURIComponent(partnerId)}/status`,
    );
    return partnerAttestationsStatusToUi(row);
  }
}
