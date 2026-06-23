import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { LotChantier } from '@applications/erp/chantiers/models';

interface ApiChantierLot {
  id: string;
  chantierId: string;
  code: string;
  parentLotId?: string;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
  avancementPercent: number;
  ordre: number;
}

function lotToUi(row: ApiChantierLot): LotChantier {
  return {
    id: row.id,
    chantierId: row.chantierId,
    code: row.code,
    parentLotId: row.parentLotId,
    designation: row.designation,
    unite: row.unite,
    quantite: row.quantite != null ? Number(row.quantite) : undefined,
    prixUnitaireHt: row.prixUnitaireHt != null ? Number(row.prixUnitaireHt) : undefined,
    montantHt: row.montantHt != null ? Number(row.montantHt) : undefined,
    avancementPercent: Number(row.avancementPercent ?? 0),
    ordre: row.ordre ?? 0,
  };
}

@Injectable({ providedIn: 'root' })
export class ChantierLotApiService extends FeatureApiService<LotChantier, Partial<LotChantier>, Partial<LotChantier>> {
  protected override basePath = '/api/v1/chantiers';

  async listByChantier(chantierId: string): Promise<LotChantier[]> {
    const rows = await this.get<ApiChantierLot[]>(`${this.basePath}/${chantierId}/lots`);
    return (rows ?? []).map(lotToUi);
  }

  async createForChantier(chantierId: string, data: Partial<LotChantier>): Promise<LotChantier> {
    const row = await this.post<ApiChantierLot>(`${this.basePath}/${chantierId}/lots`, {
      id: data.id,
      code: data.code,
      designation: data.designation,
      parentLotId: data.parentLotId,
      unite: data.unite,
      quantite: data.quantite,
      prixUnitaireHt: data.prixUnitaireHt,
      montantHt: data.montantHt,
      avancementPercent: data.avancementPercent ?? 0,
      ordre: data.ordre,
    });
    return lotToUi(row);
  }
}
