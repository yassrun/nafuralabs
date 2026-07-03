import { Injectable } from '@angular/core';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import type { Location } from '@applications/erp/inventory/models';

export type LocationCreate = Omit<Location, 'id'>;
export type LocationUpdate = Partial<LocationCreate>;

/** Backend enum → UI enum */
const BACKEND_TO_UI_TYPE: Record<string, Location['type']> = {
  WAREHOUSE: 'ENTREPOT',
  BIN: 'DEPOT',
  SHELF: 'DEPOT',
  ZONE: 'TRANSIT',
};

/** UI enum → backend enum */
const UI_TO_BACKEND_TYPE: Record<string, string> = {
  DEPOT: 'WAREHOUSE',
  ENTREPOT: 'WAREHOUSE',
  CHANTIER: 'WAREHOUSE',
  TRANSIT: 'ZONE',
  VIRTUEL: 'ZONE',
};

/** Backend returns `isPhysical`/`affectsStock` — normalize to `isActive` for UI. */
function normalizeLocation(raw: Record<string, unknown>): Location {
  const isActive = raw['isActive'] !== undefined
    ? Boolean(raw['isActive'])
    : Boolean(raw['affectsStock'] ?? raw['isPhysical'] ?? true);
  const rawType = String(raw['type'] ?? '');
  const type: Location['type'] = (BACKEND_TO_UI_TYPE[rawType] ?? rawType) as Location['type'];
  return { ...raw, isActive, type } as unknown as Location;
}

/** UI Location → backend payload */
function toBackendPayload(data: Partial<LocationCreate>): Record<string, unknown> {
  const backendType = UI_TO_BACKEND_TYPE[String(data.type ?? '')] ?? data.type;
  return {
    ...data,
    type: backendType,
    affectsStock: data.isActive !== false,
    isPhysical: data.isActive !== false,
  };
}

@Injectable({ providedIn: 'root' })
export class LocationsApiService extends FeatureApiService<Location, LocationCreate, LocationUpdate> {
  protected override basePath = '/api/v1/locations';
  protected override searchFields = ['code', 'name'];

  override async getAll(query?: ListQuery): Promise<ListResponse<Location>> {
    const res = await super.getAll(query);
    return { ...res, items: res.items.map((r) => normalizeLocation(r as unknown as Record<string, unknown>)) };
  }

  override async getById(id: string | number): Promise<Location> {
    const raw = await super.getById(id);
    return normalizeLocation(raw as unknown as Record<string, unknown>);
  }

  override async create(data: LocationCreate): Promise<Location> {
    const raw = await super.create(toBackendPayload(data) as LocationCreate);
    return normalizeLocation(raw as unknown as Record<string, unknown>);
  }

  override async update(id: string | number, data: LocationUpdate): Promise<Location> {
    const raw = await super.update(id, toBackendPayload(data) as LocationUpdate);
    return normalizeLocation(raw as unknown as Record<string, unknown>);
  }
}
