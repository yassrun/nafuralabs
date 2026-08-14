import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';

import type { Attachement, AttachementLigne, AttachementStatus, MeteoCode } from './attachement.models';

interface ApiAttachementLigne {
  posteCode: string;
  designation: string;
  quantiteExecutee: number;
  unite: string;
  zone?: string;
}

interface ApiAttachement {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode?: string;
  date: string;
  meteoCode?: MeteoCode;
  temperatureC?: number;
  effectifPresent: number;
  lignes: ApiAttachementLigne[];
  status: AttachementStatus;
  signatureMoeDataUrl?: string;
}

export interface AttachementCreateInput {
  date: string;
  meteoCode?: MeteoCode;
  temperatureC?: number;
  effectifPresent: number;
  lignes: AttachementLigne[];
  signatureMoeDataUrl?: string;
}

function apiToUi(row: ApiAttachement): Attachement {
  return {
    id: row.id,
    numero: row.numero,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode ?? row.chantierId,
    date: row.date,
    meteoCode: row.meteoCode,
    temperatureC: row.temperatureC,
    effectifPresent: Number(row.effectifPresent ?? 0),
    lignes: (row.lignes ?? []).map((l) => ({
      posteCode: l.posteCode,
      designation: l.designation,
      quantiteExecutee: Number(l.quantiteExecutee ?? 0),
      unite: l.unite,
      zone: l.zone,
    })),
    status: row.status,
    signatureMoeDataUrl: row.signatureMoeDataUrl,
  };
}

@Injectable({ providedIn: 'root' })
export class AttachementApiService extends FeatureApiService<Attachement, AttachementCreateInput, never> {
  protected override basePath = '/api/v1/chantiers';

  async listAll(): Promise<Attachement[]> {
    const rows = await this.get<ApiAttachement[]>(`${this.basePath}/attachements`);
    return (rows ?? []).map(apiToUi);
  }

  async listByChantier(chantierId: string): Promise<Attachement[]> {
    const rows = await this.get<ApiAttachement[]>(`${this.basePath}/${chantierId}/attachements`);
    return (rows ?? []).map(apiToUi);
  }

  async createForChantier(chantierId: string, body: AttachementCreateInput): Promise<Attachement> {
    const row = await this.post<ApiAttachement>(`${this.basePath}/${chantierId}/attachements`, body);
    return apiToUi(row);
  }

  async soumettreSignature(id: string): Promise<Attachement> {
    const row = await this.post<ApiAttachement>(`/api/v1/attachements/${id}/soumettre-signature`, {});
    return apiToUi(row);
  }
}
