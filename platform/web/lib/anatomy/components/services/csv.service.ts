/**
 * CSV Service
 *
 * Reusable import/export for list pages.
 * - Export: rows + column config → CSV file download (UTF-8 with BOM for Excel).
 * - Import: File → parsed rows (Record<string, string>[]).
 */

import { Injectable } from '@angular/core';

/** Column descriptor for CSV export (field path + header label). */
export interface CsvExportColumn {
  field: string;
  label: string;
}

/** Template column: stable key for CSV header (technical, not translated). */
export interface CsvTemplateColumn {
  key: string;
  label?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CsvService {
  /** Default max rows to fetch for "export all filtered" (avoid huge payloads). */
  static readonly DEFAULT_EXPORT_PAGE_SIZE = 10_000;

  /**
   * Get a nested field value from an object (e.g. "a.b" from { a: { b: 1 } }).
   */
  getFieldValue(row: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = row;
    for (const part of parts) {
      if (value == null) return undefined;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  }

  /**
   * Export rows to CSV and trigger download.
   * Uses column labels as header row; values are stringified and escaped.
   */
  exportToCsv(
    rows: Record<string, unknown>[],
    columns: CsvExportColumn[],
    filename: string
  ): void {
    const header = columns.map((c) => this.escapeCsvCell(c.label)).join(',');
    const lines = [header];

    for (const row of rows) {
      const cells = columns.map((col) => {
        const value = this.getFieldValue(row, col.field);
        const str = value != null ? String(value) : '';
        return this.escapeCsvCell(str);
      });
      lines.push(cells.join(','));
    }

    const csv = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generate a CSV template (headers only) with stable column keys.
   * UTF-8 with BOM for Excel. Used for "Download template".
   */
  generateTemplateCsv(
    columns: CsvTemplateColumn[],
    filename: string
  ): void {
    const header = columns.map((c) => this.escapeCsvCell(c.key)).join(',');
    const csv = '\uFEFF' + header + '\r\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Parse a CSV file into an array of row objects (first row = headers).
   * Handles quoted fields and commas inside quotes.
   */
  async parseCsv(file: File): Promise<Record<string, string>[]> {
    const text = await this.readFileAsText(file);
    return this.parseCsvText(text);
  }

  /**
   * Parse CSV text string into rows (first line = headers).
   */
  parseCsvText(text: string): Record<string, string>[] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!normalized) return [];

    const lines = normalized.split('\n');
    const headers = this.parseCsvLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, j) => {
        row[h] = values[j] ?? '';
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV line respecting quoted fields.
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private escapeCsvCell(value: string): string {
    if (!/[\n",]/.test(value)) return value;
    return '"' + value.replace(/"/g, '""') + '"';
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? '');
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file, 'UTF-8');
    });
  }
}
