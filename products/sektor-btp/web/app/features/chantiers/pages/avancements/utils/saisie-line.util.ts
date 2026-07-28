import type { PosteBudgetaire } from '@app/features/chantiers/models';
import type { AvancementListItem, LotChantier, PosteSaisieContext, SaisieLineDefinition } from '../models';

export function saisieLineKey(kind: 'poste' | 'lot', id: string): string {
  return `${kind}:${id}`;
}

export function parseSaisieLineKey(key: string): { kind: 'poste' | 'lot'; id: string } {
  const [kind, ...rest] = key.split(':');
  return { kind: kind as 'poste' | 'lot', id: rest.join(':') };
}

export function avancementProgressKey(lotId: string, posteId?: string | null): string {
  return `${lotId ?? ''}::${posteId ?? ''}`;
}

function posteToContext(poste: PosteBudgetaire, lotId: string): PosteSaisieContext {
  return {
    id: poste.id,
    lotId,
    code: poste.code,
    designation: poste.designation,
    unite: poste.unite ?? 'U',
    quantite: poste.quantite ?? 0,
    prixUnitaireHt: poste.prixUnitaireHt ?? 0,
    montantHt: poste.montantHt ?? 0,
  };
}

function lotHasChildContent(lotId: string, lots: LotChantier[], postesByLotId: Record<string, PosteBudgetaire[]>): boolean {
  const hasPostes = (postesByLotId[lotId] ?? []).length > 0;
  const hasSousLots = lots.some((lot) => lot.parentLotId === lotId);
  return hasPostes || hasSousLots;
}

export function buildSaisieLineDefinitions(
  lots: LotChantier[],
  postesByLotId: Record<string, PosteBudgetaire[]>,
): SaisieLineDefinition[] {
  const lines: SaisieLineDefinition[] = [];
  const lotById = new Map(lots.map((lot) => [lot.id, lot]));

  for (const lot of lots) {
    const postes = postesByLotId[lot.id] ?? [];
    if (postes.length > 0) {
      const parentLot = lot.parentLotId ? lotById.get(lot.parentLotId) : undefined;
      for (const poste of postes) {
        lines.push({
          key: saisieLineKey('poste', poste.id),
          kind: 'poste',
          lot,
          poste: posteToContext(poste, lot.id),
          parentLot,
          weight: (poste.montantHt ?? 0) || (poste.quantite ?? 0) * (poste.prixUnitaireHt ?? 0),
        });
      }
      continue;
    }

    if (lotHasChildContent(lot.id, lots, postesByLotId)) {
      continue;
    }

    lines.push({
      key: saisieLineKey('lot', lot.id),
      kind: 'lot',
      lot,
      weight: (lot.quantite ?? 0) * (lot.prixUnitaireHt ?? 0) || (lot.quantite ?? 0),
    });
  }

  return lines.sort((a, b) => {
    const ordreDiff = a.lot.ordre - b.lot.ordre || a.lot.code.localeCompare(b.lot.code);
    if (ordreDiff !== 0) return ordreDiff;
    if (a.kind === 'poste' && b.kind === 'poste') {
      return a.poste!.code.localeCompare(b.poste!.code);
    }
    return 0;
  });
}

export function mapDernierAvancementsByLineKey(
  items: AvancementListItem[],
): Record<string, AvancementListItem> {
  const out: Record<string, AvancementListItem> = {};
  for (const item of items) {
    const key = avancementProgressKey(item.lotId, item.posteId);
    if (!out[key]) {
      out[key] = item;
    }
  }
  return out;
}
