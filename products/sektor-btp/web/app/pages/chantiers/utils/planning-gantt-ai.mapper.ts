import type { LotChantier } from '@applications/erp/chantiers/models';

import {
  enrichPlanningTasksWithLots,
  filterPlanningTasks,
  isPaymentMilestone,
  type ParsedPlanningTask,
} from './planning-gantt-pdf.util';

type AiPlanningTask = {
  numero?: number | string | null;
  designation?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  lotHint?: string | null;
  isPaymentMilestone?: boolean | null;
  parentNumero?: number | string | null;
};

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const frMatch = /^(?:Lun|Mar|Mer|Jeu|Ven|Sam|Dim)\s+(\d{2}\/\d{2}\/\d{2})$/i.exec(trimmed);
  if (frMatch) {
    const [dd, mm, yy] = frMatch[1].split('/');
    return `20${yy}-${mm}-${dd}`;
  }
  return undefined;
}

export function mapAiPlanningExtraction(
  extracted: Record<string, unknown>,
  lots: LotChantier[] = [],
): ParsedPlanningTask[] {
  const rawTasks = Array.isArray(extracted['tasks']) ? extracted['tasks'] as AiPlanningTask[] : [];
  const mapped: ParsedPlanningTask[] = [];

  for (const raw of rawTasks) {
    const numero = asNumber(raw.numero);
    const designation = typeof raw.designation === 'string' ? raw.designation.trim() : '';
    const dateDebut = asIsoDate(raw.dateDebut);
    const dateFin = asIsoDate(raw.dateFin);
    if (!numero || !designation || !dateDebut || !dateFin) {
      continue;
    }

    mapped.push({
      numero,
      designation,
      dateDebut,
      dateFin,
      isPaymentMilestone: raw.isPaymentMilestone ?? isPaymentMilestone(designation),
      lotHint: typeof raw.lotHint === 'string' ? raw.lotHint : undefined,
      parentNumero: asNumber(raw.parentNumero),
    });
  }

  const filtered = filterPlanningTasks(mapped);
  return enrichPlanningTasksWithLots(filtered, lots);
}
