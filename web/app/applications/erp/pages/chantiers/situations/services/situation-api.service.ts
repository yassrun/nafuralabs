import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Chantier } from '@applications/erp/chantiers/models';
import { ChantierApiService } from '@applications/erp/pages/chantiers/services/chantier-api.service';
import type {
  FactureClient,
  Situation,
  SituationCreate,
  SituationListItem,
  SituationUpdate,
} from '@applications/erp/chantiers/models';

interface ApiFactureSummary {
  id: string;
  numero: string;
  clientId: string;
  clientName?: string;
  chantierId: string;
  chantierCode?: string;
  situationId?: string;
  situationNumero?: string;
  dateEmission: string;
  dateEcheance: string;
  totalHt: number;
  retenueGarantieTaux?: number;
  retenueGarantieMontant?: number;
  netAPayerHt?: number;
  tvaTaux: number;
  totalTva: number;
  netAPayerTtc: number;
  status: string;
}

function apiFactureToModel(f: ApiFactureSummary, situation: Situation): FactureClient {
  return {
    id: f.id,
    numero: f.numero,
    chantierId: f.chantierId,
    chantierCode: f.chantierCode,
    clientId: f.clientId,
    clientName: f.clientName,
    situationId: f.situationId ?? situation.id,
    situationNumero: f.situationNumero ?? situation.numero,
    dateEmission: f.dateEmission,
    dateEcheance: f.dateEcheance,
    totalHt: Number(f.totalHt ?? 0),
    tvaTaux: Number(f.tvaTaux ?? 20),
    totalTva: Number(f.totalTva ?? 0),
    totalTtc: Number(f.netAPayerTtc ?? 0),
    status: f.status as FactureClient['status'],
  };
}

interface SituationQuery extends ListQuery {
  status?: string;
  chantierId?: string;
  dateFrom?: string;
  dateTo?: string;
  montantMin?: number;
  montantMax?: number;
  quick?:
    | 'BROUILLON'
    | 'A_VALIDER'
    | 'A_FACTURER'
    | 'EN_RETARD_PAIEMENT'
    | 'MES_SITUATIONS';
}

interface ApiSituationLigne {
  id: string;
  lotId?: string;
  lotCode?: string;
  posteBudgetaireId?: string;
  designation: string;
  unite?: string;
  quantiteTotale?: number;
  quantitePrecedente?: number;
  quantiteCumulee: number;
  prixUnitaire: number;
  montantHt: number;
}

interface ApiSituation {
  id: string;
  chantierId: string;
  chantierCode?: string;
  chantierName?: string;
  numero: string;
  numeroOrdre: number;
  datePeriodeDebut: string;
  datePeriodeFin: string;
  dateEmission: string;
  cumulPrecedentHt: number;
  cumulCourantHt: number;
  travauxPeriodeHt: number;
  retenueGarantiePercent: number;
  retenueGarantieMontant: number;
  retenueAvancePercent?: number;
  retenueAvanceMontant?: number;
  netAPayerHt: number;
  tvaTaux: number;
  netAPayerTtc: number;
  status: string;
  factureId?: string;
  approbateurMOAName?: string;
  approbationDate?: string;
  motifRejet?: string;
  notes?: string;
  nbLignes?: number;
  lignes?: ApiSituationLigne[];
}

const TODAY = new Date();

