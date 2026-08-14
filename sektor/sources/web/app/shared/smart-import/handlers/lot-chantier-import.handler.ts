import { Injectable, inject } from '@angular/core';

import {
  ChantierLotApiService,
  type ChantierLotTreeNodeInput,
  type ChantierLotTreePosteInput,
} from '@app/pages/chantiers/services/chantier-lot-api.service';
import type { ExtractionDefinition } from '@platform/features/documents/smart-import';
import { LOT_CHANTIER_EXTRACTION_SCHEMA } from '../../extraction-schemas';
import { normalizeText } from '../../utils/extraction-json.utils';
import {
  extractionRows,
  type ApplicationImportResult,
} from '../services/application-import.util';

type NestedPoste = ChantierLotTreePosteInput;

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
  const designation = asTrimmedString(row['designation']);
  if (!designation) return null;
  const quantite = asNumber(row['quantite']);
  const prixUnitaireHt = asNumber(row['prixUnitaireHt']);
  const montantHt =
    quantite != null && prixUnitaireHt != null
      ? Math.round(quantite * prixUnitaireHt * 100) / 100
      : undefined;
  return {
    designation,
    unite: asTrimmedString(row['unite']),
    quantite,
    prixUnitaireHt,
    montantHt,
  };
}

/** Map extraction node: prefer `children`, fall back to legacy `sousLots`. */
function mapLotNode(row: Record<string, unknown>, depth: number): ChantierLotTreeNodeInput | null {
  const designation = asTrimmedString(row['designation']);
  if (!designation) return null;

  const postes = asObjectArray(row['postes'])
    .map((item) => mapPoste(item))
    .filter((item): item is NestedPoste => !!item);

  const nestedSource = asObjectArray(row['children']).length
    ? asObjectArray(row['children'])
    : asObjectArray(row['sousLots']);

  // Max lot depth is 2 (0..2); do not map deeper children from extraction.
  const children =
    depth < 2
      ? nestedSource
          .map((item) => mapLotNode(item, depth + 1))
          .filter((item): item is ChantierLotTreeNodeInput => !!item)
      : [];

  return { designation, children, postes };
}

function countNested(node: ChantierLotTreeNodeInput): { children: number; postes: number } {
  let children = node.children?.length ?? 0;
  let postes = node.postes?.length ?? 0;
  for (const child of node.children ?? []) {
    const nested = countNested(child);
    children += nested.children;
    postes += nested.postes;
  }
  return { children, postes };
}

const schema = LOT_CHANTIER_EXTRACTION_SCHEMA;
const dedupeKey = (row: Record<string, unknown>): string | null => {
  const designation = asTrimmedString(row['designation']);
  return nominalDesignationKey(designation);
};

export const LOT_CHANTIER_IMPORT_DEFINITION: ExtractionDefinition = {
  key: 'lot-chantier',
  name: schema.name,
  description: schema.description,
  dataSchema: schema.dataSchema,
  presentationSchema: schema.presentationSchema,
  instructions: schema.instructions,
  arrayPath: schema.arrayPath!,
  dedupeKey,
  formatRowLabel: (row, rowIndex) => {
    const designation = asTrimmedString(row['designation']);
    const node = mapLotNode(row, 0);
    const counts = node ? countNested(node) : { children: 0, postes: 0 };
    const nestedHint =
      counts.children + counts.postes > 0
        ? ` · ${counts.children} sous-lot(s), ${counts.postes} poste(s)`
        : '';
    return designation ? `${designation}${nestedHint}` : `#${rowIndex + 1}`;
  },
};

@Injectable({ providedIn: 'root' })
export class LotChantierImportService {
  private readonly lotApi = inject(ChantierLotApiService);

  async import(
    chantierId: string,
    data: Record<string, unknown>,
  ): Promise<ApplicationImportResult> {
    const existingLots = await this.lotApi.listByChantier(chantierId);
    const existingKeys = new Set(
      existingLots
        .filter((lot) => !lot.parentLotId)
        .map((lot) => normalizeText(lot.designation)),
    );
    const result: ApplicationImportResult = { created: 0, skippedDuplicates: 0 };

    for (const row of extractionRows(data, schema.arrayPath!)) {
      const key = dedupeKey(row);
      if (key && existingKeys.has(normalizeText(key))) {
        result.skippedDuplicates++;
        continue;
      }
      const node = mapLotNode(row, 0);
      if (!node) continue;
      const response = await this.lotApi.createTree(chantierId, {
          lots: [
            {
              designation: node.designation,
              children: node.children,
              postes: node.postes,
            },
          ],
        });
      if (!response.lots[0]) throw new Error('LOT_TREE_CREATE_EMPTY');
      if (key) existingKeys.add(normalizeText(key));
      result.created++;
    }

    return result;
  }
}

function nominalDesignationKey(designation: string | undefined): string | null {
  return designation ? normalizeText(designation) : null;
}
