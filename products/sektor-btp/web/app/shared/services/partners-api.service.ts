import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';

export type PartnerRoleType = 'CLIENT' | 'FOURNISSEUR' | 'MOA' | 'SOUS_TRAITANT';

export interface Partner {
  id: string;
  code: string;
  raisonSociale: string;
  formeJuridique?: string;
  ice?: string;
  identifiantFiscal?: string;
  registreCommerce?: string;
  patente?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface PartnerCreate {
  code: string;
  raisonSociale: string;
  formeJuridique?: string;
  ice?: string;
  identifiantFiscal?: string;
  registreCommerce?: string;
  patente?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  roles?: PartnerRoleType[];
}

export type PartnerUpdate = Partial<Omit<PartnerCreate, 'roles'>>;

@Injectable({ providedIn: 'root' })
export class PartnersApiService extends FeatureApiService<Partner, PartnerCreate, PartnerUpdate> {
  protected override basePath = '/api/v1/partners';
  protected override searchFields = ['code', 'raisonSociale'];

  async listByRole(role: PartnerRoleType, query?: ListQuery): Promise<ListResponse<Partner>> {
    const params = { ...(query ?? { page: 0, pageSize: 200 }), role } as ListQuery;
    return this.getAll(params);
  }
}
