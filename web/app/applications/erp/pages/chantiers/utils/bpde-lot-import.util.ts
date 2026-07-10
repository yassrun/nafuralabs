import * as XLSX from 'xlsx';

export interface BpdeParsedPoste {
  code: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaireHt: number;
  montantHt?: number;
}

export interface BpdeParsedSousLot {
  code?: string;
  designation: string;
  postes: BpdeParsedPoste[];
}

export interface BpdeParsedLot {
  code: string;
  designation: string;
  sousLots: BpdeParsedSousLot[];
  postes: BpdeParsedPoste[];
}

type RawRow = [string, string, string, string, string, string];

function cellStr(value: unknown): string {
  if (value == null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function cellNum(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = cellStr(value).replace(/\s+/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isLotHeader(first: string): boolean {
  return /^LOT\s+\d+/i.test(first);
}

function lotHeaderToCode(first: string): string {
  const match = first.match(/^LOT\s+(\d+)/i);
  const num = match?.[1] ?? '0';
  return `L${num.padStart(2, '0')}`;
}

function lotHeaderToDesignation(first: string): string {
  return first.replace(/^LOT\s+\d+\s*:\s*/i, '').trim() || first;
}

function isTotalRow(designation: string): boolean {
  return /^total\s/i.test(designation);
}

function isHeaderRow(first: string, second: string): boolean {
  const joined = `${first} ${second}`.toLowerCase();
  return joined.includes('bordereau des prix') || joined.includes('designation') && joined.includes('total ht');
}

function isArticleCode(code: string): boolean {
  return /^\d+\.\d+$/.test(code);
}

function hasUnit(unite: string): boolean {
  return unite.length > 0 && unite !== '-';
}

function isSousLotRow(code: string, designation: string, unite: string): boolean {
  if (!designation || isTotalRow(designation)) return false;
  if (hasUnit(unite)) return false;
  if (!code && designation) return true;
  if (isArticleCode(code) && !hasUnit(unite)) return true;
  return false;
}

function isArticleRow(code: string, designation: string, unite: string, quantite: number, pu: number): boolean {
  if (!designation || isTotalRow(designation)) return false;
  if (!hasUnit(unite)) return false;
  if (code && !isArticleCode(code)) return false;
  if (Number.isFinite(quantite) && quantite > 0 && Number.isFinite(pu) && pu >= 0) {
    return true;
  }
  // BPDE rows often have unité but empty quantité / PU — keep structure for import.
  return !code || isArticleCode(code);
}

function resolveArticleQuantite(quantite: number): number {
  return Number.isFinite(quantite) && quantite > 0 ? quantite : 0;
}

function resolveArticlePrixUnitaire(pu: number): number {
  return Number.isFinite(pu) && pu >= 0 ? pu : 0;
}

function sheetToRows(worksheet: XLSX.WorkSheet): RawRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
  return raw.map((row) => {
    const cells = Array.isArray(row) ? row : [];
    return [
      cellStr(cells[0]),
      cellStr(cells[1]),
      cellStr(cells[2]),
      cellStr(cells[3]),
      cellStr(cells[4]),
      cellStr(cells[5]),
    ];
  });
}

export function isBpdeWorkbook(workbook: XLSX.WorkBook): boolean {
  for (const name of workbook.SheetNames) {
    const rows = sheetToRows(workbook.Sheets[name]);
    const joined = rows.slice(0, 20).map((r) => r.join(' ')).join(' ').toLowerCase();
    if (joined.includes('bordereau des prix') || joined.includes('lot  1 :') || joined.includes('lot 1 :')) {
      return true;
    }
  }
  return false;
}

export function parseBpdeWorkbook(workbook: XLSX.WorkBook): BpdeParsedLot[] {
  const lots: BpdeParsedLot[] = [];
  let currentLot: BpdeParsedLot | null = null;
  let currentSousLot: BpdeParsedSousLot | null = null;

  for (const sheetName of workbook.SheetNames) {
    const rows = sheetToRows(workbook.Sheets[sheetName]);
    for (const [c0, c1, u, qRaw, puRaw, totalRaw] of rows) {
      if (!c0 && !c1) continue;
      if (isHeaderRow(c0, c1)) continue;

      const quantite = cellNum(qRaw);
      const prixUnitaireHt = cellNum(puRaw);

      if (isLotHeader(c0)) {
        currentLot = {
          code: lotHeaderToCode(c0),
          designation: lotHeaderToDesignation(c0),
          sousLots: [],
          postes: [],
        };
        lots.push(currentLot);
        currentSousLot = null;
        continue;
      }

      if (!currentLot) continue;
      if (isTotalRow(c1)) continue;

      if (isSousLotRow(c0, c1, u)) {
        currentSousLot = {
          code: c0 || undefined,
          designation: c1,
          postes: [],
        };
        currentLot.sousLots.push(currentSousLot);
        continue;
      }

      if (isArticleRow(c0, c1, u, quantite, prixUnitaireHt)) {
        const totalParsed = cellNum(totalRaw);
        const resolvedQuantite = resolveArticleQuantite(quantite);
        const resolvedPu = resolveArticlePrixUnitaire(prixUnitaireHt);
        const poste: BpdeParsedPoste = {
          code: c0 || `${currentSousLot?.code ?? currentLot.code}.${(currentSousLot?.postes.length ?? currentLot.postes.length) + 1}`,
          designation: c1,
          unite: u,
          quantite: resolvedQuantite,
          prixUnitaireHt: resolvedPu,
          montantHt: Number.isFinite(totalParsed) && totalParsed > 0
            ? totalParsed
            : Math.round(resolvedQuantite * resolvedPu * 100) / 100,
        };
        if (currentSousLot) {
          currentSousLot.postes.push(poste);
        } else {
          currentLot.postes.push(poste);
        }
      }
    }
  }

  return lots;
}

/** Stable chantier-wide lot code for a BPDE sous-lot (avoids duplicate codes like 5.33 across lots). */
export function buildBpdeSousLotCode(parentLotCode: string, sousLot: BpdeParsedSousLot, order: number): string {
  const suffix = sousLot.code?.trim() || String(order);
  return `${parentLotCode}-${suffix}`;
}
