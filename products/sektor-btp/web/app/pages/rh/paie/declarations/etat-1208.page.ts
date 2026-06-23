import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';

import {PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { ComptaFournisseur } from '@applications/erp/finance/models';
import type { FactureFournisseur } from '@applications/erp/finance/models';
import { FfApiService } from '../../../achats/factures-fournisseur/services/ff-api.service';
import { PartnersApiService } from '@applications/erp/shared/services/partners-api.service';
import { partnerToComptaFournisseur } from '../../../achats/factures-fournisseur/services/ff.mapper';
import { ErpAuditService } from '@applications/erp/shell/erp-audit.service';

const COMPANY = {
  nom: 'Nafura BTP SARL',
  ice: '002345678901234',
  if_num: '87654321',
  rc: 'RC Casa 715869',
  patente: '36254178',
  cnss: '1234567',
  ville: 'Casablanca',
};

const STATUS_FACTURES_RETENUES: ReadonlyArray<FactureFournisseur['status']> = [
  'VALIDEE',
  'PARTIELLEMENT_PAYEE',
  'PAYEE',
];

interface Etat1208Ligne {
  fournisseurId: string;
  fournisseurName: string;
  ice: string;
  if_num: string;
  ville: string;
  nbFactures: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  retenueTva: number;
}

function escapeXml(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Identifiant Fiscal (IF) déduit de l'ICE en mock — les 8 premiers chiffres de l'ICE.
 * Dans une implémentation backend, l'IF sera saisi explicitement sur la fiche fournisseur.
 */
function deriveIf(fournisseur: ComptaFournisseur): string {
  if (!fournisseur.ice) return '';
  const digits = fournisseur.ice.replace(/\D/g, '');
  return digits.slice(0, 8);
}

@Component({
  selector: 'app-etat-1208',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <div class="controls">
        <label class="ctrl-label">{{ 'rh.paie.declarations.common.exerciseLabel' | translate }}
          <select [value]="annee()" (change)="annee.set(+$any($event.target).value)">
            @for (y of anneesDisponibles; track y) { <option [value]="y">{{ y }}</option> }
          </select>
        </label>
        <label class="ctrl-label">{{ 'rh.paie.declarations.etat1208.filterIce' | translate }}
          <input
            type="search"
            class="search"
            [attr.placeholder]="'rh.paie.declarations.etat1208.filterIcePlaceholder' | translate"
            [value]="filtreIce()"
            (input)="filtreIce.set($any($event.target).value)" />
        </label>
        <nf-button variant="secondary" (clicked)="exportXml()">{{ 'rh.paie.declarations.common.exportXml' | translate }}</nf-button>
        <nf-button variant="secondary" (clicked)="exportExcel()">{{ 'rh.paie.declarations.common.exportXlsx' | translate }}</nf-button>
      </div>

      <!-- En-tête déclaration -->
      <div class="dgi-header">
        <div class="dgi-logo">
          <strong>{{ 'rh.paie.declarations.common.royaumeMaroc' | translate }}</strong>
          <p>{{ 'rh.paie.declarations.common.dgi' | translate }}</p>
          <p>{{ 'rh.paie.declarations.etat1208.header.titre' | translate }}</p>
          <p class="etat-num">{{ 'rh.paie.declarations.etat1208.header.etatExercice' | translate: { annee: annee() } }}</p>
        </div>
        <div class="employer-ids">
          <table class="ids-table">
            <tr><td>{{ 'rh.paie.declarations.common.societe' | translate }}</td><td>{{ company.nom }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.if' | translate }}</td><td>{{ company.if_num }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.ice' | translate }}</td><td>{{ company.ice }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.rc' | translate }}</td><td>{{ company.rc }}</td></tr>
            <tr><td>{{ 'rh.paie.declarations.common.patente' | translate }}</td><td>{{ company.patente }}</td></tr>
          </table>
        </div>
      </div>

      <!-- Indicateurs -->
      <div class="kpis">
        <div class="kpi"><span>{{ 'rh.paie.declarations.etat1208.kpi.fournisseurs' | translate }}</span><strong>{{ lignesFiltrees().length }}</strong></div>
        <div class="kpi"><span>{{ 'rh.paie.declarations.etat1208.kpi.factures' | translate }}</span><strong>{{ totaux().nbFactures }}</strong></div>
        <div class="kpi"><span>{{ 'rh.paie.declarations.etat1208.kpi.totalHt' | translate }}</span><strong>{{ totaux().totalHt | mad:2 }}</strong></div>
        <div class="kpi"><span>{{ 'rh.paie.declarations.etat1208.kpi.totalTva' | translate }}</span><strong>{{ totaux().totalTva | mad:2 }}</strong></div>
        <div class="kpi kpi--accent"><span>{{ 'rh.paie.declarations.etat1208.kpi.totalTtc' | translate }}</span><strong>{{ totaux().totalTtc | mad:2 }}</strong></div>
      </div>

      @if (lignesFiltrees().length > 0) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'rh.paie.declarations.etat1208.columns.fournisseur' | translate }}</th>
                <th>{{ 'rh.paie.declarations.etat1208.columns.ice' | translate }}</th>
                <th>{{ 'rh.paie.declarations.etat1208.columns.if' | translate }}</th>
                <th>{{ 'rh.paie.declarations.etat1208.columns.ville' | translate }}</th>
                <th class="num">{{ 'rh.paie.declarations.etat1208.columns.nbFact' | translate }}</th>
                <th class="num">{{ 'rh.paie.declarations.etat1208.columns.totalHt' | translate }}</th>
                <th class="num">{{ 'rh.paie.declarations.etat1208.columns.tva' | translate }}</th>
                <th class="num">{{ 'rh.paie.declarations.etat1208.columns.totalTtc' | translate }}</th>
                <th class="num">{{ 'rh.paie.declarations.etat1208.columns.retenueTva' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (l of lignesFiltrees(); track l.fournisseurId) {
                <tr>
                  <td>{{ l.fournisseurName }}</td>
                  <td class="code">{{ l.ice || '—' }}</td>
                  <td class="code">{{ l.if_num || '—' }}</td>
                  <td>{{ l.ville || '—' }}</td>
                  <td class="num">{{ l.nbFactures }}</td>
                  <td class="num">{{ l.totalHt | mad:2 }}</td>
                  <td class="num">{{ l.totalTva | mad:2 }}</td>
                  <td class="num"><strong>{{ l.totalTtc | mad:2 }}</strong></td>
                  <td class="num">{{ l.retenueTva | mad:2 }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4"><strong>{{ 'rh.paie.declarations.common.totaux' | translate }}</strong></td>
                <td class="num"><strong>{{ totaux().nbFactures }}</strong></td>
                <td class="num"><strong>{{ totaux().totalHt | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().totalTva | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().totalTtc | mad:2 }}</strong></td>
                <td class="num"><strong>{{ totaux().retenueTva | mad:2 }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p class="hint">{{ 'rh.paie.declarations.etat1208.hint' | translate }}</p>

      } @else {
        <div class="empty">{{ 'rh.paie.declarations.etat1208.empty' | translate: { annee: annee() } }}</div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; }
    .ctrl-label { font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .ctrl-label select, .ctrl-label .search {
      padding: 7px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: var(--nf-color-surface);
    }
    .search { min-width: 200px; }
    .btn-export { padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: var(--nf-color-primary-700); color: var(--nf-color-primary-contrast); }
    .btn-export:hover { background: var(--nf-color-primary-700); }
    .btn-export--xlsx { background: var(--nf-color-primary-500); }
    .btn-export--xlsx:hover { background: var(--nf-color-primary-600); }

    .dgi-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; background: var(--nf-color-bg-subtle); border: 2px solid var(--nf-color-border); border-radius: 8px; padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
    .dgi-logo strong { font-size: 1rem; color: var(--nf-color-text-primary); }
    .dgi-logo p { margin: 0.1rem 0; font-size: 12px; color: var(--nf-color-text-secondary); }
    .etat-num { margin-top: 0.5rem !important; font-size: 13px !important; font-weight: 700; color: var(--nf-color-primary-700) !important; }
    .ids-table { border-collapse: collapse; font-size: 12px; }
    .ids-table td { padding: 3px 10px; border: 1px solid var(--nf-color-border); }
    .ids-table td:first-child { font-weight: 600; background: var(--nf-color-bg-muted); width: 80px; }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
    .kpi { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 0.65rem 0.9rem; display: flex; flex-direction: column; gap: 0.2rem; }
    .kpi span { font-size: 11px; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi strong { font-size: 1rem; color: var(--nf-color-text-primary); font-variant-numeric: tabular-nums; }
    .kpi--accent { background: var(--nf-color-primary-50); border-color: var(--nf-color-primary-200); }
    .kpi--accent strong { color: var(--nf-color-primary-700); }

    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th { position: sticky; top: 0; padding: 9px 10px; background: var(--nf-color-text-primary); color: var(--nf-color-primary-contrast); font-weight: 600; text-align: left; white-space: nowrap; z-index: 1; }
    th.num { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-text-secondary); }
    .total-row td { border-top: 2px solid var(--nf-color-text-primary); background: var(--nf-color-bg-subtle); padding: 9px 10px; }
    .total-row td.num { text-align: right; }
    .hint { font-size: 12px; color: var(--nf-color-text-secondary); padding: 0.5rem 0.25rem; }
    .empty { text-align: center; padding: 3rem; color: var(--nf-color-text-muted); font-size: 0.9rem; }
  `],
})
export class Etat1208Page {
  private readonly ffApi = inject(FfApiService);
  private readonly partnersApi = inject(PartnersApiService);
  private readonly audit = inject(ErpAuditService);
  private readonly translate = inject(TranslateService);

  readonly company = COMPANY;
  readonly anneesDisponibles = [2025, 2026];
  readonly annee = signal(2026);
  readonly filtreIce = signal('');

  readonly headerConfig = computed(() => ({
    title: this.translate.instant('rh.paie.declarations.etat1208.title'),
    subtitle: this.translate.instant('rh.paie.declarations.etat1208.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('rh.common.module'), route: '/rh' },
      { label: this.translate.instant('rh.routes.paie.title'), route: '/rh/paie' },
      { label: this.translate.instant('rh.routes.damancom.breadcrumb'), route: '/rh/paie/declarations/damancom' },
      { label: this.translate.instant('rh.routes.etat1208.breadcrumb') },
    ],
  }));

  private readonly factures = signal<FactureFournisseur[]>([]);
  private readonly fournisseursById = signal<Map<string, ComptaFournisseur>>(new Map());

  constructor() {
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const [factures, partnersRes] = await Promise.all([
        this.ffApi.listAll(),
        this.partnersApi.listByRole('FOURNISSEUR', { page: 0, pageSize: 500 }),
      ]);
      this.factures.set(factures);
      this.fournisseursById.set(
        new Map(
          partnersRes.items.map((p) => {
            const compta = partnerToComptaFournisseur(p);
            return [compta.id, compta] as const;
          }),
        ),
      );
    } catch {
      this.factures.set([]);
      this.fournisseursById.set(new Map());
    }
  }

  readonly lignes = computed<Etat1208Ligne[]>(() => {
    const annee = String(this.annee());
    const groupes = new Map<string, FactureFournisseur[]>();

    for (const f of this.factures()) {
      if (!STATUS_FACTURES_RETENUES.includes(f.status)) continue;
      if (!f.dateFacture.startsWith(annee)) continue;
      const arr = groupes.get(f.fournisseurId) ?? [];
      arr.push(f);
      groupes.set(f.fournisseurId, arr);
    }

    return [...groupes.entries()]
      .map(([id, fs]) => {
        const tiers = this.fournisseursById().get(id);
        const totalHt = round2(fs.reduce((s, x) => s + x.totalHt, 0));
        const totalTva = round2(fs.reduce((s, x) => s + x.totalTva, 0));
        const totalTtc = round2(fs.reduce((s, x) => s + x.totalTtc, 0));
        const retenueTva = round2(fs.reduce((s, x) => s + (x.retenueTvaMontant ?? 0), 0));
        return {
          fournisseurId: id,
          fournisseurName: tiers?.name ?? fs[0].fournisseurName ?? id,
          ice: tiers?.ice ?? '',
          if_num: tiers ? deriveIf(tiers) : '',
          ville: tiers?.ville ?? '',
          nbFactures: fs.length,
          totalHt,
          totalTva,
          totalTtc,
          retenueTva,
        };
      })
      .sort((a, b) => b.totalTtc - a.totalTtc);
  });

  readonly lignesFiltrees = computed<Etat1208Ligne[]>(() => {
    const term = this.filtreIce().trim().toLowerCase();
    if (!term) return this.lignes();
    return this.lignes().filter(l =>
      l.ice.toLowerCase().includes(term) || l.if_num.toLowerCase().includes(term),
    );
  });

  readonly totaux = computed(() => {
    const rows = this.lignesFiltrees();
    return {
      nbFactures: rows.reduce((s, l) => s + l.nbFactures, 0),
      totalHt: round2(rows.reduce((s, l) => s + l.totalHt, 0)),
      totalTva: round2(rows.reduce((s, l) => s + l.totalTva, 0)),
      totalTtc: round2(rows.reduce((s, l) => s + l.totalTtc, 0)),
      retenueTva: round2(rows.reduce((s, l) => s + l.retenueTva, 0)),
    };
  });

  exportXml(): void {
    const rows = this.lignesFiltrees();
    const t = this.totaux();
    const lignesXml = rows.map(l => `    <Ligne>
      <Fournisseur>${escapeXml(l.fournisseurName)}</Fournisseur>
      <ICE>${escapeXml(l.ice)}</ICE>
      <IF>${escapeXml(l.if_num)}</IF>
      <Ville>${escapeXml(l.ville)}</Ville>
      <NombreFactures>${l.nbFactures}</NombreFactures>
      <MontantHT>${l.totalHt.toFixed(2)}</MontantHT>
      <MontantTVA>${l.totalTva.toFixed(2)}</MontantTVA>
      <MontantTTC>${l.totalTtc.toFixed(2)}</MontantTTC>
      <RetenueTVA>${l.retenueTva.toFixed(2)}</RetenueTVA>
    </Ligne>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EtatRecapAchats xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Declarant>
    <RaisonSociale>${escapeXml(this.company.nom)}</RaisonSociale>
    <ICE>${escapeXml(this.company.ice)}</ICE>
    <IF>${escapeXml(this.company.if_num)}</IF>
    <RC>${escapeXml(this.company.rc)}</RC>
    <Patente>${escapeXml(this.company.patente)}</Patente>
  </Declarant>
  <Exercice>${this.annee()}</Exercice>
  <Lignes>
${lignesXml}
  </Lignes>
  <Totaux>
    <NombreFournisseurs>${rows.length}</NombreFournisseurs>
    <NombreFactures>${t.nbFactures}</NombreFactures>
    <TotalHT>${t.totalHt.toFixed(2)}</TotalHT>
    <TotalTVA>${t.totalTva.toFixed(2)}</TotalTVA>
    <TotalTTC>${t.totalTtc.toFixed(2)}</TotalTTC>
    <TotalRetenueTVA>${t.retenueTva.toFixed(2)}</TotalRetenueTVA>
  </Totaux>
</EtatRecapAchats>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Etat1208_${this.company.if_num}_${this.annee()}.xml`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);

    this.audit.log(
      'EXPORT',
      'DGI_1208',
      `etat-1208-${this.annee()}`,
      `État 1208 ${this.annee()}`,
      `XML — ${rows.length} fournisseurs, ${t.nbFactures} factures, TTC ${t.totalTtc.toFixed(2)} MAD`,
    );
  }

  exportExcel(): void {
    const rows = this.lignesFiltrees();
    const t = this.totaux();

    const data = rows.map(l => ({
      Fournisseur: l.fournisseurName,
      ICE: l.ice,
      IF: l.if_num,
      Ville: l.ville,
      'Nb factures': l.nbFactures,
      'Total HT': l.totalHt,
      'TVA': l.totalTva,
      'Total TTC': l.totalTtc,
      'Retenue TVA': l.retenueTva,
    }));
    data.push({
      Fournisseur: 'TOTAUX',
      ICE: '',
      IF: '',
      Ville: '',
      'Nb factures': t.nbFactures,
      'Total HT': t.totalHt,
      'TVA': t.totalTva,
      'Total TTC': t.totalTtc,
      'Retenue TVA': t.retenueTva,
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 16 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, `Etat 1208 ${this.annee()}`);

    const filename = `Etat1208_${this.company.if_num}_${this.annee()}.xlsx`;
    XLSX.writeFile(wb, filename);

    this.audit.log(
      'EXPORT',
      'DGI_1208',
      `etat-1208-${this.annee()}`,
      `État 1208 ${this.annee()}`,
      `XLSX — ${rows.length} fournisseurs, ${t.nbFactures} factures, TTC ${t.totalTtc.toFixed(2)} MAD`,
    );
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
