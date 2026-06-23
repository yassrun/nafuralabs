import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

export interface ApiMagasinStockArticle {
  itemId: string;
  code?: string;
  label: string;
  qte: number;
  unitPrice: number;
  valorisation: number;
}

export interface ApiMagasinMouvement {
  id: string;
  txNumber: string;
  txType: string;
  txDate: string;
  status: string;
  totalQuantity: number;
}

export interface ApiMagasinChantier {
  chantierId: string;
  chantierLabel: string;
  depotChantierId: string;
  depotCode?: string;
  depotName?: string;
  stockArticles: ApiMagasinStockArticle[];
  derniersMouvements: ApiMagasinMouvement[];
  totalValorisation: number;
}

@Injectable({ providedIn: 'root' })
export class MagasinChantierApiService extends FeatureApiService<ApiMagasinChantier> {
  protected override basePath = '/api/v1/chantiers';

  async getMagasin(chantierId: string): Promise<ApiMagasinChantier> {
    return this.get<ApiMagasinChantier>(`${this.basePath}/${encodeURIComponent(chantierId)}/magasin`);
  }
}
