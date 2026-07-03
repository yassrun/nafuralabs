import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService, type ExportColumn } from '../../../services/export.service';

export type ExportFormat = 'csv' | 'xlsx' | 'print';

/**
 * Event emitted right after a successful export. Consumers can hook in to
 * forward an audit log entry (e.g. `erpAudit.log('EXPORT', ...)`).
 */
export interface ExportEvent {
  format: ExportFormat;
  filename: string;
  rowCount: number;
}

/**
 * ExportButton — dropdown with CSV / Excel / Print actions.
 *
 * @example
 * <nf-export-button [data]="rows()" [columns]="cols" filename="bons-commande"></nf-export-button>
 */
@Component({
  selector: 'nf-export-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nf-export" [class.nf-export--open]="open()">
      <button type="button" class="nf-export__trigger" (click)="toggle()" title="Exporter">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Exporter</span>
      </button>

      @if (open()) {
        <ul class="nf-export__menu" role="menu">
          <li role="menuitem" (click)="exportAs('csv')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            CSV
          </li>
          <li role="menuitem" (click)="exportAs('xlsx')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Excel (.xls)
          </li>
          <li role="menuitem" (click)="exportAs('print')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimer
          </li>
        </ul>
      }
    </div>
  `,
  styles: [`
    .nf-export { position: relative; display: inline-block; }
    .nf-export__trigger { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all 80ms; }
    .nf-export__trigger:hover { background: #f8fafc; border-color: #94a3b8; }
    .nf-export--open .nf-export__trigger { background: #f1f5f9; border-color: #94a3b8; }
    .nf-export__menu { position: absolute; right: 0; top: calc(100% + 4px); min-width: 160px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 4px; list-style: none; margin: 0; z-index: 100; }
    .nf-export__menu li { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 13px; color: #334155; cursor: pointer; border-radius: 5px; transition: background 80ms; }
    .nf-export__menu li:hover { background: #f8fafc; }
  `],
})
export class ExportButtonComponent {
  private readonly exportService = inject(ExportService);

  readonly data = input.required<unknown[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly columns = input.required<ExportColumn<any>[]>();
  readonly filename = input.required<string>();
  readonly formats = input<ExportFormat[]>(['csv', 'xlsx', 'print']);

  readonly open = signal(false);
  readonly exported = output<ExportEvent>();

  toggle(): void { this.open.update(v => !v); }

  exportAs(fmt: ExportFormat): void {
    this.open.set(false);
    const d = this.data();
    const c = this.columns();
    const f = this.filename();
    if (fmt === 'csv') this.exportService.exportCsv(d, { filename: f, columns: c });
    else if (fmt === 'xlsx') this.exportService.exportXlsx(d, { filename: f, columns: c });
    else this.exportService.printPage();
    this.exported.emit({ format: fmt, filename: f, rowCount: d.length });
  }

  @HostListener('document:click', ['$event.target'])
  onOutsideClick(target: HTMLElement): void {
    if (this.open() && !target.closest('nf-export-button')) this.open.set(false);
  }
}
