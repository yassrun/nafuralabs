import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type {
  Encaissement,
  FactureClient,
  FactureClientListItem,
  FactureCreate,
  FactureUpdate,
} from '@applications/erp/ventes/models';

interface FactureQuery extends ListQuery {
  status?: string;
  clientId?: string;
  chantierId?: string;
  type?: string;
  modePaiement?: string;
  dateFrom?: string;
  dateTo?: string;
  montantMin?: number;
  montantMax?: number;
}

const REFERENCE_DATE = new Date('2026-05-08');
const ONE_DAY = 1000 * 60 * 60 * 24;

function delaiRetard(f: FactureClient): number {
  if (f.status === 'PAYEE' || f.status === 'AVOIRISEE' || f.status === 'ANNULEE') {
    return 0;
  }
  if (!f.dateEcheance) return 0;
  const target = new Date(f.dateEcheance);
  if (Number.isNaN(target.getTime())) return 0;
  const diff = REFERENCE_DATE.getTime() - target.getTime();
  return Math.max(0, Math.round(diff / ONE_DAY));
}

function toListItem(f: FactureClient): FactureClientListItem {
  return {
    id: f.id,
    numero: f.numero,
    type: f.type,
    clientId: f.clientId,
    clientName: f.clientName,
    bcClientId: f.bcClientId,
    chantierId: f.chantierId,
    chantierCode: f.chantierCode,
    situationId: f.situationId,
    dateEmission: f.dateEmission,
    dateEcheance: f.dateEcheance,
    modePaiement: f.modePaiement,
    totalHt: f.totalHt,
    retenueGarantieMontant: f.retenueGarantieMontant,
    resorptionAvanceMontant: f.resorptionAvanceMontant,
    netAPayerHt: f.netAPayerHt,
    tvaTaux: f.tvaTaux,
    totalTva: f.totalTva,
    netAPayerTtc: f.netAPayerTtc,
    cumulEncaisseTtc: f.cumulEncaisseTtc,
    resteTtc: f.resteTtc,
    status: f.status,
    motifLitige: f.motifLitige,
    notes: f.notes,
    delaiRetard: delaiRetard(f),
    nbLignes: f.lignes.length,
    nbEncaissements: f.encaissements.length,
  };
}

@Injectable({ providedIn: 'root' })
export class FactureApiService extends FeatureApiService<
  FactureClient,
  FactureCreate,
  FactureUpdate
> {
  protected override basePath = '/api/v1/factures-client';
  protected override searchFields = ['numero', 'clientName', 'chantierCode'];

  override async getAll(query?: ListQuery): Promise<ListResponse<FactureClient>> {
    const q = (query ?? {}) as FactureQuery;
    let params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
    });
    if (q.status) params = params.set('status', q.status);
    if (q.clientId) params = params.set('clientId', q.clientId);

    const rows = await this.get<FactureClient[]>(this.basePath, params);
    let items = (rows ?? []).map((f) => toListItem({ ...f, lignes: f.lignes ?? [], encaissements: f.encaissements ?? [] }));

    if (q.chantierId) items = items.filter((f) => f.chantierId === q.chantierId);
    if (q.type) items = items.filter((f) => f.type === q.type);
    if (q.modePaiement) items = items.filter((f) => f.modePaiement === q.modePaiement);
    if (q.dateFrom) items = items.filter((f) => f.dateEmission >= q.dateFrom!);
    if (q.dateTo) items = items.filter((f) => f.dateEmission <= q.dateTo!);
    if (typeof q.montantMin === 'number')
      items = items.filter((f) => f.netAPayerTtc >= q.montantMin!);
    if (typeof q.montantMax === 'number')
      items = items.filter((f) => f.netAPayerTtc <= q.montantMax!);

    items.sort((a, b) => (a.dateEmission < b.dateEmission ? 1 : -1));

    return {
      items: items as unknown as FactureClient[],
      total: items.length,
    };
  }

  override async getById(id: string | number): Promise<FactureClient> {
    const row = await this.get<FactureClient>(`${this.basePath}/${id}`);
    return {
      ...row,
      lignes: row.lignes ?? [],
      encaissements: row.encaissements ?? [],
    };
  }

  override async create(data: FactureCreate): Promise<FactureClient> {
    return this.post<FactureClient>(this.basePath, data);
  }

  override async update(
    id: string | number,
    data: FactureUpdate,
  ): Promise<FactureClient> {
    return this.put<FactureClient>(`${this.basePath}/${id}`, data);
  }

  override async delete(id: string | number): Promise<void> {
    await this.deleteRequest(`${this.basePath}/${id}`);
  }

  async addEncaissement(
    factureId: string,
    encaissement: Omit<Encaissement, 'id' | 'factureId'>,
  ): Promise<FactureClient> {
    const row = await this.post<FactureClient>(
      `${this.basePath}/${factureId}/encaissements`,
      encaissement,
    );
    return {
      ...row,
      lignes: row.lignes ?? [],
      encaissements: row.encaissements ?? [],
    };
  }

  async removeEncaissement(
    factureId: string,
    encaissementId: string,
  ): Promise<FactureClient> {
    const row = await firstValueFrom(
      this.http.delete<FactureClient>(
        this.resolveUrl(
          `${this.basePath}/${factureId}/encaissements/${encaissementId}`,
        ),
      ),
    );
    return {
      ...row,
      lignes: row.lignes ?? [],
      encaissements: row.encaissements ?? [],
    };
  }
}