function daysBetween(from: string, to: Date): number {
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return 0;
  const ms = to.getTime() - d.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function apiLigneToModel(row: ApiSituationLigne): Situation['lignes'][number] {
  return {
    id: row.id,
    lotId: row.lotId ?? '',
    lotCode: row.lotCode,
    designation: row.designation,
    unite: row.unite,
    quantiteTotale: row.quantiteTotale,
    quantitePrecedente: Number(row.quantitePrecedente ?? 0),
    quantiteCumulee: Number(row.quantiteCumulee ?? 0),
    prixUnitaire: Number(row.prixUnitaire ?? 0),
    montantHt: Number(row.montantHt ?? 0),
  };
}

function apiToSituation(row: ApiSituation, includeLignes = true): Situation {
  return {
    id: row.id,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    chantierName: row.chantierName,
    numero: row.numero,
    numeroOrdre: row.numeroOrdre,
    datePeriodeDebut: row.datePeriodeDebut,
    datePeriodeFin: row.datePeriodeFin,
    dateEmission: row.dateEmission,
    cumulPrecedentHt: Number(row.cumulPrecedentHt ?? 0),
    cumulCourantHt: Number(row.cumulCourantHt ?? 0),
    travauxPeriodeHt: Number(row.travauxPeriodeHt ?? 0),
    retenueGarantiePercent: Number(row.retenueGarantiePercent ?? 0),
    retenueGarantieMontant: Number(row.retenueGarantieMontant ?? 0),
    retenueAvancePercent: row.retenueAvancePercent,
    retenueAvanceMontant: row.retenueAvanceMontant,
    netAPayerHt: Number(row.netAPayerHt ?? 0),
    tvaTaux: Number(row.tvaTaux ?? 20),
    netAPayerTtc: Number(row.netAPayerTtc ?? 0),
    status: row.status as Situation['status'],
    factureId: row.factureId,
    approbateurMOAName: row.approbateurMOAName,
    approbationDate: row.approbationDate,
    motifRejet: row.motifRejet,
    notes: row.notes,
    lignes: includeLignes ? (row.lignes ?? []).map(apiLigneToModel) : [],
  };
}

function toListItem(s: Situation, nbLignes?: number): SituationListItem {
  const delaiAttente =
    s.status === 'SOUMISE' ? daysBetween(s.dateEmission, TODAY) : undefined;
  return {
    id: s.id,
    chantierId: s.chantierId,
    chantierCode: s.chantierCode,
    chantierName: s.chantierName,
    numero: s.numero,
    numeroOrdre: s.numeroOrdre,
    datePeriodeDebut: s.datePeriodeDebut,
    datePeriodeFin: s.datePeriodeFin,
    dateEmission: s.dateEmission,
    cumulPrecedentHt: s.cumulPrecedentHt,
    cumulCourantHt: s.cumulCourantHt,
    travauxPeriodeHt: s.travauxPeriodeHt,
    retenueGarantiePercent: s.retenueGarantiePercent,
    retenueGarantieMontant: s.retenueGarantieMontant,
    retenueAvancePercent: s.retenueAvancePercent,
    retenueAvanceMontant: s.retenueAvanceMontant,
    netAPayerHt: s.netAPayerHt,
    tvaTaux: s.tvaTaux,
    netAPayerTtc: s.netAPayerTtc,
    status: s.status,
    factureId: s.factureId,
    approbateurMOAName: s.approbateurMOAName,
    approbationDate: s.approbationDate,
    motifRejet: s.motifRejet,
    notes: s.notes,
    delaiAttente,
    nbLignes: nbLignes ?? s.lignes.length,
  };
}

function normalizeChantierIds(value?: string[] | string): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function applyClientFilters(items: SituationListItem[], query?: SituationQuery): SituationListItem[] {
  if (!query) {
    return items;
  }

  let rows = [...items];

  if (query['search']) {
    const term = String(query['search']).toLowerCase();
    rows = rows.filter(
      (s) =>
        s.numero.toLowerCase().includes(term) ||
        (s.chantierName ?? '').toLowerCase().includes(term) ||
        (s.chantierCode ?? '').toLowerCase().includes(term),
    );
  }
  if (query.status) rows = rows.filter((s) => s.status === query.status);
  if (query.chantierId) {
    const chantierIds = normalizeChantierIds(query.chantierId);
    rows = rows.filter((s) => chantierIds.includes(s.chantierId));
  }
  if (query.dateFrom) rows = rows.filter((s) => s.dateEmission >= query.dateFrom!);
  if (query.dateTo) rows = rows.filter((s) => s.dateEmission <= query.dateTo!);
  if (typeof query.montantMin === 'number')
    rows = rows.filter((s) => s.netAPayerHt >= query.montantMin!);
  if (typeof query.montantMax === 'number')
    rows = rows.filter((s) => s.netAPayerHt <= query.montantMax!);

  if (query.quick) {
    switch (query.quick) {
      case 'BROUILLON':
        rows = rows.filter((s) => s.status === 'BROUILLON');
        break;
      case 'A_VALIDER':
        rows = rows.filter((s) => s.status === 'SOUMISE');
        break;
      case 'A_FACTURER':
        rows = rows.filter((s) => s.status === 'VALIDEE_MOA');
        break;
      case 'EN_RETARD_PAIEMENT':
        rows = rows.filter(
          (s) => s.status === 'FACTUREE' && daysBetween(s.dateEmission, TODAY) > 60,
        );
        break;
      case 'MES_SITUATIONS':
        break;
    }
  }

  return rows;
}

@Injectable({ providedIn: 'root' })
export class SituationApiService extends FeatureApiService<
  Situation,
  SituationCreate,
  SituationUpdate
> {
  protected override basePath = '/api/v1/situations';
  protected override searchFields = ['numero', 'chantierName', 'chantierCode'];

  private readonly chantierApi = inject(ChantierApiService);

  async lookupChantiers(): Promise<Chantier[]> {
    return (await this.chantierApi.getAll()).items;
  }

  async listByChantier(chantierId: string): Promise<SituationListItem[]> {
    const rows = await this.get<ApiSituation[]>(`/api/v1/chantiers/${chantierId}/situations`);
    return (rows ?? []).map((row) => toListItem(apiToSituation(row, false), row.nbLignes));
  }

  override async getAll(query?: ListQuery): Promise<ListResponse<Situation>> {
    const q = (query ?? {}) as SituationQuery;
    const chantierIds = normalizeChantierIds(q.chantierId);
    if (chantierIds.length === 0) {
      const chantiers = await this.lookupChantiers();
      chantierIds.push(...chantiers.map((c) => c.id));
    }

    const batches = await Promise.all(chantierIds.map((chantierId) => this.listByChantier(chantierId)));
    let items = batches.flat();
    items = applyClientFilters(items, q);
    items.sort((a, b) => (a.dateEmission < b.dateEmission ? 1 : -1));

    const total = items.length;
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.max(1, Number(q.pageSize ?? 20));
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize) as unknown as Situation[],
      total,
    };
  }

  override async getById(id: string | number): Promise<Situation> {
    const row = await this.get<ApiSituation>(`${this.basePath}/${id}`);
    if (!row) {
      throw new Error(`Situation ${id} introuvable`);
    }
    return apiToSituation(row, true);
  }

  override async create(data: SituationCreate): Promise<Situation> {
    const numeroOrdre = Number(data.numeroOrdre ?? 1);
    const row = await this.post<ApiSituation>(
      `/api/v1/chantiers/${data.chantierId}/situations/generate?numero=${numeroOrdre}`,
      {},
    );
    return apiToSituation(row, true);
  }

  override async update(_id: string | number, _data: SituationUpdate): Promise<Situation> {
    throw new Error('Mise à jour situation non disponible');
  }

  override async delete(_id: string | number): Promise<void> {
    throw new Error('Suppression situation non disponible');
  }

  async submit(id: string): Promise<Situation> {
    const row = await this.post<ApiSituation>(`${this.basePath}/${id}/submit`, {});
    return apiToSituation(row, true);
  }

  async acceptMoa(id: string): Promise<Situation> {
    const row = await this.post<ApiSituation>(`${this.basePath}/${id}/accept-moa`, {});
    return apiToSituation(row, true);
  }

  async reject(id: string, motif: string): Promise<Situation> {
    const params = new HttpParams().set('motif', motif);
    const row = await firstValueFrom(
      this.http.post<ApiSituation>(this.resolveUrl(`${this.basePath}/${id}/reject`), {}, { params }),
    );
    return apiToSituation(row, true);
  }

  async marquerPayee(id: string): Promise<Situation> {
    const row = await this.post<ApiSituation>(`${this.basePath}/${id}/marquer-payee`, {});
    return apiToSituation(row, true);
  }

  async convertToFacture(id: string): Promise<{ situation: Situation; facture: FactureClient }> {
    const result = await this.post<{
      situation: ApiSituation;
      factureId: string;
      facture?: ApiFactureSummary;
    }>(`${this.basePath}/${id}/convert-to-facture`, {});
    const situation = apiToSituation(result.situation, true);
    if (result.facture) {
      return { situation, facture: apiFactureToModel(result.facture, situation) };
    }
    const facture: FactureClient = {
      id: result.factureId,
      numero: result.factureId,
      chantierId: situation.chantierId,
      chantierCode: situation.chantierCode,
      clientId: '',
      situationId: situation.id,
      situationNumero: situation.numero,
      dateEmission: situation.dateEmission,
      dateEcheance: situation.dateEmission,
      totalHt: situation.netAPayerHt,
      tvaTaux: situation.tvaTaux,
      totalTva: situation.netAPayerTtc - situation.netAPayerHt,
      totalTtc: situation.netAPayerTtc,
      status: 'BROUILLON',
    };
    return { situation, facture };
  }
}
