import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { CrudStyleFacade } from '@lib/anatomy';
import type { ListResponse, LookupContext } from '@lib/anatomy/types';
import type { Article, InventoryTx, Location, MotifMouvement } from '../../../../../inventory/models';
import { ArticleCatalogService } from '../../../../../inventory/services/article-catalog.service';
import { InventoryLookupsService } from '../../../../../inventory/services/inventory-lookups.service';
import { InventoryMovementApiService } from '../../../../../inventory/services/inventory-movement-api.service';
import {
  loadMovementPage,
  sumLineTotals,
} from '../../../../../inventory/services/movement-facade.util';
import type { ApiInventoryTxRow } from '../../../../../inventory/services/inventory-tx.mapper';
import { MotifsApiService } from '../../../../../inventory/services/motifs-api.service';
import { ReservationStockService } from '../../../../../inventory/services/reservation-stock.service';
import { BudgetFacade } from '@applications/erp/pages/chantiers/budget/services';
import { InventoryTxesFacade } from '../../inventory-txes/services/inventory-tx.facade';

export interface SortieListItem extends InventoryTx {
  totalValue: number;
}

@Injectable({ providedIn: 'root' })
export class SortieFacade implements CrudStyleFacade<InventoryTx, Partial<InventoryTx>> {
  private readonly movementApi = inject(InventoryMovementApiService);
  private readonly lookupsService = inject(InventoryLookupsService);
  private readonly articleCatalog = inject(ArticleCatalogService);
  private readonly motifsApi = inject(MotifsApiService);
  private readonly budgetFacade = inject(BudgetFacade);
  private readonly inventoryTxes = inject(InventoryTxesFacade);
  private readonly reservations = inject(ReservationStockService);
  private readonly translate = inject(TranslateService);

  private locationsCache: Location[] = [];
  private motifsCache: MotifMouvement[] = [];
  private articlesCache: Article[] = [];

  private lookupsSignal = signal<LookupContext>({});

  readonly lookups = computed(() => this.lookupsSignal());

  private enrichers() {
    return {
      locationName: (id?: string) => this.locationName(id),
      motifName: (id?: string) => this.motifName(id),
    };
  }

