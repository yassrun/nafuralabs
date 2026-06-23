import { Injectable, inject } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import {
  clientVenteToPartnerCreate,
  clientVenteToPartnerUpdate,
  partnerToClientVente,
} from '@applications/erp/shared/services/partner-commerce.mapper';
import type {
  ClientVente,
  ClientVenteCreate,
  ClientVenteListItem,
  ClientVenteUpdate,
} from '@applications/erp/ventes/models';

interface ClientQuery extends ListQuery {
  type?: string;
  actif?: string;
}

function toListItem(c: ClientVente): ClientVenteListItem {
  return { ...c, nbFactures: 0, caHt: 0 };
}

@Injectable({ providedIn: 'root' })
export class ClientApiService extends FeatureApiService<
  ClientVente,
  ClientVenteCreate,
  ClientVenteUpdate
> {
  protected override basePath = '/api/v1/partners';
  protected override searchFields = ['code', 'raisonSociale', 'ice'];
  protected override defaultQuery = { role: 'CLIENT' };

  private readonly partnersApi = inject(PartnersApiService);

  override async getAll(query?: ListQuery): Promise<ListResponse<ClientVente>> {
    const q = (query ?? {}) as ClientQuery;
    // Listing uses UI field `nom`; partners API expects JPA property names — sort client-side only.
    const { sortBy: _sortBy, sortDirection: _sortDirection, ...apiQuery } = q;
    const res = await this.partnersApi.listByRole('CLIENT', {
      page: 0,
      pageSize: 500,
      ...apiQuery,
    });
    let rows = res.items.map(partnerToClientVente);

    if (q.type) rows = rows.filter((c) => c.type === q.type);
    if (q.actif !== undefined) {
      const actif = q.actif === 'true';
      rows = rows.filter((c) => c.actif === actif);
    }

    rows.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

    return {
      items: rows.map(toListItem) as unknown as ClientVente[],
      total: q.type || q.actif !== undefined ? rows.length : res.total,
    };
  }

  override async getById(id: string | number): Promise<ClientVente> {
    const partner = await this.partnersApi.getById(id);
    return partnerToClientVente(partner);
  }

  override async create(data: ClientVenteCreate): Promise<ClientVente> {
    const partner = await this.partnersApi.create(clientVenteToPartnerCreate(data));
    return partnerToClientVente(partner);
  }

  override async update(id: string | number, data: ClientVenteUpdate): Promise<ClientVente> {
    const partner = await this.partnersApi.update(id, clientVenteToPartnerUpdate(data));
    return partnerToClientVente(partner);
  }

  override async delete(id: string | number): Promise<void> {
    await this.partnersApi.delete(id);
  }
}
