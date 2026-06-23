import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@lib/anatomy';
import type { ListQuery, ListResponse } from '@lib/anatomy/types';
import { AttachmentApiService } from '@platform/features/collaboration/doc-manager/services/attachment-api.service';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@applications/erp/shared/config/attachment-detail.config';

import { ChantierApiService } from '../../services/chantier-api.service';

import type {
  AvancementListItem,
  AvancementPersistInput,
  AvancementPhoto,
  AvancementQuery,
  AvancementUpdateInput,
} from '../models';

interface ApiAvancementPhysique {
  id: string;
  chantierId: string;
  chantierCode?: string;
  chantierName?: string;
  lotId?: string;
  lotCode?: string;
  lotDesignation?: string;
  posteId?: string;
  date: string;
  quantiteRealisee: number;
  cumulQuantite?: number;
  pourcentage: number;
  saisieParId?: string;
  saisieParName?: string;
  notes?: string;
  status: string;
  photosCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

function apiToListItem(row: ApiAvancementPhysique): AvancementListItem {
  const photosCount = Number(row.photosCount ?? 0);
  return {
    id: row.id,
    chantierId: row.chantierId,
    chantierCode: row.chantierCode ?? row.chantierId,
    chantierName: row.chantierName ?? '',
    lotId: row.lotId ?? '',
    lotCode: row.lotCode ?? '',
    lotDesignation: row.lotDesignation ?? '',
    date: row.date,
    quantiteRealisee: Number(row.quantiteRealisee ?? 0),
    cumulQuantite: Number(row.cumulQuantite ?? row.quantiteRealisee ?? 0),
    pourcentage: Number(row.pourcentage ?? 0),
    saisieParId: row.saisieParId ?? '',
    saisieParName: row.saisieParName ?? '',
    notes: row.notes,
    photos: [],
    status: row.status as AvancementListItem['status'],
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
    photosCount,
  };
}

function normalizeChantierIds(value?: string[] | string): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function applyClientFilters(items: AvancementListItem[], query?: AvancementQuery): AvancementListItem[] {
  if (!query) {
    return items;
  }

  let filtered = [...items];
  const lotIds = normalizeChantierIds(query.lotId);
  const search = query['search'];

  if (typeof search === 'string' && search.trim().length > 0) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.chantierCode.toLowerCase().includes(term) ||
        item.chantierName.toLowerCase().includes(term) ||
        item.lotCode.toLowerCase().includes(term) ||
        item.lotDesignation.toLowerCase().includes(term),
    );
  }

  if (lotIds.length > 0) {
    filtered = filtered.filter((item) => lotIds.includes(item.lotId));
  }

  if (query.dateFrom) {
    filtered = filtered.filter((item) => item.date >= query.dateFrom!);
  }

  if (query.dateTo) {
    filtered = filtered.filter((item) => item.date <= query.dateTo!);
  }

  if (query.saisieParId) {
    filtered = filtered.filter((item) => item.saisieParId === query.saisieParId);
  }

  if (query.avecPhotos) {
    filtered = filtered.filter((item) => item.photosCount > 0 || item.photos.length > 0);
  }

  return filtered;
}

@Injectable({ providedIn: 'root' })
export class AvancementApiService extends FeatureApiService<
  AvancementListItem,
  AvancementPersistInput,
  AvancementUpdateInput
