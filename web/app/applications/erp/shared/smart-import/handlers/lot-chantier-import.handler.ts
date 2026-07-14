import { Injectable, inject } from '@angular/core';

import type { LotChantier, PosteBudgetaire } from '@applications/erp/chantiers/models';
import { ChantierLotApiService } from '@applications/erp/pages/chantiers/services/chantier-lot-api.service';
import { PosteBudgetaireApiService } from '@applications/erp/pages/chantiers/services/poste-budgetaire-api.service';
import { buildBpdeSousLotCode } from '@applications/erp/pages/chantiers/utils/bpde-lot-import.util';
import { LOT_CHANTIER_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { normalizeText } from '../../utils/extraction-json.utils';
import { ImportHandlerRegistry } from '../services/import-handler.registry';

type NestedPoste = {
  code: string;
  designation: string;
  unite?: string;
  quantite?: number;
  prixUnitaireHt?: number;
  montantHt?: number;
};

type NestedSousLot = {
  code?: string;
  designation: string;
  postes?: NestedPoste[];
};

type NestedLotPayload = {
  code: string;
  designation: string;
  sousLots?: NestedSousLot[];
  postes?: NestedPoste[];
  ordre: number;
};

function asTrimmedString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function asNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item),
  );
}

function mapPoste(row: Record<string, unknown>): NestedPoste | null {
  const code = asTrimmedString(row['code']);
  const designation = asTrimmedString(row['designation']);
  if (!code || !designation) return null;
  const quantite = asNumber(row['quantite']);
  const prixUnitaireHt = asNumber(row['prixUnitaireHt']);
  const montantHt =
    quantite != null && prixUnitaireHt != null
      ? Math.round(quantite * prixUnitaireHt * 100) / 100
      : undefined;
  return {
    code,
    designation,
    unite: asTrimmedString(row['unite']),
    quantite,
    prixUnitaireHt,
    montantHt,
  };
}

@Injectable({ providedIn: 'root' })
export class LotChantierImportHandlerRegistrar {
  private readonly registry = inject(ImportHandlerRegistry);
  private readonly lotApi = inject(ChantierLotApiService);
  private readonly posteApi = inject(PosteBudgetaireApiService);
  private chantierId: string | null = null;
  private nextOrdre = 1;
  private existingLotCodes = new Set<string>();
  private existingPosteCodesByLot = new Map<string, Set<string>>();

  /** Bind the handler to the active chantier before opening Magic Import. */
  bind(chantierId: string): void {
    this.chantierId = chantierId;
    this.register();
  }

