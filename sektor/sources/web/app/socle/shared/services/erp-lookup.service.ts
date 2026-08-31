import { Injectable, inject } from '@angular/core';

import { LookupService } from '@platform/lib/anatomy';
import type { LookupItem } from '@platform/lib/anatomy/types';

import { PartnersApiService, type PartnerRoleType } from './partners-api.service';

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
  private readonly partnersApi = inject(PartnersApiService);

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
    const q = search?.trim() ?? '';
    if (q.length < 2) {
      return Promise.resolve([]);
    }
    return this.fetch({
      key: `chantiers:${q}`,
      endpoint: '/api/v1/chantiers/lookup',
      params: { search: q },
      displayField: 'label',
      valueField: 'id',
    });
  }

  /** Full location rows (needed to filter by `type`). */
  locations(search?: string): Promise<LookupItem[]> {
    const q = search?.trim() ?? '';
    if (q.length < 2) {
      return Promise.resolve([]);
    }
    return this.fetch({
      key: `locations:${q}`,
      endpoint: '/api/v1/locations',
      params: { page: 0, size: 50, q },
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
    const q = search?.trim() ?? '';
    if (q.length < 2) {
      return Promise.resolve([]);
    }
    return this.fetch({
      key: `partners:${role}:${q}`,
      endpoint: '/api/v1/partners',
      params: {
        role,
        page: 0,
        size: 50,
        q,
      },
      displayField: 'raisonSociale',
      valueField: 'id',
    }).then((items) => exactCodeFirst(items, q));
  }

  async partnerById(id: string): Promise<LookupItem | null> {
    try {
      const p = await this.partnersApi.getById(id);
      return {
        key: p.id,
        value: p.code ? `${p.code} — ${p.raisonSociale}` : p.raisonSociale,
        data: p as unknown as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  employes(statut?: string, search?: string): Promise<LookupItem[]> {
    const q = search?.trim() ?? '';
    if (search !== undefined && q.length < 2) {
      return Promise.resolve([]);
    }
    if (!q) {
      return Promise.resolve([]);
    }
    const key = ['employes', statut ?? 'all', q].filter(Boolean).join(':');
    return this.lookup
      .get({
        key,
        endpoint: '/api/v1/rh/employes',
        params: {
          ...(statut ? { statut } : {}),
          q,
        },
        transform: (response) => {
          const rows = extractRecords(response);
          return rows.map((row) => {
            const id = row['id'] ?? '';
            const prenom = String(row['prenom'] ?? '').trim();
            const nom = String(row['nom'] ?? '').trim();
            const matricule = String(row['matricule'] ?? '').trim();
            const name = `${prenom} ${nom}`.trim();
            const label =
              name && matricule
                ? `${name} · ${matricule}`
                : name || matricule || String(id);
            return { key: id as string | number, value: label, data: row };
          });
        },
      })
      .then((items) => exactMatriculeFirst(items, q));
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

  devis(search?: string): Promise<LookupItem[]> {
    const q = search?.trim() ?? '';
    if (q.length < 2) {
      return Promise.resolve([]);
    }
    return this.lookup.get({
      key: `devis:${q}`,
      endpoint: '/api/v1/etudes/devis',
      params: { page: 0, size: 50, q },
      transform: (response) =>
        extractRecords(response).map((row) => {
          const numero = String(row['numero'] ?? '').trim();
          const objet = String(row['objet'] ?? '').trim();
          const label = [numero, objet].filter(Boolean).join(' — ') || String(row['id'] ?? '');
          return { key: String(row['id'] ?? ''), value: label, data: row };
        }),
    });
  }

  factures(search?: string): Promise<LookupItem[]> {
    const q = search?.trim() ?? '';
    if (q.length < 2) {
      return Promise.resolve([]);
    }
    return this.lookup.get({
      key: `factures:${q}`,
      endpoint: '/api/v1/factures-client',
      params: { page: 0, size: 50, q },
      transform: (response) =>
        extractRecords(response).map((row) => {
          const numero = String(row['numero'] ?? '').trim();
          const client = String(row['clientName'] ?? row['clientNom'] ?? '').trim();
          const label = [numero, client].filter(Boolean).join(' — ') || String(row['id'] ?? '');
          return { key: String(row['id'] ?? ''), value: label, data: row };
        }),
    });
  }

  uoms(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `uoms:${search}` : 'uoms',
      endpoint: '/api/v1/units-of-measure',
      params: { page: 0, size: 50, ...(search ? { q: search } : {}) },
      displayField: 'name',
      valueField: 'id',
    });
  }

  uomCategories(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `uomCategories:${search}` : 'uomCategories',
      endpoint: '/api/v1/uom-categories',
      params: { page: 0, size: 50, ...(search ? { q: search } : {}) },
      displayField: 'name',
      valueField: 'id',
    });
  }

  itemCategories(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `itemCategories:${search}` : 'itemCategories',
      endpoint: '/api/v1/item-categories/lookup',
      params: search ? { q: search, size: 50 } : { size: 50 },
      displayField: 'label',
      valueField: 'id',
    });
  }

  motifs(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `motifs:${search}` : 'motifs',
      endpoint: '/api/v1/motifs',
      params: { page: 0, size: 50, ...(search ? { q: search } : {}) },
      displayField: 'libelle',
      valueField: 'id',
    });
  }

  inventoryTxes(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `inventoryTxes:${search}` : 'inventoryTxes',
      endpoint: '/api/v1/inventory-txs',
      params: { page: 0, size: 50, ...(search ? { q: search } : {}) },
      displayField: 'numero',
      valueField: 'id',
    });
  }

  /** Engins / matériels parc — typeahead ≥ 2 car. (AC-13, AC-16). */
  materiels(search?: string): Promise<LookupItem[]> {
    const q = search?.trim() ?? '';
    if (q.length < 2) {
      return Promise.resolve([]);
    }
    return this.lookup
      .get({
        key: `materiels:${q}`,
        endpoint: '/api/v1/materiels',
        params: { page: 0, size: 50, search: q },
        transform: (response) =>
          extractRecords(response).map((row) => {
            const id = String(row['id'] ?? '');
            const code = String(row['code'] ?? '').trim();
            const name = String(row['name'] ?? '').trim();
            const serie = String(row['numeroSerie'] ?? '').trim();
            const primary = code && name ? `${code} — ${name}` : name || code || id;
            const label = serie ? `${primary} · ${serie}` : primary;
            return { key: id, value: label, data: row };
          }),
      })
      .then((items) => exactCodeFirst(items, q));
  }

  paymentTerms(search?: string): Promise<LookupItem[]> {
    return this.fetch({
      key: search ? `paymentTerms:${search}` : 'paymentTerms',
      endpoint: '/api/v1/payment-terms',
      params: { page: 0, size: 50, ...(search ? { q: search } : {}) },
      displayField: 'libelle',
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

export function partnerSelectOptions(
  items: LookupItem[],
): Array<{ value: string; label: string }> {
  return items.map((p) => ({ value: String(p.key), label: partnerLookupLabel(p) }));
}

export function lookupSelectOptions(
  items: LookupItem[],
): Array<{ value: string; label: string }> {
  return items.map((item) => ({ value: String(item.key), label: item.value }));
}

function exactCodeFirst(items: LookupItem[], query: string): LookupItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return [...items].sort((a, b) => {
    const ac = String((a.data as Record<string, unknown> | undefined)?.['code'] ?? '').toLowerCase();
    const bc = String((b.data as Record<string, unknown> | undefined)?.['code'] ?? '').toLowerCase();
    return (ac === needle ? 0 : 1) - (bc === needle ? 0 : 1);
  });
}

function exactMatriculeFirst(items: LookupItem[], query: string): LookupItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return [...items].sort((a, b) => {
    const am = String((a.data as Record<string, unknown> | undefined)?.['matricule'] ?? '').toLowerCase();
    const bm = String((b.data as Record<string, unknown> | undefined)?.['matricule'] ?? '').toLowerCase();
    return (am === needle ? 0 : 1) - (bm === needle ? 0 : 1);
  });
}
