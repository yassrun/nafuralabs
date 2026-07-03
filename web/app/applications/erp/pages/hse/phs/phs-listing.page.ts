import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';
import { PPSPS_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';

import { PhsApiService } from './services/phs-api.service';
import type { PhsDocument, PpspsSection } from '../models';

@Component({
  selector: 'app-phs-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: ('hse.phs.headerTitle' | translate),
        subtitle: ('hse.phs.subtitle' | translate),
        breadcrumbs: [
          { label: ('hse.common.breadcrumb' | translate), route: '/hse/tableau-bord' },
          { label: ('hse.phs.breadcrumb' | translate) }
        ]
      }"></nf-page-header>

      <div class="toolbar">
        <input class="search" type="search" [placeholder]="'hse.phs.search' | translate"
          [value]="search()" (input)="search.set($any($event.target).value)" />
        <span class="count">{{ 'hse.phs.count' | translate: { n: filtered().length } }}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'hse.phs.columns.numero' | translate }}</th>
              <th>{{ 'hse.phs.columns.version' | translate }}</th>
              <th>{{ 'hse.phs.columns.date' | translate }}</th>
              <th>{{ 'hse.phs.columns.redacteur' | translate }}</th>
              <th>{{ 'hse.phs.columns.statut' | translate }}</th>
              <th>{{ 'hse.phs.columns.sections' | translate }}</th>
              <th class="actions">{{ 'hse.phs.columns.pdf' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td class="ref">{{ p.numero }}</td>
                <td>v{{ p.version }}</td>
                <td class="date">{{ p.dateRedaction | date:'dd/MM/yyyy' }}</td>
                <td>{{ p.redacteurNom }}</td>
                <td><span class="tag">{{ PPSPS_STATUS_KEYS[p.status] | translate }}</span></td>
                <td class="muted">{{ 'hse.phs.rows.sectionsCount' | translate: { n: p.sections.length } }}</td>
                <td class="actions">
                  <nf-button variant="ghost" size="sm" (clicked)="printPhs(p)">{{ 'hse.phs.actions.pdfOfficiel' | translate }}</nf-button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">{{ 'hse.phs.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .search { flex: 1; min-width: 180px; max-width: 280px; padding: 7px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; }
    .count { font-size: 13px; color: var(--nf-color-text-secondary); }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 300px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 9px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); }
    td { padding: 8px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); vertical-align: top; }
    td.ref { font-family: monospace; font-size: 11px; color: var(--nf-color-primary-700); }
    td.date { white-space: nowrap; color: var(--nf-color-text-secondary); font-size: 12px; }
    .muted { font-size: 12px; color: var(--nf-color-text-secondary); }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    .btn-link { background: none; border: none; color: var(--nf-color-primary-700); font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }
  `],
})
export class PhsListingPage implements OnInit {
  private readonly api = inject(PhsApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);

  readonly PPSPS_STATUS_KEYS = PPSPS_STATUS_KEYS;

  private readonly items = signal<PhsDocument[]>([]);

  readonly search = signal('');

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.items.set(await this.api.listAll());
    } catch {
      this.items.set([]);
    }
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    let list = this.items();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.numero.toLowerCase().includes(q) ||
        p.redacteurNom.toLowerCase().includes(q),
    );
  });

  printPhs(p: PhsDocument): void {
    const t = this.translate;
    const sectionsHtml = (p.sections ?? [])
      .map(
        (s: PpspsSection) =>
          `<h2>${s.numero}. ${escapeHtml(s.titre)}</h2><div class="md">${escapeHtml(s.contenu || '—')}</div>`,
      )
      .join('');
    const statusLabel = t.instant(PPSPS_STATUS_KEYS[p.status]);
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>PHS ${escapeHtml(p.numero)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:var(--nf-color-text-primary);}
      h1{font-size:18px;margin:0 0 8px;}
      h2{font-size:13px;margin:16px 0 6px;text-transform:uppercase;color:var(--nf-color-text-secondary);}
      .md{white-space:pre-wrap;font-size:13px;line-height:1.45;}
      .print-muted{color:var(--nf-color-text-secondary);font-size:12px;}
      @media print { .no-print{display:none;} }
    </style></head><body>
    <p class="no-print print-muted">${escapeHtml(t.instant('hse.phs.print.disclaimer', { version: p.version }))}</p>
    <h1>${escapeHtml(t.instant('hse.phs.print.headerTitle', { numero: p.numero }))}</h1>
    <p class="print-muted">${escapeHtml(t.instant('hse.phs.print.meta', { redacteur: p.redacteurNom, date: p.dateRedaction, status: statusLabel }))}</p>
    ${sectionsHtml}
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    this.audit.log('PRINT', 'PHS', p.id, p.numero, t.instant('hse.phs.audit.printNote'));
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