  private register(): void {
    const schema = LOT_CHANTIER_EXTRACTION_SCHEMA;
    this.registry.register<NestedLotPayload>({
      entityKey: 'lot-chantier',
      dataSchema: schema.dataSchema,
      presentationSchema: schema.presentationSchema,
      instructions: schema.instructions,
      schemaName: schema.name,
      schemaDescription: schema.description,
      arrayPath: schema.arrayPath!,
      config: { concurrency: 1 },
      mapRowToPayload: (row: Record<string, unknown>) => {
        const postes = asObjectArray(row['postes'])
          .map((item) => mapPoste(item))
          .filter((item): item is NestedPoste => !!item);
        const sousLots: NestedSousLot[] = [];
        for (const item of asObjectArray(row['sousLots'])) {
          const designation = asTrimmedString(item['designation']);
          if (!designation) continue;
          sousLots.push({
            code: asTrimmedString(item['code']),
            designation,
            postes: asObjectArray(item['postes'])
              .map((poste) => mapPoste(poste))
              .filter((poste): poste is NestedPoste => !!poste),
          });
        }

        return {
          code: asTrimmedString(row['code']) ?? '',
          designation: asTrimmedString(row['designation']) ?? '',
          postes,
          sousLots,
          ordre: this.nextOrdre++,
        };
      },
      create: async (payload: NestedLotPayload) => {
        const chantierId = this.chantierId;
        if (!chantierId) {
          throw new Error('CHANTIER_CONTEXT_MISSING');
        }
        return this.createLotTree(chantierId, payload);
      },
      dedupeKey: (row: Record<string, unknown>) => asTrimmedString(row['code']) ?? null,
      formatRowLabel: (row: Record<string, unknown>, rowIndex: number) => {
        const code = asTrimmedString(row['code']);
        const designation = asTrimmedString(row['designation']);
        const postes = asObjectArray(row['postes']).length;
        const sousLots = asObjectArray(row['sousLots']).length;
        const nestedHint =
          postes + sousLots > 0 ? ` · ${sousLots} sous-lot(s), ${postes} poste(s)` : '';
        if (code && designation) return `${code} — ${designation}${nestedHint}`;
        return code ?? designation ?? `#${rowIndex + 1}`;
      },
      loadExistingKeys: async () => {
        const chantierId = this.chantierId;
        this.existingLotCodes = new Set();
        this.existingPosteCodesByLot = new Map();
        if (!chantierId) return new Set<string>();

        const lots = await this.lotApi.listByChantier(chantierId);
        this.nextOrdre = lots.length + 1;
        const keys = new Set<string>();
        for (const lot of lots) {
          if (lot.code?.trim()) {
            const key = normalizeText(lot.code);
            keys.add(key);
            this.existingLotCodes.add(key);
          }
        }
        await Promise.all(
          lots.map(async (lot) => {
            const postes = await this.posteApi.listByLot(lot.id);
            this.existingPosteCodesByLot.set(
              lot.id,
              new Set(postes.map((poste) => normalizeText(poste.code))),
            );
          }),
        );
        return keys;
      },
    });
  }

  private async createLotTree(chantierId: string, payload: NestedLotPayload): Promise<LotChantier> {
    const root = await this.resolveOrCreateLot(chantierId, {
      code: payload.code,
      designation: payload.designation,
      ordre: payload.ordre,
      avancementPercent: 0,
    });

    let posteOrdre = 1;
    for (const poste of payload.postes ?? []) {
      await this.createPosteIfNew(root.id, poste, posteOrdre++);
    }

    let sousOrdre = payload.ordre;
    for (const sousLot of payload.sousLots ?? []) {
      sousOrdre += 1;
      const sousCode =
        sousLot.code?.trim() ||
        buildBpdeSousLotCode(
          payload.code,
          { code: sousLot.code, designation: sousLot.designation, postes: [] },
          sousOrdre,
        );
      const child = await this.resolveOrCreateLot(chantierId, {
        code: sousCode,
        designation: sousLot.designation,
        parentLotId: root.id,
        ordre: sousOrdre,
        avancementPercent: 0,
      });
      for (const poste of sousLot.postes ?? []) {
        await this.createPosteIfNew(child.id, poste, posteOrdre++);
      }
    }

    return root;
  }

  private async resolveOrCreateLot(
    chantierId: string,
    data: Partial<LotChantier>,
  ): Promise<LotChantier> {
    const code = data.code?.trim() ?? '';
    const key = normalizeText(code);
    if (key && this.existingLotCodes.has(key)) {
      const existing = (await this.lotApi.listByChantier(chantierId)).find(
        (lot) => normalizeText(lot.code) === key,
      );
      if (existing) return existing;
    }
    const created = await this.lotApi.createForChantier(chantierId, data);
    if (key) this.existingLotCodes.add(key);
    return created;
  }

  private async createPosteIfNew(
    lotId: string,
    poste: NestedPoste,
    ordre: number,
  ): Promise<PosteBudgetaire | null> {
    const key = normalizeText(poste.code);
    const existing = this.existingPosteCodesByLot.get(lotId) ?? new Set<string>();
    if (existing.has(key)) return null;
    const created = await this.posteApi.createForLot(lotId, { ...poste, ordre });
    existing.add(key);
    this.existingPosteCodesByLot.set(lotId, existing);
    return created;
  }
}
