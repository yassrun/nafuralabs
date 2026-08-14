import { Injectable, inject } from '@angular/core';

import { LookupService } from '@lib/anatomy';
import type { LookupItem } from '@lib/anatomy/types';

import type { PartnerRoleType } from './partners-api.service';

export interface ErpLookupRequest {
  /** Cache key — include filters in the key when params vary. */
  key: string;
  endpoint: string;
  params?: Record<string, string | number | boolean>;
  displayField?: string;
  valueField?: string;
}

const DEPOT_LOCATION_TYPES = new Set(['DEPOT', 'ENTREPOT', 'TRANSIT', 'VIRTUEL']);

/**
 * ERP-wide lookup loader — uses platform {@link LookupService} instead of `getAll(pageSize: 500)`.
 *
 * Prefer `/lookup` endpoints when the backend exposes them; fall back to list endpoints
 * when extra fields or filters (role, statut, location type) are required.
 */
@Injectable({ providedIn: 'root' })
export class ErpLookupService {
  private readonly lookup = inject(LookupService);

  fetch(request: ErpLookupRequest): Promise<LookupItem[]> {
    return this.lookup.get({
      key: request.key,
      endpoint: request.endpoint,
      params: request.params,
      displayField: request.displayField,
      valueField: request.valueField,
    });
  }

  chantiers(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `chantiers:${search}` : 'chantiers',
      endpoint: '/api/v1/chantiers/lookup',
      params: search ? { search } : { size: 200 },
      displayField: 'label',
      valueField: 'id',
    });
  }

  /** Full location rows (needed to filter by `type`). */
  locations(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `locations:${search}` : 'locations',
      endpoint: '/api/v1/locations',
      params: { page: 0, size: 200, ...(search ? { q: search } : {}) },
      displayField: 'name',
      valueField: 'id',
    });
  }

  async locationDepots(): Promise<LookupItem[]> {
    const items = await this.locations();
    return items.filter((item) => {
      const type = (item.data as Record<string, unknown> | undefined)?.['type'];
      return typeof type === 'string' && DEPOT_LOCATION_TYPES.has(type);
    });
  }

  partnersByRole(role: PartnerRoleType, search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `partners:${role}:${search}` : `partners:${role}`,
      endpoint: '/api/v1/partners',
      params: {
        role,
        page: 0,
        size: 200,
        ...(search ? { q: search } : {}),
      },
      displayField: 'raisonSociale',
      valueField: 'id',
    });
  }

  employes(statut?: string, search?: string): Promise<LookupItem[]> {
    const key = ['employes', statut ?? 'all', search ?? ''].filter(Boolean).join(':');
    return this.lookup.get({
      key,
      endpoint: '/api/v1/rh/employes',
      params: {
        ...(statut ? { statut } : {}),
        ...(search ? { q: search } : {}),
      },
      transform: (response) => {
        const rows = extractRecords(response);
        return rows.map((row) => {
          const id = row['id'] ?? '';
          const prenom = String(row['prenom'] ?? '').trim();
          const nom = String(row['nom'] ?? '').trim();
          const label = `${prenom} ${nom}`.trim() || String(row['matricule'] ?? id);
          return { key: id as string | number, value: label, data: row };
        });
      },
    });
  }

  /** Full item rows for catalogue / line editors (uom, price, type). */
  items(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `items:${search}` : 'items',
      endpoint: '/api/v1/items',
      params: { page: 0, size: 500, ...(search ? { q: search } : {}) },
      displayField: 'name',
      valueField: 'id',
    });
  }

  currencies(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `currencies:${search}` : 'currencies',
      endpoint: '/api/v1/currencies/lookup',
      params: search ? { q: search, size: 100 } : { size: 100 },
      displayField: 'name',
      valueField: 'id',
    });
  }

  ouvrages(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `ouvrages:${search}` : 'ouvrages',
      endpoint: '/api/v1/ouvrages/lookup',
      params: search ? { search } : { size: 200 },
      displayField: 'label',
      valueField: 'id',
    });
  }
}

function extractRecords(response: unknown): Record<string, unknown>[] {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }
  if (!isRecord(response)) {
    return [];
  }
  for (const key of ['items', 'content', 'results']) {
    const value = response[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Display label for partner lookup rows loaded via {@link ErpLookupService.partnersByRole}. */
export function partnerLookupLabel(item: LookupItem): string {
  const data = item.data as Record<string, unknown> | undefined;
  const code = data?.['code'];
  return code ? `${String(code)} — ${item.value}` : item.value;
}
