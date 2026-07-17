import { Injectable, inject } from '@angular/core';

import type { ArticleType } from '@applications/erp/inventory/models';
import type { ArticleCreate } from '@applications/erp/pages/inventory/catalogue/articles/models';
import { ArticlesApiService } from '@applications/erp/pages/inventory/catalogue/articles/services/article-api.service';
import { ItemCategoriesApiService } from '@applications/erp/pages/inventory/configuration/item-categories/services/item-category-api.service';
import { UnitOfMeasuresApiService } from '@applications/erp/pages/inventory/configuration/unit-of-measures/services/unit-of-measure-api.service';
import type { ExtractionDefinition } from '@platform/features/documents/smart-import';
import { normalizeText, toNumber } from '../../utils/extraction-json.utils';

import { ARTICLE_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import {
  extractionRows,
  persistUniqueRows,
  type ApplicationImportResult,
} from '../services/application-import.util';

const ARTICLE_TYPES: ArticleType[] = ['MATERIAU', 'CONSOMMABLE', 'ENGIN', 'OUTILLAGE'];
const schema = ARTICLE_EXTRACTION_SCHEMA;
const dedupeKey = (row: Record<string, unknown>): string | null => {
  const code = row['code'];
  return code && String(code).trim() ? String(code).trim() : null;
};

export const ARTICLE_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'article',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  dedupeKey,
};

@Injectable({ providedIn: 'root' })
export class ArticleImportService {
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

  async import(data: Record<string, unknown>): Promise<ApplicationImportResult> {
    await this.ensureLookups();
    const existing = await this.api.getAll({ page: 0, pageSize: 500 });
    const keys = new Set(
      existing.items
        .map((article) => article.code?.trim())
        .filter((code): code is string => !!code)
        .map(normalizeText),
    );
    return persistUniqueRows(
      extractionRows(data, schema.arrayPath!),
      keys,
      dedupeKey,
      (row): ArticleCreate => {
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
      (payload) => this.api.create(payload),
    );
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