> {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly attachmentApi = inject(AttachmentApiService);
  private readonly translate = inject(TranslateService);
  protected override basePath = '/api/v1/chantiers';
  protected override searchFields = ['chantierCode', 'chantierName', 'lotCode', 'lotDesignation'];

  async listByChantier(chantierId: string): Promise<AvancementListItem[]> {
    const rows = await this.get<ApiAvancementPhysique[]>(`${this.basePath}/${chantierId}/avancements`);
    return (rows ?? []).map(apiToListItem);
  }

  override async getAll(query?: AvancementQuery): Promise<ListResponse<AvancementListItem>> {
    let chantierIds = normalizeChantierIds(query?.chantierId);
    if (chantierIds.length === 0) {
      const { items: allChantiers } = await this.chantierApi.getAll({ page: 0, pageSize: 200 });
      chantierIds = allChantiers.map((c) => c.id);
    }
    if (chantierIds.length === 0) {
      return { items: [], total: 0 };
    }

    const batches = await Promise.all(chantierIds.map((chantierId) => this.listByChantier(chantierId)));
    let items = batches.flat();
    items = applyClientFilters(items, query);

    if (query?.sortBy) {
      const direction = query.sortDirection === 'asc' ? 1 : -1;
      items = items.sort((left, right) => {
        const leftValue = left[query.sortBy as keyof AvancementListItem];
        const rightValue = right[query.sortBy as keyof AvancementListItem];
        if (typeof leftValue === 'number' && typeof rightValue === 'number') {
          return (leftValue - rightValue) * direction;
        }
        return String(leftValue ?? '').localeCompare(String(rightValue ?? '')) * direction;
      });
    } else {
      items = items.sort((left, right) => right.date.localeCompare(left.date));
    }

    const total = items.length;
    const page = Math.max(1, Number(query?.page ?? 1));
    const pageSize = Math.max(1, Number(query?.pageSize ?? 20));
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      total,
    };
  }

  override async getById(id: string | number): Promise<AvancementListItem> {
    const found = await this.findById(String(id));
    if (!found) {
      throw new Error(this.translate.instant('chantiers.avancement.errors.notFound', { id: String(id) }));
    }
    return found;
  }

  async findById(id: string): Promise<AvancementListItem | null> {
    const { items: chantiers } = await this.chantierApi.getAll({ page: 0, pageSize: 500 });
    for (const chantier of chantiers) {
      const rows = await this.listByChantier(chantier.id);
      const hit = rows.find((row) => row.id === id);
      if (hit) {
        return hit;
      }
    }
    return null;
  }

  override async create(data: AvancementPersistInput): Promise<AvancementListItem> {
    const rows = await this.post<ApiAvancementPhysique[]>(`${this.basePath}/${data.chantierId}/avancements`, {
      date: data.date,
      status: data.status,
      saisieParId: data.saisieParId,
      entries: data.entries.map((entry) => ({
        lotId: entry.lotId,
        quantiteRealisee: entry.quantiteRealisee,
        notes: entry.notes,
      })),
    });
    const createdRows = rows ?? [];
    if (createdRows.length === 0) {
      throw new Error(this.translate.instant('chantiers.avancement.errors.createFailed'));
    }

    await Promise.all(
      createdRows.map((row, index) => {
        const entry = data.entries[index];
        const photos = entry?.photos ?? [];
        return this.uploadEntryPhotos(row.id, photos);
      }),
    );

    const created = createdRows[0];
    const item = apiToListItem(created);
    item.photosCount = await this.countPhotos(created.id);
    return item;
  }

  override async update(id: string | number, data: AvancementUpdateInput): Promise<AvancementListItem> {
    const row = await this.put<ApiAvancementPhysique>(`/api/v1/avancements/${id}`, {
      date: data.date,
      quantiteRealisee: data.quantiteRealisee,
      notes: data.notes,
      status: data.status,
    });
    if (data.photos?.length) {
      await this.uploadEntryPhotos(String(id), data.photos);
    }
    const item = apiToListItem(row);
    item.photosCount = await this.countPhotos(String(id));
    return item;
  }

  async loadPhotos(avancementId: string): Promise<AvancementPhoto[]> {
    const page = await firstValueFrom(
      this.attachmentApi.listAttachments(ERP_ATTACHMENT_ENTITY_TYPES.AVANCEMENT, avancementId, 0, 50),
    );
    return (page.content ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.fileName,
      url: this.attachmentApi.getAttachmentDownloadUrl(attachment.fileUrl),
      capturedAt: attachment.uploadedAt ?? new Date().toISOString(),
    }));
  }

  private async uploadEntryPhotos(avancementId: string, photos: AvancementPhoto[]): Promise<void> {
    const pending = photos.filter((photo) => photo.file);
    if (pending.length === 0) {
      return;
    }
    await Promise.all(
      pending.map((photo) =>
        firstValueFrom(
          this.attachmentApi.uploadAttachment(
            ERP_ATTACHMENT_ENTITY_TYPES.AVANCEMENT,
            avancementId,
            photo.file!,
          ),
        ),
      ),
    );
  }

  private async countPhotos(avancementId: string): Promise<number> {
    const page = await firstValueFrom(
      this.attachmentApi.listAttachments(ERP_ATTACHMENT_ENTITY_TYPES.AVANCEMENT, avancementId, 0, 1),
    );
    return page.totalElements ?? 0;
  }

  async valider(id: string): Promise<AvancementListItem> {
    const row = await this.post<ApiAvancementPhysique>(`/api/v1/avancements/${id}/valider`, {});
    return apiToListItem(row);
  }

  async getDernierByChantier(chantierId: string): Promise<AvancementListItem[]> {
    const rows = await this.get<ApiAvancementPhysique[]>(
      `${this.basePath}/${chantierId}/avancements/dernier`,
    );
    return (rows ?? []).map(apiToListItem);
  }

  override async delete(_id: string | number): Promise<void> {
    throw new Error(this.translate.instant('chantiers.avancement.errors.deleteNotAvailable'));
  }
}
