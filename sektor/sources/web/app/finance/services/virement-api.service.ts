import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { FeatureApiService } from '@lib/anatomy';

import type {
  BanqueVirementXmlFormat,
  VirementFournisseurRemiseLine,
  VirementInterne,
} from '../models';
import {
  type ApiVirement,
  remiseLineToUi,
  virementInterneToUi,
} from './virement-finance.mapper';

@Injectable({ providedIn: 'root' })
export class VirementApiService extends FeatureApiService<VirementInterne, never, never> {
  protected override basePath = '/api/v1/virements';

  async listInternes(status?: string): Promise<VirementInterne[]> {
    let params = new HttpParams().set('type', 'INTERNE');
    if (status) params = params.set('status', status);
    const rows = await this.get<ApiVirement[]>(this.basePath, params);
    return (rows ?? []).map(virementInterneToUi);
  }

  async getInterne(id: string): Promise<VirementInterne> {
    const row = await this.get<ApiVirement>(`${this.basePath}/${id}`);
    return virementInterneToUi(row);
  }

  async createInterne(
    payload: Omit<VirementInterne, 'id' | 'numero' | 'ecritureId'>,
  ): Promise<VirementInterne> {
    const row = await this.post<ApiVirement>(`${this.basePath}/internes`, {
      date: payload.date,
      compteSourceId: payload.compteSourceId,
      compteSourceLibelle: payload.compteSourceLibelle,
      compteDestId: payload.compteDestId,
      compteDestLibelle: payload.compteDestLibelle,
      montant: payload.montant,
      motif: payload.motif,
      reference: payload.reference,
      status: payload.status,
      notes: payload.notes,
    });
    return virementInterneToUi(row);
  }

  async validerInterne(id: string): Promise<VirementInterne> {
    const row = await this.post<ApiVirement>(`${this.basePath}/${id}/valider`, {});
    return virementInterneToUi(row);
  }

  async annulerInterne(id: string): Promise<VirementInterne> {
    const row = await this.post<ApiVirement>(`${this.basePath}/${id}/annuler`, {});
    return virementInterneToUi(row);
  }

  async deleteInterne(id: string): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async createRemise(
    bankCode: BanqueVirementXmlFormat,
    executionDate: string,
    lines: VirementFournisseurRemiseLine[],
  ): Promise<{ id: string; generatedXml?: string }> {
    const row = await this.post<ApiVirement>(this.basePath, {
      bankCode,
      executionDate,
      lines: lines.map((l) => ({
        beneficiaire: l.beneficiaire,
        rib: l.rib,
        montant: l.montant,
        motif: l.motif,
        referencePiece: l.referencePiece,
      })),
    });
    return { id: row.id, generatedXml: row.generatedXml };
  }

  async generateXml(id: string, banque: BanqueVirementXmlFormat): Promise<string> {
    const row = await this.post<ApiVirement>(
      `${this.basePath}/${id}/generate-xml?banque=${encodeURIComponent(banque)}`,
      {},
    );
    return row.generatedXml ?? '';
  }

  async marquerEnvoye(id: string): Promise<void> {
    await this.post(`${this.basePath}/${id}/marquer-envoye`, {});
  }
}
