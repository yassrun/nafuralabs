import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  CatalogueFournisseurLigne,
  CatalogueFournisseurLigneCreate,
  CatalogueFournisseurLigneUpdate,
} from '@app/achats/models';

import {
  type ApiCatalogueFournisseurLigne,
  catalogueCreateToApi,
  catalogueToUi,
  catalogueUpdateToApi,
} from './catalogue-fournisseur.mapper';

interface CatalogueQuery extends ListQuery {
  fournisseurId?: string;
  articleId?: string;
  actif?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogueFournisseurApiService extends FeatureApiService<
  CatalogueFournisseurLigne,
  CatalogueFournisseurLigneCreate,
  CatalogueFournisseurLigneUpdate
> {
  protected override basePath = '/api/v1/catalogue-fournisseur';
  protected override searchFields = ['designation', 'refFournisseur', 'articleId'];

  override async getAll(
    query?: ListQuery,
  ): Promise<ListResponse<CatalogueFournisseurLigne>> {
    const q = (query ?? {}) as CatalogueQuery;
    let params = this.buildQueryParams({
      ...q,
      page: q.page ?? 0,
      pageSize: q.pageSize ?? 500,
      search: q['search'] as string | undefined,
    });
    if (q.fournisseurId) params = params.set('fournisseurId', q.fournisseurId);
    if (q.articleId) params = params.set('articleId', q.articleId);
    if (q.actif !== undefined) params = params.set('actif', String(q.actif));

    const rows = await this.get<ApiCatalogueFournisseurLigne[]>(this.basePath, params);
    const items = (rows ?? []).map(catalogueToUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<CatalogueFournisseurLigne> {
    const row = await this.get<ApiCatalogueFournisseurLigne>(`${this.basePath}/${id}`);
    return catalogueToUi(row);
  }

  override async create(
    data: CatalogueFournisseurLigneCreate,
  ): Promise<CatalogueFournisseurLigne> {
    const row = await this.post<ApiCatalogueFournisseurLigne>(
      this.basePath,
      catalogueCreateToApi(data),
    );
    return catalogueToUi(row);
  }

  override async update(
    id: string | number,
    data: CatalogueFournisseurLigneUpdate,
  ): Promise<CatalogueFournisseurLigne> {
    const row = await this.put<ApiCatalogueFournisseurLigne>(
      `${this.basePath}/${id}`,
      catalogueUpdateToApi(data),
    );
    return catalogueToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  /** Lignes catalogue actives pour un fournisseur (fiche 360 / listing futur). */
  async listByFournisseur(
    fournisseurId: string,
    query?: Omit<CatalogueQuery, 'fournisseurId'>,
  ): Promise<CatalogueFournisseurLigne[]> {
    const res = await this.getAll({
      page: 0,
      pageSize: 500,
      ...query,
      fournisseurId,
      actif: query?.['actif'] ?? true,
    });
    return res.items;
  }

  /** Prix négocié pour pré-remplissage BC (article + fournisseur). */
  async findActivePrice(
    fournisseurId: string,
    articleId: string,
  ): Promise<CatalogueFournisseurLigne | undefined> {
    const res = await this.getAll({ page: 0, pageSize: 500, fournisseurId, articleId, actif: true });
    return res.items[0];
  }

  /** L11 — comparateur fournisseurs pour un article. */
  async comparer(articleId: string, date?: string | null): Promise<ComparateurOffre[]> {
    let params = this.buildQueryParams({});
    params = params.set('articleId', articleId);
    if (date) params = params.set('date', date);
    return this.get<ComparateurOffre[]>(`${this.basePath}/comparateur`, params);
  }
}

export interface ComparateurOffre {
  ligneId: string;
  fournisseurId: string;
  articleId: string;
  designation: string;
  refFournisseur?: string | null;
  prixCommercialHt: number | string;
  prixUnitaireHt: number | string;
  conditionnementQuantite?: number | string | null;
  conditionnementUomCode?: string | null;
  conditionnementLibelle?: string | null;
  prixNormalise?: number | string | null;
  uomNormaliseCode?: string | null;
  delaiJours?: number | null;
  quantiteMin?: number | string | null;
  validFrom?: string;
  validTo?: string | null;
  perime: boolean;
  source?: string;
}
