import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { RegistreLegalEntry } from '../../models';

export interface ApiRegistreLegal {
  id: string;
  registre: string;
  numero: string;
  date: string;
  reference?: string;
  chantierId?: string;
  chantierCode?: string;
  employeId?: string;
  employeNom?: string;
  description: string;
  statut?: string;
  derniereMaj?: string;
  extensionJson?: string;
}

interface RegistreLegalQuery extends ListQuery {
  chantierId?: string;
  registre?: string;
}

function parseExtension(raw?: string): Partial<RegistreLegalEntry> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<RegistreLegalEntry>;
  } catch {
    return {};
  }
}

function toUi(row: ApiRegistreLegal): RegistreLegalEntry {
  const extra = parseExtension(row.extensionJson);
  return {
    id: row.id,
    registre: row.registre as RegistreLegalEntry['registre'],
    numero: row.numero,
    date: row.date,
    reference: row.reference,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode,
    employeNom: row.employeNom ?? extra.employeNom,
    description: row.description,
    cnssMatricule: extra.cnssMatricule,
    joursArret: extra.joursArret,
    partieDuCorps: extra.partieDuCorps,
    tableauMP: extra.tableauMP,
    effectif: extra.effectif,
    dureeJours: extra.dureeJours,
    presents: extra.presents,
    decisions: extra.decisions,
    observations: extra.observations,
  };
}

@Injectable({ providedIn: 'root' })
export class RegistreLegalApiService extends FeatureApiService<
  RegistreLegalEntry,
  Partial<RegistreLegalEntry>,
  Partial<RegistreLegalEntry>
> {
  protected override basePath = '/api/v1/hse/registres-legaux';
  protected override searchFields = ['numero', 'description', 'employeNom', 'chantierCode', 'reference'];

  override async getAll(query?: ListQuery): Promise<ListResponse<RegistreLegalEntry>> {
    const q = (query ?? {}) as RegistreLegalQuery;
    const params = this.buildQueryParams({
      ...q,
      search: q['search'] as string | undefined,
      chantierId: q.chantierId,
      registre: q.registre,
    });
    const rows = await this.get<ApiRegistreLegal[]>(this.basePath, params);
    const items = (rows ?? []).map(toUi);
    return { items, total: items.length };
  }

  override async getById(id: string | number): Promise<RegistreLegalEntry> {
    const row = await this.get<ApiRegistreLegal>(`${this.basePath}/${id}`);
    return toUi(row);
  }
}
