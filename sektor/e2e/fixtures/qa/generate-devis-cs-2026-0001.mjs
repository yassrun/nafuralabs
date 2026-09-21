/**
 * Devis PDF Lafarge — Béton B20 pour CS-2026-0001 (import magique).
 * Run: node sektor/e2e/fixtures/qa/generate-devis-cs-2026-0001.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

function pdfEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/é/g, '\\351')
    .replace(/è/g, '\\350')
    .replace(/à/g, '\\340')
    .replace(/ç/g, '\\347')
    .replace(/É/g, '\\311')
    .replace(/ô/g, '\\364')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/’/g, "'")
    .replace(/°/g, '\\260');
}

function buildPdf(lines, { fontSize = 10 } = {}) {
  const pageW = 595;
  const pageH = 842;
  const marginX = 48;
  const marginTop = 50;
  const marginBot = 48;
  const leading = fontSize + 4;
  const pages = [];
  let ops = [];
  let y = pageH - marginTop;
  let firstOnPage = true;

  const flush = () => {
    ops.push('ET');
    pages.push(ops.join('\n'));
    ops = [];
    y = pageH - marginTop;
    firstOnPage = true;
  };

  ops.push('BT');
  ops.push(`/F1 ${fontSize} Tf`);
  ops.push(`${marginX} ${y} Td`);

  for (const raw of lines) {
    const text = pdfEscape(raw);
    if (y - leading < marginBot) {
      flush();
      ops.push('BT');
      ops.push(`/F1 ${fontSize} Tf`);
      ops.push(`${marginX} ${y} Td`);
    }
    if (firstOnPage) {
      ops.push(`(${text}) Tj`);
      firstOnPage = false;
    } else {
      ops.push(`0 ${-leading} Td (${text}) Tj`);
      y -= leading;
    }
  }
  flush();

  const objs = [];
  const add = (body) => {
    objs.push(body);
    return objs.length;
  };

  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const contentIds = pages.map((stream) =>
    add(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`),
  );
  const pageIds = contentIds.map((contentId) =>
    add(
      `<< /Type /Page /Parent PAGES /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    ),
  );
  const pagesId = add(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`,
  );
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const bodies = objs.map((body) => body.replaceAll('PAGES', `${pagesId} 0 R`));
  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < bodies.length; i++) {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${bodies[i]}\nendobj\n`;
  }
  const xrefAt = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${bodies.length + 1}\n`;
  out += '0000000000 65535 f \n';
  for (let i = 1; i <= bodies.length; i++) {
    out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer << /Size ${bodies.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

const lines = [
  'DEVIS FOURNISSEUR LF-2026-B20-001',
  'Fournisseur: LafargeHolcim Maroc',
  'Date: 2026-09-18',
  'Objet: Consultation CS-2026-0001 - Beton B20',
  'Destinataire: Sektor QA - Etude DE-0004 dallette beton arme',
  '',
  'Ligne 1',
  'Identite: BETON-B20',
  'Libelle: Beton B20',
  'Quantite: 20',
  'Unite: m3',
  'Prix unitaire HT: 790.00 MAD',
  'Montant HT: 15800.00 MAD',
  '',
  'Tableau',
  'Ref         Designation     Quantite    Unite    Prix unitaire HT',
  'BETON-B20   Beton B20       20          m3       790.00',
  '',
  'Prix en MAD hors TVA. Validite 30 jours.',
  '',
];

const pdf = buildPdf(lines);
const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(homedir(), 'Desktop', 'CS-2026-0001-devis-lafarge-beton-b20.pdf');
const local = join(here, 'CS-2026-0001-devis-lafarge-beton-b20.pdf');
mkdirSync(here, { recursive: true });
writeFileSync(local, pdf);
writeFileSync(desktop, pdf);
console.log(local);
console.log(desktop);