  async ensureLookups(): Promise<void> {
    const [, locations, articles, motifs] = await Promise.all([
      this.budgetFacade.loadListingFromApi(),
      this.lookupsService.loadLocations(),
      this.articleCatalog.loadArticles({ activeOnly: true }),
      this.motifsApi.listByTxType('SORTIE'),
    ]);
    this.locationsCache = locations;
    this.motifsCache = motifs;
    this.articlesCache = articles;
    const sources = locations.filter((l) => l.isActive !== false);
    const matCons = articles.filter(
      (a) => a.articleType === 'MATERIAU' || a.articleType === 'CONSOMMABLE',
    );
    const budgets = this.budgetFacade.budgets();
    this.lookupsSignal.set({
      sourceLocations: sources.map((l) => ({
        key: l.id,
        value: `${l.code} — ${l.name}`,
      })),
      chantiersBudget: budgets.map((b) => ({
        key: b.id,
        value: `${b.code} — ${b.name}`,
      })),
      articlesMatCons: matCons.map((a) => ({
        key: a.id,
        value: `${a.code} — ${a.name}`,
        data: { uomCode: a.uomCode, uomId: a.uomId, prix: a.pmp ?? a.prixUnitaire },
      })),
      motifsSortie: motifs.map((m) => ({ key: m.id, value: `${m.code} — ${m.name}` })),
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<SortieListItem>> {
    await this.ensureLookups();

    const articleId = query?.['articleId'] as string | undefined;
    if (articleId?.trim()) {
      const headers = await this.movementApi.listHeadersByType('SORTIE', { pageSize: 500 });
      const all = await Promise.all(
        headers.map((h) => this.movementApi.getDetail(h.id, this.enrichers())),
      );
      let rows = this.applyFiltersOnTx(all, query);
      const page = Number(query?.['page'] ?? 1);
      const pageSize = Number(query?.['pageSize'] ?? 20);
      const total = rows.length;
      const slice = rows.slice((page - 1) * pageSize, page * pageSize);
      return {
        items: slice.map((tx) => ({ ...tx, totalValue: sumLineTotals(tx.lines) })),
        total,
      };
    }

    return loadMovementPage(
      this.movementApi,
      'SORTIE',
      query,
      (rows) => this.applyHeaderFilters(rows, query),
      (tx) => ({ ...tx, totalValue: sumLineTotals(tx.lines) }),
      this.enrichers(),
    );
  }

  private applyHeaderFilters(rows: ApiInventoryTxRow[], query?: Record<string, unknown>): ApiInventoryTxRow[] {
    if (!query) return rows;
    let out = [...rows];

    const status = query['status'] as string | undefined;
    if (status) {
      out = out.filter((r) => r.status === status);
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

    const chantierBudgetId = query['chantierBudgetId'] as string | undefined;
    if (chantierBudgetId?.trim()) {
      out = out.filter((r) => r.chantierBudgetId === chantierBudgetId.trim());
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

  private applyFiltersOnTx(rows: InventoryTx[], query?: Record<string, unknown>): InventoryTx[] {
    const headers = rows.map((tx) => ({
      id: tx.id,
      txNumber: tx.txNumber,
      txType: tx.txType,
      warehouseId: '',
      txDate: tx.txDate,
      reference: tx.reference,
      status: tx.status,
      motifId: tx.motifId,
      chantierBudgetId: tx.chantierBudgetId,
      chantierRef: tx.chantierRef,
    })) as ApiInventoryTxRow[];

    const filteredIds = new Set(this.applyHeaderFilters(headers, query).map((h) => h.id));
    let out = rows.filter((r) => filteredIds.has(r.id));

    const chantierContains = query?.['chantierContains'] as string | undefined;
    if (chantierContains?.trim()) {
      const q = chantierContains.trim().toLowerCase();
      out = out.filter((r) => (r.chantierRef ?? '').toLowerCase().includes(q));
    }

    const articleId = query?.['articleId'] as string | undefined;
    if (articleId?.trim()) {
      const aid = articleId.trim();
      out = out.filter((r) => r.lines.some((l) => l.articleId === aid));
    }

    return out;
  }

  async getItem(id: string): Promise<InventoryTx> {
    await this.ensureLookups();
    const tx = await this.movementApi.getDetail(id, this.enrichers());
    if (tx.txType !== 'SORTIE') {
      throw new Error(this.translate.instant('inventory.errors.sortie.notFound'));
    }
    return tx;
  }

  async createItem(input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const merged = this.applySourceMeta(this.applyBudgetMeta(input));
    return this.movementApi.create(
      {
        ...merged,
        txType: 'SORTIE',
        txDate: merged.txDate ?? new Date().toISOString().slice(0, 10),
        status: 'BROUILLON',
        lines: merged.lines ?? [],
      },
      this.enrichers(),
    );
  }

  async updateItem(id: string, input: Partial<InventoryTx>): Promise<InventoryTx> {
    await this.ensureLookups();
    const current = await this.movementApi.getDetail(id, this.enrichers());
    if (current.txType !== 'SORTIE') {
      throw new Error(this.translate.instant('inventory.errors.sortie.notFound'));
    }
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.sortie.cannotModifyValidated'));
    }
    const merged = this.applySourceMeta(this.applyBudgetMeta({ ...current, ...input }));
    return this.movementApi.update(
      id,
      { ...merged, lines: input.lines ?? current.lines },
      this.enrichers(),
    );
  }

  async deleteItem(id: string): Promise<void> {
    const current = await this.movementApi.getDetail(id);
    if (current.status === 'VALIDE') {
      throw new Error(this.translate.instant('inventory.errors.sortie.cannotDeleteValidated'));
    }
    await this.movementApi.delete(id);
  }

  async validate(id: string): Promise<InventoryTx> {
    await this.ensureLookups();
    const before = await this.movementApi.getDetail(id, this.enrichers());
    if (before.txType !== 'SORTIE') {
      throw new Error(this.translate.instant('inventory.errors.sortie.notFound'));
    }
    const updated = await this.movementApi.validate(id, this.enrichers());

    if (updated.chantierBudgetId && updated.lines.length > 0) {
      await this.reservations.consumeFifoForChantier(
        updated.chantierBudgetId,
        updated.lines.map((l) => ({ articleId: l.articleId, qte: l.quantity })),
      );
      const lines = updated.lines.map((l) => {
        const art = this.articlesCache.find((a) => a.id === l.articleId);
        const prixUnitaireHt = l.unitPrice ?? art?.pmp ?? art?.prixUnitaire ?? 0;
        return {
          articleId: l.articleId,
          articleCode: l.articleCode,
          articleLabel: l.articleName,
          unite: l.uomCode,
          qte: l.quantity,
          prixUnitaireHt,
          rubrique: art?.posteBudgetId,
        };
      });
      this.inventoryTxes.validateChantierOutflow({
        txId: updated.id,
        txNumber: updated.txNumber,
        chantierId: updated.chantierBudgetId,
        lines,
      });
    }
    return updated;
  }

  async getKpis(): Promise<{ totalMonth: number; totalValide: number }> {
    await this.ensureLookups();
    const headers = await this.movementApi.listHeadersByType('SORTIE', { pageSize: 500 });
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalMonth = 0;
    let totalValide = 0;
    for (const row of headers) {
      if (!row.txDate.startsWith(monthStr) && row.status !== 'VALIDE') {
        continue;
      }
      const tx = await this.movementApi.getDetail(row.id, this.enrichers());
      const val = sumLineTotals(tx.lines);
      if (tx.txDate.startsWith(monthStr)) {
        totalMonth += val;
      }
      if (tx.status === 'VALIDE') {
        totalValide += val;
      }
    }

    return { totalMonth, totalValide };
  }

  private applyBudgetMeta(tx: Partial<InventoryTx>): Partial<InventoryTx> {
    const bid = tx.chantierBudgetId;
    if (!bid) return tx;
    const b = this.budgetFacade.getBudgetById(bid);
    const chantierRef = b ? `${b.code} — ${b.name}` : tx.chantierRef;
    return { ...tx, chantierRef };
  }

  private applySourceMeta(tx: Partial<InventoryTx>): Partial<InventoryTx> {
    const sid = tx.sourceLocationId;
    if (!sid) {
      return tx;
    }
    const loc = this.locationsCache.find((l) => l.id === sid);
    const sourceLocationName = loc ? loc.name : tx.sourceLocationName;
    return { ...tx, sourceLocationName };
  }

  private locationName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.locationsCache.find((l) => l.id === id)?.name;
  }

  private motifName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.motifsCache.find((m) => m.id === id)?.name;
  }
}
