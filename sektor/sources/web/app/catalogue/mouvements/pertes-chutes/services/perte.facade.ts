import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { CrudStyleFacade } from '@platform/lib/anatomy';
import type { ListResponse, LookupContext } from '@platform/lib/anatomy/types';
import type { InventoryTx, InventoryTxLine, Location, MotifMouvement } from '../../../models';
import { InventoryLookupsService } from '../../../services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../services/inventory-movement-api.service';
import {
  loadMovementPage,
  sumLineTotals,
} from '../../../services/movement-facade.util';
import type { ApiInventoryTxRow } from '../../../services/inventory-tx.mapper';
import { MotifsApiService } from '../../../services/motifs-api.service';

export type CauseDetaillee = 'DECOUPE' | 'CASSE' | 'DETERIORATION' | 'AUTRE';

export interface PerteLine extends InventoryTxLine {
  causeDetaillee?: CauseDetaillee;
}

export interface PerteListItem extends InventoryTx {
  totalValue: number;
}

@Injectable({ providedIn: 'root' })
export class PerteFacade implements CrudStyleFacade<InventoryTx, Partial<InventoryTx>> {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly lookupsService = inject(InventoryLookupsService);
  private readonly motifsApi = inject(MotifsApiService);

  private readonly locationById = new Map<string, Location>();
  private motifsCache: MotifMouvement[] = [];

  private lookupsSignal = signal<LookupContext>({});
  private readonly translate = inject(TranslateService);

  readonly lookups = computed(() => this.lookupsSignal());

  private enrichers() {
    return {
      locationName: (id?: string) => this.locationName(id),
      motifName: (id?: string) => this.motifName(id),
    };
  }

  async ensureLookups(): Promise<void> {
    const motifs = await this.motifsApi.listByTxType('PERTE');
    this.motifsCache = motifs;
    this.lookupsSignal.set({
      chantierLocations: [],
      motifsPerte: motifs.map((m) => ({ key: m.id, value: m.name })),
      causeDetaillee: [
        { key: 'DECOUPE', value: 'Chute découpe' },
        { key: 'CASSE', value: 'Casse' },
        { key: 'DETERIORATION', value: 'Détérioration' },
        { key: 'AUTRE', value: 'Autre' },
      ],
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<PerteListItem>> {
    await this.ensureLookups();
    const page = await loadMovementPage(
      this.movementApi,
      'PERTE',
      query,
      (rows) => this.applyFilters(rows, query),
      (tx) => ({ ...tx, totalValue: sumLineTotals(tx.lines) }),
      this.enrichers(),
    );
    await Promise.all(page.items.map((tx) => this.cacheLocation(tx.chantierLocationId)));
    return {
      ...page,
      items: page.items.map((tx) => ({
        ...tx,
        chantierRef: this.chantierRef(tx.chantierLocationId) ?? tx.chantierRef,
      })),
    };
  }

  private applyFilters(rows: ApiInventoryTxRow[], query?: Record<string, unknown>): ApiInventoryTxRow[] {
    if (!query) return rows;
    let out = [...rows];

    const status = query['status'] as string | undefined;
    if (status) {
      out = out.filter((r) => r.status === status);
    }

    const chantierLocationId = query['chantierLocationId'] as string | undefined;
    if (chantierLocationId) {
      out = out.filter((r) => r.chantierLocationId === chantierLocationId);
    }

    const motifId = query['motifId'] as string | undefined;
    if (motifId) {
      out = out.filter((r) => r.motifId === motifId);
    }

    const dateFrom = query['dateFrom'] as string | undefined;
    const dateTo = query['dateTo'] as string | undefined;
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
    const tx = await this.movementApi.getDetail(id, this.enrichers());
    await this.cacheLocation(tx.chantierLocationId);
    return this.withChantierMeta(tx);
  }

  async createItem(input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const merged = await this.applyChantierMeta(input);
    const created = await this.movementApi.create(
      {
        ...merged,
        txType: 'PERTE',
        txDate: merged.txDate ?? new Date().toISOString().slice(0, 10),
        status: 'BROUILLON',
        lines: merged.lines ?? [],
      },
      this.enrichers(),
    );
    await this.cacheLocation(created.chantierLocationId);
    return this.withChantierMeta(created);
  }

  async updateItem(id: string, input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getDetail(id, this.enrichers());
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.perte.cannotModifyValidated'));
    }
    const merged = await this.applyChantierMeta({ ...current, ...input });
    const updated = await this.movementApi.update(
      id,
      { ...merged, lines: input.lines ?? current.lines },
      this.enrichers(),
    );
    await this.cacheLocation(updated.chantierLocationId);
    return this.withChantierMeta(updated);
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.perte.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventoryTx> {
    const updated = await this.movementApi.validate(id, this.enrichers());
    await this.cacheLocation(updated.chantierLocationId);
    return this.withChantierMeta(updated);
  }

  async getKpis(): Promise<{ totalMonth: number; totalChantier: number }> {
    await this.ensureLookups();
    const headers = await this.movementApi.listHeadersByType('PERTE', { pageSize: 500 });
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalMonth = 0;
    let totalChantier = 0;
    for (const row of headers) {
      const tx = await this.movementApi.getDetail(row.id, this.enrichers());
      const val = sumLineTotals(tx.lines);
      if (tx.txDate.startsWith(monthStr)) {
        totalMonth += val;
      }
      totalChantier += val;
    }

    return { totalMonth, totalChantier };
  }

  private async applyChantierMeta(tx: Partial<InventoryTx>): Promise<Partial<InventoryTx>> {
    const cid = tx.chantierLocationId;
    if (!cid) {
      return tx;
    }
    await this.cacheLocation(cid);
    const chantierRef = this.chantierRef(cid) ?? tx.chantierRef;
    return { ...tx, chantierRef };
  }

  private withChantierMeta(tx: InventoryTx): InventoryTx {
    const ref = this.chantierRef(tx.chantierLocationId) ?? tx.chantierRef;
    return ref === tx.chantierRef ? tx : { ...tx, chantierRef: ref };
  }

  private async cacheLocation(id?: string): Promise<void> {
    const trimmed = id?.trim();
    if (!trimmed || this.locationById.has(trimmed)) return;
    const loc = await this.lookupsService.resolveLocation(trimmed);
    if (loc) {
      this.locationById.set(trimmed, loc);
    }
  }

  private chantierRef(id?: string): string | undefined {
    const loc = id ? this.locationById.get(id) : undefined;
    if (!loc) return undefined;
    return loc.projectRef ? `${loc.name} (${loc.projectRef})` : loc.name;
  }

  private locationName(id?: string): string | undefined {
    return this.chantierRef(id);
  }

  private motifName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.motifsCache.find((m) => m.id === id)?.name;
  }
}
