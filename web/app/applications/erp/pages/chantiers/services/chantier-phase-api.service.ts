import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { PhaseChantier, PhaseChantierStatus } from '@applications/erp/chantiers/models';

interface ApiChantierPhase {
  id: string;
  chantierId: string;
  lotId?: string;
  code: string;
  designation: string;
  dateDebut: string;
  dateFin: string;
  dependances?: string[];
  responsableId?: string;
  responsableName?: string;
  equipeName?: string;
  quantite?: number;
  unite?: string;
  avancementPercent: number;
  status: PhaseChantierStatus;
  ordre: number;
}

function phaseToUi(row: ApiChantierPhase): PhaseChantier {
  return {
    id: row.id,
    chantierId: row.chantierId,
    lotId: row.lotId,
    code: row.code,
    designation: row.designation,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    dependances: row.dependances,
    responsableId: row.responsableId,
    responsableName: row.responsableName,
    equipeName: row.equipeName,
    quantite: row.quantite != null ? Number(row.quantite) : undefined,
    unite: row.unite,
    avancementPercent: Number(row.avancementPercent ?? 0),
    status: row.status,
  };
}

@Injectable({ providedIn: 'root' })
export class ChantierPhaseApiService extends FeatureApiService<
  PhaseChantier,
  Partial<PhaseChantier>,
  Partial<PhaseChantier>
> {
  protected override basePath = '/api/v1/chantiers';

  async listByChantier(chantierId: string): Promise<PhaseChantier[]> {
    const rows = await this.get<ApiChantierPhase[]>(`${this.basePath}/${chantierId}/phases`);
    return (rows ?? []).map(phaseToUi);
  }

  async createForChantier(chantierId: string, data: Partial<PhaseChantier>): Promise<PhaseChantier> {
    const row = await this.post<ApiChantierPhase>(`${this.basePath}/${chantierId}/phases`, {
      id: data.id,
      code: data.code,
      designation: data.designation,
      lotId: data.lotId,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      dependances: data.dependances,
      responsableId: data.responsableId,
      responsableName: data.responsableName,
      equipeName: data.equipeName,
      quantite: data.quantite,
      unite: data.unite,
      avancementPercent: data.avancementPercent ?? 0,
      status: data.status,
    });
    return phaseToUi(row);
  }
}
