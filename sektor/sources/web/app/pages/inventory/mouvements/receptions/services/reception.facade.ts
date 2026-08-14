import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import type { CrudStyleFacade } from '@lib/anatomy';
import type { ListResponse, LookupContext } from '@lib/anatomy/types';
import type { InventoryTx, InventoryTxLine, Location } from '../../../../../inventory/models';
import { BcApiService } from '../../../../../pages/achats/commandes/services/bc-api.service';
import { InventoryLookupsService } from '../../../../../inventory/services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../../../inventory/services/inventory-movement-api.service';
import {
  loadMovementPage,
  sumLineTotals,
} from '../../../../../inventory/services/movement-facade.util';
import type { ApiInventoryTxRow } from '../../../../../inventory/services/inventory-tx.mapper';

export interface ReceptionListItem extends InventoryTx {
  totalValue: number;
}

@Injectable({ providedIn: 'root' })
export class ReceptionFacade implements CrudStyleFacade<InventoryTx, Partial<InventoryTx>> {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly lookupsService = inject(InventoryLookupsService);
  private readonly bcApi = inject(BcApiService);

  private locationsCache: Location[] = [];
  private bcNumeroById = new Map<string, string>();
  private readonly lookupsSignal = signal<LookupContext>({});
  private readonly translate = inject(TranslateService);

  readonly lookups = computed(() => this.lookupsSignal());

  private enrichers() {
    return {
      locationName: (id?: string) => this.locationName(id),
      fournisseurName: (id?: string) => this.fournisseurName(id),
    };
  }

  async ensureLookups(): Promise<void> {
    this.locationsCache = await this.lookupsService.loadLocations();
    this.lookupsSignal.set(await this.lookupsService.buildReceptionLookups());
    if (this.bcNumeroById.size === 0) {
      try {
        const { items } = await this.bcApi.getAll({ pageSize: 500 });
        this.bcNumeroById = new Map(items.map((bc) => [bc.id, bc.numero]));
      } catch {
        this.bcNumeroById = new Map();
      }
    }
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<ReceptionListItem>> {
    await this.ensureLookups();
    return loadMovementPage(
      this.movementApi,
      'RECEPTION',
      query,
      (rows) => this.applyFilters(rows, query),
      (tx) => this.enrichReception({ ...tx, totalValue: sumLineTotals(tx.lines) }),
      this.enrichers(),
    );
  }

  private applyFilters(rows: ApiInventoryTxRow[], query?: Record<string, unknown>): ApiInventoryTxRow[] {
    if (!query) return rows;
    let out = [...rows];

    const status = query['status'] as string | undefined;
    if (status) {
      out = out.filter((r) => r.status === status);
    }

    const fournisseurId = query['fournisseurId'] as string | undefined;
    if (fournisseurId) {
      out = out.filter((r) => r.fournisseurId === fournisseurId);
    }

    const destLocationId = query['destLocationId'] as string | undefined;
    if (destLocationId) {
      out = out.filter(
        (r) => r.destLocationId === destLocationId || r.chantierLocationId === destLocationId,
      );
    }

    const dateFrom = query['txDateFrom'] as string | undefined;
    const dateTo = query['txDateTo'] as string | undefined;
    if (dateFrom) {
      out = out.filter((r) => r.txDate >= dateFrom);
    }
    if (dateTo) {
      out = out.filter((r) => r.txDate <= dateTo);
    }

    const search = query['search'] as string | undefined;
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.txNumber.toLowerCase().includes(q) ||
          (r.reference ?? '').toLowerCase().includes(q),
      );
    }

    return out;
  }

  async getItem(id: string): Promise<InventoryTx> {
    await this.ensureLookups();
    return this.movementApi.getDetail(id, this.enrichers());
  }

  async createItem(input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const destId = input.destLocationId || input.chantierLocationId;
    return this.movementApi.create(
      {
        ...input,
        txType: 'RECEPTION',
        txDate: input.txDate ?? new Date().toISOString().slice(0, 10),
        destLocationId: destId,
        chantierLocationId: input.chantierLocationId,
        status: 'BROUILLON',
        lines: input.lines ?? [],
      },
      this.enrichers(),
    );
  }

  async updateItem(id: string, input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getDetail(id, this.enrichers());
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.reception.cannotModifyValidated'));
    }
    const destId = input.destLocationId || input.chantierLocationId || current.destLocationId;
    return this.movementApi.update(
      id,
      {
        ...current,
        ...input,
        destLocationId: destId,
        lines: input.lines ?? current.lines,
      },
      this.enrichers(),
    );
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.reception.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventoryTx> {
    return this.movementApi.validate(id, this.enrichers());
  }

  async cancelReception(id: string): Promise<InventoryTx> {
    return this.movementApi.cancel(id, this.enrichers());
  }

  async resetToDraft(id: string): Promise<InventoryTx> {
    const tx = await this.movementApi.getDetail(id);
    if (tx.status !== 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.reception.cannotResetDraft'));
    }
    throw new Error(this.translate.instant('inventory.errors.common.resetDraftFailed'));
  }

  private enrichReception(item: ReceptionListItem): ReceptionListItem {
    let bcId = item.bcId;
    let bcNumero = item.bcNumero;

    if (bcId && !bcNumero) {
      bcNumero = this.bcNumeroById.get(bcId);
    }
    if (!bcNumero) {
      bcNumero = this.parseBcNumeroFromText(item.notes ?? item.reference);
    }
    if (bcNumero && !bcId) {
      for (const [id, numero] of this.bcNumeroById.entries()) {
        if (numero === bcNumero) {
          bcId = id;
          break;
        }
      }
    }

    return bcNumero || bcId ? { ...item, bcId, bcNumero } : item;
  }

  private parseBcNumeroFromText(text?: string): string | undefined {
    if (!text?.trim()) return undefined;
    const match = text.match(/\b(BC-\d{4}-\d+)\b/i);
    return match?.[1]?.toUpperCase();
  }

  private locationName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.locationsCache.find((l) => l.id === id)?.name;
  }

  private fournisseurName(id?: string): string | undefined {
    if (!id) return undefined;
    const lookup = this.lookupsSignal()['fournisseursLookup'] as Array<{ key: string; value: string }> | undefined;
    return lookup?.find((f) => f.key === id)?.value;
  }
}
