import { Injectable, inject } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import { partnerToFournisseur } from '@applications/erp/shared/services/partner-commerce.mapper';
import type {
  Fournisseur,
  FournisseurCreate,
  FournisseurListItem,
  FournisseurUpdate,
} from '@applications/erp/achats/models';

interface FournisseurQuery extends ListQuery {
  categorie?: string;
  ville?: string;
  notation?: number;
  isActive?: boolean;
}

function toListItem(f: Fournisseur): FournisseurListItem {
  return { ...f, nbBcAnnuels: undefined, montantBcAnnuel: undefined };
}

function newFournisseurCode(): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `FRN-${suffix}`;
}

@Injectable({ providedIn: 'root' })
export class FournisseurApiService extends FeatureApiService<
  Fournisseur,
  FournisseurCreate,
  FournisseurUpdate
> {
  protected override basePath = '/api/v1/partners';
  protected override searchFields = ['raisonSociale', 'code', 'ice'];

  private readonly partnersApi = inject(PartnersApiService);

  override async getAll(query?: ListQuery): Promise<ListResponse<Fournisseur>> {
    const res = await this.partnersApi.listByRole('FOURNISSEUR', {
      page: 0,
      pageSize: 500,
      ...query,
    });
    const q = (query ?? {}) as FournisseurQuery;
    let rows = res.items.map(partnerToFournisseur);

    if (q['search']) {
      const term = String(q['search']).toLowerCase();
      rows = rows.filter(
        (f) =>
          f.raisonSociale.toLowerCase().includes(term) ||
          f.code.toLowerCase().includes(term) ||
          (f.ice ?? '').includes(term) ||
          (f.ville ?? '').toLowerCase().includes(term),
      );
    }
    if (q.categorie) rows = rows.filter((f) => f.categories.includes(q.categorie!));
    if (q.ville) rows = rows.filter((f) => f.ville === q.ville);
    if (q.notation !== undefined) rows = rows.filter((f) => f.notation === q.notation);
    if (q.isActive !== undefined) rows = rows.filter((f) => f.isActive === q.isActive);

    rows.sort((a, b) => a.raisonSociale.localeCompare(b.raisonSociale, 'fr'));

    return { items: rows.map(toListItem) as unknown as Fournisseur[], total: rows.length };
  }

  override async getById(id: string | number): Promise<Fournisseur> {
    const partner = await this.partnersApi.getById(id);
    return partnerToFournisseur(partner);
  }

  override async create(data: FournisseurCreate): Promise<Fournisseur> {
    const partner = await this.partnersApi.create({
      code: newFournisseurCode(),
      raisonSociale: data.raisonSociale,
      ice: data.ice,
      email: data.contactPrincipalEmail,
      phone: data.contactPrincipalTel,
      isActive: data.isActive,
    });
    return partnerToFournisseur(partner);
  }

  override async update(id: string | number, data: FournisseurUpdate): Promise<Fournisseur> {
    const partner = await this.partnersApi.update(id, {
      raisonSociale: data.raisonSociale,
      ice: data.ice,
      email: data.contactPrincipalEmail,
      phone: data.contactPrincipalTel,
      isActive: data.isActive,
    });
    return partnerToFournisseur(partner);
  }

  override async delete(id: string | number): Promise<void> {
    await this.partnersApi.delete(id);
  }
}
