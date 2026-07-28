import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import type { CaisseChantier, CompteFinancier, MouvementCaisseChantier } from '../models';
import {
  type ApiCaisse,
  type ApiCaisseMouvement,
  caisseCentraleToCompte,
  caisseChantierToUi,
  mouvementCaisseToUi,
} from './caisse-finance.mapper';

@Injectable({ providedIn: 'root' })
export class CaisseApiService extends FeatureApiService<CompteFinancier, never, never> {
  protected override basePath = '/api/v1/caisses';

  async listChantier(chantierId?: string): Promise<CaisseChantier[]> {
    let params = new HttpParams().set('type', 'CHANTIER');
    if (chantierId) params = params.set('chantierId', chantierId);
    const rows = await this.get<ApiCaisse[]>(this.basePath, params);
    return (rows ?? []).map(caisseChantierToUi);
  }

  async listCentrales(): Promise<CompteFinancier[]> {
    const params = new HttpParams().set('type', 'CENTRALE');
    const rows = await this.get<ApiCaisse[]>(this.basePath, params);
    return (rows ?? []).map(caisseCentraleToCompte);
  }

  async getCentrale(id: string): Promise<CompteFinancier | undefined> {
    const rows = await this.listCentrales();
    return rows.find((c) => c.id === id);
  }

  async getSolde(id: string): Promise<number> {
    const value = await this.get<number>(`${this.basePath}/${id}/solde`);
    return Number(value);
  }

  async listMouvements(caisseId: string): Promise<MouvementCaisseChantier[]> {
    const params = new HttpParams().set('caisseId', caisseId);
    const rows = await this.get<ApiCaisseMouvement[]>('/api/v1/caisse-mouvements', params);
    return (rows ?? []).map(mouvementCaisseToUi);
  }

  async createMouvement(input: Omit<MouvementCaisseChantier, 'id' | 'status'> & { status?: string }): Promise<MouvementCaisseChantier> {
    const row = await this.post<ApiCaisseMouvement>('/api/v1/caisse-mouvements', {
      caisseId: input.caisseId,
      date: input.date,
      type: input.type,
      montant: input.montant,
      categorie: input.categorie,
      description: input.description,
      photoTicketUrl: input.photoTicketUrl,
      geolocLat: input.geoloc?.lat,
      geolocLng: input.geoloc?.lng,
      status: input.status ?? 'BROUILLON',
    });
    return mouvementCaisseToUi(row);
  }

  async validerMouvement(id: string): Promise<MouvementCaisseChantier> {
    const row = await this.post<ApiCaisseMouvement>(`/api/v1/caisse-mouvements/${id}/valider`, {});
    return mouvementCaisseToUi(row);
  }
}
