import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { PosteBudgetaire } from '@app/chantiers/models';

interface ApiPosteBudgetaire {
  id: string;
  lotId: string;
  code: string;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  ordre: number;
}

function posteToUi(row: ApiPosteBudgetaire): PosteBudgetaire {
  return {
    id: row.id,
    lotId: row.lotId,
    code: row.code,
    designation: row.designation,
    unite: row.unite,
    quantite: row.quantite != null ? Number(row.quantite) : undefined,
    prixUnitaireHt: row.prixUnitaireHt != null ? Number(row.prixUnitaireHt) : undefined,
    montantHt: row.montantHt != null ? Number(row.montantHt) : undefined,
    ordre: row.ordre ?? 0,
  };
}

@Injectable({ providedIn: 'root' })
export class PosteBudgetaireApiService extends FeatureApiService<
  PosteBudgetaire,
  Partial<PosteBudgetaire>,
  Partial<PosteBudgetaire>
> {
  protected override basePath = '/api/v1/lots';

  async listByLot(lotId: string): Promise<PosteBudgetaire[]> {
    const rows = await this.get<ApiPosteBudgetaire[]>(`${this.basePath}/${lotId}/postes-budgetaires`);
    return (rows ?? []).map(posteToUi);
  }

  async createForLot(lotId: string, data: Partial<PosteBudgetaire>): Promise<PosteBudgetaire> {
    const row = await this.post<ApiPosteBudgetaire>(`${this.basePath}/${lotId}/postes-budgetaires`, {
      id: data.id,
      code: data.code,
      designation: data.designation,
      unite: data.unite,
      quantite: data.quantite,
      prixUnitaireHt: data.prixUnitaireHt,
      montantHt: data.montantHt,
      ordre: data.ordre,
    });
    return posteToUi(row);
  }

  async updatePoste(posteId: string, data: Partial<PosteBudgetaire>): Promise<PosteBudgetaire> {
    const row = await this.put<ApiPosteBudgetaire>(`/api/v1/postes-budgetaires/${posteId}`, {
      code: data.code,
      designation: data.designation,
      unite: data.unite,
      quantite: data.quantite,
      prixUnitaireHt: data.prixUnitaireHt,
      montantHt: data.montantHt,
      ordre: data.ordre,
    });
    return posteToUi(row);
  }

  async deletePoste(posteId: string): Promise<void> {
    await this.deleteRequest(`/api/v1/postes-budgetaires/${posteId}`);
  }
}
