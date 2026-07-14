import { Injectable, inject } from '@angular/core';

import type { ArticleType } from '@applications/erp/inventory/models';
import type { ArticleCreate } from '@applications/erp/pages/inventory/catalogue/articles/models';
import { ArticlesApiService } from '@applications/erp/pages/inventory/catalogue/articles/services/article-api.service';
import { ItemCategoriesApiService } from '@applications/erp/pages/inventory/configuration/item-categories/services/item-category-api.service';
import { UnitOfMeasuresApiService } from '@applications/erp/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';
import { normalizeText, toNumber } from '../../utils/extraction-json.utils';

import { ARTICLE_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { ImportHandlerRegistry } from '../services/import-handler.registry';

const ARTICLE_TYPES: ArticleType[] = ['MATERIAU', 'CONSOMMABLE', 'ENGIN', 'OUTILLAGE'];

@Injectable({ providedIn: 'root' })
export class ArticleImportHandlerRegistrar {
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly api = inject(ArticlesApiService);
  private readonly categoriesApi = inject(ItemCategoriesApiService);
  private readonly uomApi = inject(UnitOfMeasuresApiService);

  private uomByCode = new Map<string, string>();
  private uomByName = new Map<string, string>();
  private defaultUomId = '';
  private familleByName = new Map<string, string>();
  private familleByCode = new Map<string, string>();
  private defaultFamilleId = '';
  private lookupsReady = false;

  constructor() {
    this.register();
  }

  private register(): void {
    const schema = ARTICLE_EXTRACTION_SCHEMA;
    this.registry.register<ArticleCreate>({
      entityKey: 'article',
      dataSchema: schema.dataSchema,
      presentationSchema: schema.presentationSchema,
      instructions: schema.instructions,
      schemaName: schema.name,
      schemaDescription: schema.description,
      arrayPath: schema.arrayPath!,
      mapRowToPayload: (row: Record<string, unknown>) => {
        const uomCode = row['uomCode'] ? String(row['uomCode']).trim() : '';
        const familleName = row['familleName'] ? String(row['familleName']).trim() : '';
        const uomId =
          (uomCode && (this.uomByCode.get(normalizeText(uomCode)) || this.uomByName.get(normalizeText(uomCode))))
          || this.defaultUomId;
        const familleId =
          (familleName && (
            this.familleByName.get(normalizeText(familleName))
            || this.familleByCode.get(normalizeText(familleName))
          ))
          || this.defaultFamilleId;

        return {
          code: String(row['code'] ?? '').trim(),
          name: String(row['name'] ?? '').trim(),
          articleType: this.parseType(row['articleType']),
          familleId,
          typeArticleId: '',
          uomId,
          prixUnitaire: row['prixUnitaire'] != null ? toNumber(row['prixUnitaire']) : undefined,
          stockMin: row['stockMin'] != null ? toNumber(row['stockMin']) : undefined,
          devise: 'MAD',
          isActive: true,
        };
      },
      create: async (payload: ArticleCreate) => {
        await this.ensureLookups();
        if (!payload.uomId) {
          payload = { ...payload, uomId: this.defaultUomId };
        }
        if (!payload.familleId) {
          payload = { ...payload, familleId: this.defaultFamilleId };
        }
        return this.api.create(payload);
      },
      dedupeKey: (row: Record<string, unknown>) => {
        const code = row['code'];
        return code && String(code).trim() ? String(code).trim() : null;
      },
      loadExistingKeys: async () => {
        await this.ensureLookups();
        const res = await this.api.getAll({ page: 0, pageSize: 500 });
        const keys = new Set<string>();
        for (const a of res.items) {
          if (a.code?.trim()) {
            keys.add(normalizeText(a.code));
          }
        }
        return keys;
      },
    });
  }

  private parseType(value: unknown): ArticleType {
    const raw = String(value ?? '').trim().toUpperCase();
    return ARTICLE_TYPES.find((t) => t === raw) ?? 'MATERIAU';
  }

  private async ensureLookups(): Promise<void> {
    if (this.lookupsReady) {
      return;
    }
    const [categories, uoms] = await Promise.all([
      this.categoriesApi.getAll({ page: 0, pageSize: 500 }),
      this.uomApi.getAll({ page: 0, pageSize: 500 }),
    ]);

    this.familleByName.clear();
    this.familleByCode.clear();
    for (const c of categories.items) {
      if (c.name) this.familleByName.set(normalizeText(c.name), c.id);
      if (c.code) this.familleByCode.set(normalizeText(c.code), c.id);
      if (!this.defaultFamilleId) this.defaultFamilleId = c.id;
    }

    this.uomByCode.clear();
    this.uomByName.clear();
    for (const u of uoms.items) {
      if (u.isActive === false) continue;
      if (u.code) this.uomByCode.set(normalizeText(u.code), u.id);
      if (u.name) this.uomByName.set(normalizeText(u.name), u.id);
      if (!this.defaultUomId) this.defaultUomId = u.id;
    }

    this.lookupsReady = true;
  }
}
