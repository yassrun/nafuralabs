import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Employe,
  EmployeCreate,
  EmployeListItem,
  EmployeUpdate,
} from '@applications/erp/rh/models';

interface EmployeQuery extends ListQuery {
  statut?: string;
  typeContrat?: string;
  categorie?: string;
}

const TODAY = new Date('2026-05-08');

function toListItem(e: Employe): EmployeListItem {
  const embauche = new Date(e.dateEmbauche);
  const anciennete = Math.floor((TODAY.getTime() - embauche.getTime()) / (365.25 * 86400000));
  return { ...e, anciennete };
}

@Injectable({ providedIn: 'root' })
export class EmployeApiService extends FeatureApiService<Employe, EmployeCreate, EmployeUpdate> {
  protected override basePath = '/api/v1/rh/employes';
  protected override searchFields = ['matricule', 'nom', 'prenom', 'poste'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Employe>> {
    const q = (query ?? {}) as EmployeQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.statut) params = params.set('statut', q.statut);
    if (q.typeContrat) params = params.set('typeContrat', q.typeContrat);
    if (q.categorie) params = params.set('categorie', q.categorie);

    const rows = await this.get<Employe[]>(this.basePath, params);
    const items = (rows ?? []).map(toListItem) as unknown as Employe[];
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<Employe> {
    return this.get<Employe>(`${this.basePath}/${id}`);
  }

  override async create(data: EmployeCreate): Promise<Employe> {
    return this.post<Employe>(this.basePath, data);
  }

  override async update(id: string | number, data: EmployeUpdate): Promise<Employe> {
    return this.put<Employe>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }
}
