import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  BonCommande,
  BonCommandeCreate,
  BonCommandeListItem,
  BonCommandeUpdate,
} from '@applications/erp/achats/models';
import type { InventoryTx } from '@applications/erp/inventory/models';

import {
  type ApiBonCommandeAchat,
  bcCreateToApi,
  bcToListItem,
  bcToUi,
  bcUpdateToApi,
} from './bon-commande-achat.mapper';

interface BCQuery extends ListQuery {
  status?: string;
  fournisseurId?: string;
  chantierId?: string;
  rubrique?: string;
  quick?: 'A_VALIDER' | 'EN_COURS_LIVRAISON' | 'EN_RETARD' | 'A_FACTURER';
}

const TODAY = new Date('2026-05-08');

@Injectable({ providedIn: 'root' })
export class BcApiService extends FeatureApiService<
  BonCommande, BonCommandeCreate, BonCommandeUpdate
> {
  protected override basePath = '/api/v1/bons-commande-achat';
  protected override searchFields = ['numero', 'fournisseurName', 'chantierName'];

  override async getAll(query?: ListQuery): Promise<ListResponse<BonCommande>> {
    const q = (query ?? {}) as BCQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.fournisseurId) params = params.set('fournisseurId', q.fournisseurId);
    if (q.chantierId) params = params.set('chantierId', q.chantierId);
    if (q.rubrique) params = params.set('rubrique', q.rubrique);

    const rows = await this.get<ApiBonCommandeAchat[]>(this.basePath, params);
    let items = (rows ?? []).map(bcToListItem) as unknown as BonCommande[];

    if (q.quick) {
      switch (q.quick) {
        case 'A_VALIDER':
          items = items.filter((b) => b.status === 'BROUILLON');
          break;
        case 'EN_COURS_LIVRAISON':
          items = items.filter((b) =>
            ['ENVOYE', 'ACCUSE_RECEPTION', 'PARTIELLEMENT_LIVRE'].includes(b.status),
          );
          break;
        case 'EN_RETARD':
          items = items.filter((b) => {
            return (
              b.dateLivraisonPrevue < TODAY.toISOString().slice(0, 10) &&
              !['LIVRE', 'FACTURE', 'CLOTURE', 'ANNULE'].includes(b.status)
            );
          });
          break;
        case 'A_FACTURER':
          items = items.filter((b) => b.status === 'LIVRE' && b.totalFactureHt < b.totalHt);
          break;
      }
    }

    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<BonCommande> {
    const row = await this.get<ApiBonCommandeAchat>(`${this.basePath}/${id}`);
    return bcToUi(row);
  }

  override async create(data: BonCommandeCreate): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(this.basePath, bcCreateToApi(data));
    return bcToUi(row);
  }

  override async update(id: string | number, data: BonCommandeUpdate): Promise<BonCommande> {
    const row = await this.put<ApiBonCommandeAchat>(
      `${this.basePath}/${id}`,
      bcUpdateToApi(data),
    );
    return bcToUi(row);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async submit(id: string): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(`${this.basePath}/${id}/submit`, {});
    return bcToUi(row);
  }

  async approve(id: string, validateurName?: string): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(`${this.basePath}/${id}/approve`, {
      validateurName,
    });
    return bcToUi(row);
  }

  async send(id: string): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(`${this.basePath}/${id}/send`, {});
    return bcToUi(row);
  }

  async cancel(id: string): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(`${this.basePath}/${id}/cancel`, {});
    return bcToUi(row);
  }

  async acknowledgeReception(id: string): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(
      `${this.basePath}/${id}/acknowledge-reception`,
      {},
    );
    return bcToUi(row);
  }

  async close(id: string): Promise<BonCommande> {
    const row = await this.post<ApiBonCommandeAchat>(`${this.basePath}/${id}/close`, {});
    return bcToUi(row);
  }

  async listReceptions(bcId: string): Promise<ApiReceptionAchat[]> {
    return this.get<ApiReceptionAchat[]>(`${this.basePath}/${bcId}/receptions`);
  }

  async createReception(
    bcId: string,
    body: ReceptionAchatCreatePayload,
  ): Promise<ApiReceptionAchat> {
    return this.post<ApiReceptionAchat>(`${this.basePath}/${bcId}/receptions`, body);
  }
}

export interface ReceptionAchatLignePayload {
  bonCommandeLigneId: string;
  articleId: string;
  quantiteRecue: number;
}

export interface ReceptionAchatCreatePayload {
  destLocationId: string;
  dateReception?: string;
  blNumero?: string;
  notes?: string;
  lignes: ReceptionAchatLignePayload[];
}

export interface ApiReceptionAchat {
  id: string;
  bonCommandeAchatId: string;
  numero: string;
  dateReception: string;
  blNumero?: string;
  status: string;
  notes?: string;
  lignes?: Array<{
    id: string;
    bonCommandeLigneId: string;
    articleId: string;
    quantiteRecue: number;
  }>;
}

/** Map achat réception → InventoryTx for client-side 3-way matching. */
export function receptionAchatToInventoryTx(rec: ApiReceptionAchat, bcNumero?: string): InventoryTx {
  return {
    id: rec.id,
    txNumber: rec.numero,
    txType: 'RECEPTION',
    txDate: rec.dateReception,
    reference: rec.blNumero,
    status: rec.status,
    notes: rec.notes,
    bcId: rec.bonCommandeAchatId,
    bcNumero,
    lines: (rec.lignes ?? []).map((l, idx) => ({
      id: l.id,
      txId: rec.id,
      lineNumber: idx + 1,
      articleId: l.articleId,
      quantity: l.quantiteRecue,
      uomId: '',
      bcLigneId: l.bonCommandeLigneId,
    })),
  };
}
