import { inject, Injectable, LOCALE_ID } from '@angular/core';

export interface ExportColumn<T> {
  header: string;
  field: keyof T | ((row: T) => string | number | null | undefined);
  type?: 'text' | 'number' | 'currency' | 'date' | 'percent';
}

interface ExportFormatters {
  fmtMad: Intl.NumberFormat;
  fmtNum: Intl.NumberFormat;
  fmtDate: Intl.DateTimeFormat;
}

function buildFormatters(locale: string): ExportFormatters {
  return {
    fmtMad: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    fmtNum: new Intl.NumberFormat(locale),
    fmtDate: new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
}

function getCellValue<T>(row: T, col: ExportColumn<T>, fmt: ExportFormatters): string {
  const raw = typeof col.field === 'function' ? col.field(row) : row[col.field];
  if (raw == null) return '';
  switch (col.type) {
    case 'currency': return fmt.fmtMad.format(Number(raw));
    case 'number': return fmt.fmtNum.format(Number(raw));
    case 'percent': return `${Number(raw).toFixed(1)}%`;
    case 'date': {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      return isNaN(d.getTime()) ? String(raw) : fmt.fmtDate.format(d);
    }
    default: return String(raw);
  }
}

function escapeCsv(v: string): string {
  if (v.includes('"') || v.includes(';') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function timestampFilename(base: string, ext: string): string {
  const d = new Date();
  const ts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${base}-${ts}.${ext}`;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly locale = inject(LOCALE_ID);
  private readonly formatters: ExportFormatters = buildFormatters(this.locale);

  /**
   * Export CSV with BOM for French Excel compatibility.
   */
  exportCsv<T>(data: T[], options: { filename: string; columns: ExportColumn<T>[]; delimiter?: string }): void {
    const sep = options.delimiter ?? ';';
    const header = options.columns.map(c => escapeCsv(c.header)).join(sep);
    const rows = data.map(row =>
      options.columns.map(col => escapeCsv(getCellValue(row, col, this.formatters))).join(sep)
    );
    const csv = '﻿' + [header, ...rows].join('\r\n'); // BOM for Excel fr
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, timestampFilename(options.filename, 'csv'));
  }

  /**
   * Export XLSX using a simple XML-based Excel format (no external lib required).
   * For full formatting, migrate to exceljs when added to deps.
   */
  exportXlsx<T>(data: T[], options: { filename: string; sheetName?: string; columns: ExportColumn<T>[] }): void {
    const sheetName = (options.sheetName ?? options.filename).slice(0, 31);

    const headerRow = options.columns.map(c => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`).join('');

    const dataRows = data.map(row => {
      const cells = options.columns.map(col => {
        const v = getCellValue(row, col, this.formatters);
        const type = (col.type === 'currency' || col.type === 'number' || col.type === 'percent') ? 'Number' : 'String';
        const numVal = type === 'Number' ? parseFloat(v.replace(/\s/g, '').replace(',', '.')) : NaN;
        if (type === 'Number' && !isNaN(numVal)) {
          return `<Cell><Data ss:Type="Number">${numVal}</Data></Cell>`;
        }
        return `<Cell><Data ss:Type="String">${escapeXml(v)}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F0F0F0" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    downloadBlob(blob, timestampFilename(options.filename, 'xls'));
  }

  /** Trigger browser print dialog. */
  printPage(): void {
    window.print();
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
