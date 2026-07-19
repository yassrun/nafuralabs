import type { LotChantier } from '@app/chantiers/models';

export interface ParsedPlanningTask {
  numero: number;
  designation: string;
  dateDebut: string;
  dateFin: string;
  isPaymentMilestone: boolean;
  lotHint?: string;
  lotId?: string;
  parentNumero?: number;
}

export interface FilterPlanningTasksOptions {
  excludePayments?: boolean;
}

const FR_DAY_DATE =
  /(?:Lun|Mar|Mer|Jeu|Ven|Sam|Dim)\s+\d{2}\/\d{2}\/\d{2}/;

const TASK_LINE =
  new RegExp(
    `^(\\d+)\\s+(.+?)\\s+(${FR_DAY_DATE.source})\\s+(${FR_DAY_DATE.source})\\s*$`,
  );

const LOT_KEYWORD_RULES: ReadonlyArray<{ pattern: RegExp; lotCode: string }> = [
  { pattern: /électricit|electricit|domotique/i, lotCode: 'L04' },
  { pattern: /plomberie|canalisations?|tuyau|chutes?\s+de\s+pvc|appareillages?\s*\(wc/i, lotCode: 'L05' },
  { pattern: /menuiserie|portes?|placard|dressing|habillage\s+mural/i, lotCode: 'L01' },
  { pattern: /faux\s+plafond/i, lotCode: 'L02' },
  { pattern: /peinture|enduit/i, lotCode: 'L06' },
  { pattern: /piscine|local\s+technique/i, lotCode: 'L08' },
  { pattern: /climatisation|clim\b|vmc\b|vrf/i, lotCode: 'L07' },
  { pattern: /rev[eê]tement|carrelage|forme\b|pleinthes?/i, lotCode: 'L03' },
  { pattern: /étanchéit|etancheit|mousse\s+poly/i, lotCode: 'L09' },
  { pattern: /aménagement\s+ext|paysag|clôture|cloture/i, lotCode: 'L10' },
  { pattern: /cuisine/i, lotCode: 'L01' },
];

const INHERITED_LOT_SECTION = /^(sous\s*[- ]?sol|rdc|étage|etage|exterieur|extérieur)$/i;

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function parseFrGanttDateToken(token: string): string {
  const parts = token.trim().split(/\s+/);
  const datePart = parts[parts.length - 1] ?? '';
  const [dd, mm, yy] = datePart.split('/');
  if (!dd || !mm || !yy) {
    throw new Error(`Invalid Gantt date token: ${token}`);
  }
  const year = 2000 + Number.parseInt(yy, 10);
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

export function isPaymentMilestone(designation: string): boolean {
  const normalized = normalizeText(designation);
  if (/\breglement\b/.test(normalized)) {
    return true;
  }
  if (/avance.*demarrage/.test(normalized)) {
    return true;
  }
  if (/%/.test(designation) && (/\breglement\b/.test(normalized) || /avance/.test(normalized))) {
    return true;
  }
  return false;
}

export function parseGanttPdfText(text: string): ParsedPlanningTask[] {
  const tasks: ParsedPlanningTask[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('N°') || /^\d{2}\/\d{2}$/.test(line)) {
      continue;
    }
    if (/^(Avril|Mai|Juin|Juillet|Août|Aout|Septembre|Octobre|Novembre)\s+\d{4}/.test(line)) {
      continue;
    }
    if (/^\d{2}\s+\d{2}\s+\d{2}/.test(line)) {
      continue;
    }

    const match = TASK_LINE.exec(line);
    if (!match) {
      continue;
    }

    const numero = Number.parseInt(match[1], 10);
    const designation = match[2].trim();
    if (!designation) {
      continue;
    }

    tasks.push({
      numero,
      designation,
      dateDebut: parseFrGanttDateToken(match[3]),
      dateFin: parseFrGanttDateToken(match[4]),
      isPaymentMilestone: isPaymentMilestone(designation),
    });
  }

  return tasks;
}

export function filterPlanningTasks(
  tasks: ParsedPlanningTask[],
  options: FilterPlanningTasksOptions = {},
): ParsedPlanningTask[] {
  const excludePayments = options.excludePayments ?? true;
  if (!excludePayments) {
    return [...tasks];
  }
  return tasks.filter((task) => !task.isPaymentMilestone);
}

export function suggestLotId(designation: string, lots: LotChantier[]): string | undefined {
  const trimmed = designation.trim();
  if (!trimmed || INHERITED_LOT_SECTION.test(trimmed)) {
    return undefined;
  }

  for (const rule of LOT_KEYWORD_RULES) {
    if (rule.pattern.test(trimmed)) {
      const exists = lots.some((lot) => lot.code === rule.lotCode);
      return exists ? rule.lotCode : rule.lotCode;
    }
  }

  return undefined;
}

export function enrichPlanningTasksWithLots(
  tasks: ParsedPlanningTask[],
  lots: LotChantier[],
): ParsedPlanningTask[] {
  const rootLots = lots.filter((lot) => !lot.parentLotId);
  const lotIdByCode = new Map(rootLots.map((lot) => [lot.code, lot.id]));
  let currentLotCode: string | undefined;

  return tasks.map((task) => {
    const direct = suggestLotId(task.designation, rootLots);
    if (direct) {
      currentLotCode = direct;
    }
    const lotCode = direct ?? currentLotCode;
    return {
      ...task,
      lotHint: lotCode,
      lotId: lotCode ? lotIdByCode.get(lotCode) : undefined,
    };
  });
}

export function buildPhaseCode(numero: number): string {
  return `P${String(numero).padStart(3, '0')}`;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const document = await pdfjs.getDocument({ data: buffer }).promise;
  const chunks: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) {
      chunks.push(pageText);
    }
  }

  return chunks.join('\n');
}
