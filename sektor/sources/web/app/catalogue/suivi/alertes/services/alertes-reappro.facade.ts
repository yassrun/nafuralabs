import { Injectable, inject, signal, computed } from '@angular/core';

import type { ListResponse, LookupContext } from '@platform/lib/anatomy/types';
import type { AlertUrgency, Location, StockAlert } from '../../../models';
import { InventoryLookupsService } from '../../../services/inventory-lookups.service';
import { StockBalanceEnrichmentService } from '../../../services/stock-balance-enrichment.service';
import { ItemsApiService } from '../../../items/services/item-api.service';

export interface AlertListItem extends StockAlert {}

@Injectable({ providedIn: 'root' })
export class AlertesReapproFacade {
  private readonly stockEnrichment = inject(StockBalanceEnrichmentService);
  private readonly lookupsService = inject(InventoryLookupsService);
  private readonly itemsApi = inject(ItemsApiService);

  private locationsCache: Location[] = [];
  private famillesCache: { id: string; name: string }[] = [];

  private lookupsSignal = signal<LookupContext>({});

  readonly lookups = computed(() => this.lookupsSignal());

  async ensureLookups(): Promise<void> {
    const locations = await this.lookupsService.loadLocations();
    this.locationsCache = locations;

    const balances = await this.stockEnrichment.loadEnrichedBalances();
    const famillesMap = new Map<string, string>();
    for (const b of balances) {
      if (b.familleId && b.familleName) {
        famillesMap.set(b.familleId, b.familleName);
      }
    }
    this.famillesCache = Array.from(famillesMap.entries()).map(([id, name]) => ({ id, name }));

    this.lookupsSignal.set({
      locations: locations.map((l) => ({
        key: l.id,
        value: l.type === 'CHANTIER' && l.projectRef ? `${l.name} (${l.projectRef})` : l.name,
      })),
      familles: this.famillesCache.map((f) => ({ key: f.id, value: f.name })),
      urgences: [
        { key: '', value: 'Tous' },
        { key: 'CRITIQUE', value: 'Critique (stock = 0)' },
        { key: 'EN_ALERTE', value: 'En alerte (stock < min)' },
      ],
    });
  }

  async loadItems(query?: Record<string, unknown>): Promise<ListResponse<AlertListItem>> {
    await this.ensureLookups();
    let alerts = await this.computeAlerts();
    alerts = this.applyFilters(alerts, query);

    const page = Number(query?.['page'] ?? 1);
    const pageSize = Number(query?.['pageSize'] ?? 20);
    const total = alerts.length;
    const start = (page - 1) * pageSize;
    const slice = alerts.slice(start, start + pageSize);

    return { items: slice, total };
  }

  async updateStockMin(articleId: string, stockMin: number): Promise<void> {
    await this.itemsApi.update(articleId, { stockMin });
  }

  private async computeAlerts(): Promise<StockAlert[]> {
    const balances = await this.stockEnrichment.loadEnrichedBalances();
    const byArticle = new Map<string, typeof balances>();
    for (const b of balances) {
      const list = byArticle.get(b.articleId) ?? [];
      list.push(b);
      byArticle.set(b.articleId, list);
    }

    const alerts: StockAlert[] = [];
    for (const [articleId, rows] of byArticle) {
      const sample = rows[0];
      const minQty = sample.stockMin;
      if (minQty == null || minQty <= 0) continue;
      const currentQty = rows.reduce(
        (sum, r) => sum + (r.availableQuantity ?? r.quantity ?? 0),
        0,
      );
      if (currentQty >= minQty) continue;

      const urgency: AlertUrgency = currentQty <= 0 ? 'CRITIQUE' : 'EN_ALERTE';
      alerts.push({
        id: articleId,
        articleId,
        articleCode: sample.articleCode,
        articleName: sample.articleName,
        familleId: sample.familleId,
        familleName: sample.familleName,
        locationId: sample.locationId,
        locationName: `${rows.length} emplacement(s)`,
        locationType: sample.locationType,
        currentQty,
        minQty,
        shortage: minQty - currentQty,
        urgency,
        lastReceptionDate: sample.lastCountDate,
      });
    }

    return alerts.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency === 'CRITIQUE' ? -1 : 1;
      }
      return b.shortage - a.shortage;
    });
  }

  private applyFilters(alerts: StockAlert[], query?: Record<string, unknown>): StockAlert[] {
    let result = alerts;
    const locationId = query?.['locationId'] as string | undefined;
    const familleId = query?.['familleId'] as string | undefined;
    const urgency = query?.['urgency'] as string | undefined;

    if (locationId) {
      result = result.filter((a) => a.locationId === locationId);
    }
    if (familleId) {
      result = result.filter((a) => a.familleId === familleId);
    }
    if (urgency) {
      result = result.filter((a) => a.urgency === urgency);
    }
    return result;
  }
}
