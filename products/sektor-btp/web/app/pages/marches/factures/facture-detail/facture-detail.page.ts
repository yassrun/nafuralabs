import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent, ButtonComponent } from '@lib/anatomy';
import { EmptyStateComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { ExportService } from '@lib/anatomy/services/export.service';
import { FACTURE_MARCHE_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { FactureMarcheApiService } from '../services/facture-marche-api.service';
import { ContratMarcheApiService } from '../../contrats/services/contrat-marche-api.service';
import { FactureMarChePrintComponent } from '../print/facture-marche-print.component';
import { FACTURE_STATUS_VARIANT, type FactureMarche, type FactureMarcheStatus, type Marche } from '../../models';
import { AutoJournalService } from '@applications/erp/shell/auto-journal.service';

@Component({
  selector: 'app-facture-marche-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageShellComponent, PageHeaderComponent, EmptyStateComponent, MadCurrencyPipe, FactureMarChePrintComponent, TranslateModule, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      @if (facture(); as f) {
        <nf-page-header [config]="{
          title: f.numero,
          subtitle: f.clientNom + ' · ' + f.chantierCode,
          breadcrumbs: [
            { label: ('marches.module.title' | translate) },
            { label: ('marches.factureMarche.listing.breadcrumb' | translate), route: '/marches/factures' },
            { label: f.numero }
          ]
        }"></nf-page-header>

        <div class="print-only">
          <app-facture-marche-print [factureId]="f.id"></app-facture-marche-print>
        </div>

        <div class="screen-only">

        <div class="status-banner">
          <span class="badge badge--{{ statusVariant(f.status) }} badge--lg">{{ FACTURE_MARCHE_STATUS_KEYS[f.status] | translate }}</span>
          <span class="marche-ref">{{ 'marches.factureMarche.detail.marcheRef' | translate }} <a [routerLink]="['/marches/contrats', f.marcheId]" class="link">{{ f.marcheNumero }}</a></span>
        </div>

        <section class="calcul-card">
          <h2>{{ 'marches.factureMarche.detail.decompte.title' | translate }}</h2>

          <table class="calcul-table">
            <tbody>
              <tr class="calcul-row">
                <td class="label">{{ 'marches.factureMarche.detail.decompte.montantBrutHt' | translate }}</td>
                <td class="amount">{{ f.montantBrutHt | mad }}</td>
              </tr>
              @if (f.avanceDeduiteHt > 0) {
                <tr class="calcul-row deduction">
                  <td class="label">{{ 'marches.factureMarche.detail.decompte.deductionAvance' | translate }}</td>
                  <td class="amount">− {{ f.avanceDeduiteHt | mad }}</td>
                </tr>
              }
              <tr class="calcul-row deduction">
                <td class="label">{{ 'marches.factureMarche.detail.decompte.retenueGarantie' | translate:{ rate: marche()?.retenueGarantieTaux ?? 7 } }}</td>
                <td class="amount">− {{ f.retenueGarantieHt | mad }}</td>
              </tr>
              <tr class="calcul-row subtotal">
                <td class="label"><strong>{{ 'marches.factureMarche.detail.decompte.netHt' | translate }}</strong></td>
                <td class="amount"><strong>{{ f.netHt | mad }}</strong></td>
              </tr>
              <tr class="calcul-row">
                <td class="label">{{ 'marches.factureMarche.detail.decompte.tva' | translate:{ rate: f.tvaTaux } }}</td>
                <td class="amount">+ {{ f.tvaMontant | mad }}</td>
              </tr>
              <tr class="calcul-row subtotal">
                <td class="label"><strong>{{ 'marches.factureMarche.detail.decompte.netTtc' | translate }}</strong></td>
                <td class="amount"><strong>{{ f.netTtc | mad }}</strong></td>
              </tr>
              @if (f.retenueSourceTaux > 0) {
                <tr class="calcul-row deduction">
                  <td class="label">{{ 'marches.factureMarche.detail.decompte.retenueSource' | translate:{ rate: f.retenueSourceTaux } }}</td>
                  <td class="amount danger-text">− {{ f.retenueSourceMontant | mad }}</td>
                </tr>
              }
              @if (f.timbreFiscal > 0) {
                <tr class="calcul-row deduction">
                  <td class="label">{{ 'marches.factureMarche.detail.decompte.timbreFiscal' | translate }}</td>
                  <td class="amount danger-text">− {{ f.timbreFiscal | mad }}</td>
                </tr>
              }
              <tr class="calcul-row total">
                <td class="label"><strong>{{ 'marches.factureMarche.detail.decompte.netAPayer' | translate }}</strong></td>
                <td class="amount total-amount"><strong>{{ f.netAPayer | mad }}</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="meta-grid">
          <article class="meta-card">
            <span>{{ 'marches.factureMarche.detail.meta.dateEmission' | translate }}</span>
            <strong>{{ f.dateEmission | date:'dd/MM/yyyy' }}</strong>
          </article>
          <article class="meta-card" [class.meta-card--overdue]="isOverdue(f)">
            <span>{{ 'marches.factureMarche.detail.meta.echeance' | translate }}</span>
            <strong>{{ f.dateEcheance | date:'dd/MM/yyyy' }}</strong>
            @if (isOverdue(f)) { <small>{{ 'marches.factureMarche.detail.meta.overdue' | translate }}</small> }
          </article>
        </section>

        @if (f.paiements.length) {
          <section class="payments">
            <h3>{{ 'marches.factureMarche.detail.paiements.title' | translate }}</h3>
            <table class="data-table">
              <thead><tr>
                <th>{{ 'marches.factureMarche.detail.paiements.columns.date' | translate }}</th>
                <th>{{ 'marches.factureMarche.detail.paiements.columns.reference' | translate }}</th>
                <th>{{ 'marches.factureMarche.detail.paiements.columns.mode' | translate }}</th>
                <th class="num">{{ 'marches.factureMarche.detail.paiements.columns.montant' | translate }}</th>
              </tr></thead>
              <tbody>
                @for (p of f.paiements; track p.id) {
                  <tr>
                    <td class="date">{{ p.date | date:'dd/MM/yyyy' }}</td>
                    <td>{{ p.reference ?? '—' }}</td>
                    <td>{{ ('marches.common.modePaiement.' + p.modePaiement) | translate }}</td>
                    <td class="num success-text">{{ p.montant | mad }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }

        <div class="back-action">
          <nf-button variant="secondary" (clicked)="goBack()">{{ 'marches.factureMarche.detail.actions.back' | translate }}</nf-button>
          <nf-button variant="secondary" icon="printer" iconLibrary="lucide" (clicked)="print()">{{ 'marches.factureMarche.detail.actions.print' | translate }}</nf-button>
          <nf-button variant="primary" (clicked)="comptabiliser(f)" [disabled]="comptabilisee()">
            @if (comptabilisee()) { {{ 'marches.factureMarche.detail.actions.comptabilisee' | translate }} }
            @else { {{ 'marches.factureMarche.detail.actions.comptabiliser' | translate }} }
          </nf-button>
        </div>

        @if (lastOd(); as od) {
          <section class="od-panel">
            <h3>{{ 'marches.factureMarche.detail.od.title' | translate }}</h3>
            <p class="od-meta">
              <strong>{{ od.simulation.mapping.journalCode }}</strong> · {{ od.libelleResolu }} · {{ od.generatedAt }}
              @if (od.simulation.isBalanced) {
                <span class="badge badge--success">{{ 'marches.factureMarche.detail.od.balanced' | translate }}</span>
              } @else {
                <span class="badge badge--danger">{{ 'marches.factureMarche.detail.od.unbalanced' | translate }}</span>
              }
            </p>
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ 'marches.factureMarche.detail.od.columns.compte' | translate }}</th>
                  <th>{{ 'marches.factureMarche.detail.od.columns.libelle' | translate }}</th>
                  <th class="num">{{ 'marches.factureMarche.detail.od.columns.debit' | translate }}</th>
                  <th class="num">{{ 'marches.factureMarche.detail.od.columns.credit' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (e of od.simulation.entries; track $index) {
                  <tr>
                    <td class="mono">{{ e.compteCode }}</td>
                    <td>{{ e.compteLibelle }}</td>
                    <td class="num">{{ e.side === 'DEBIT' ? (e.amount | mad) : '' }}</td>
                    <td class="num">{{ e.side === 'CREDIT' ? (e.amount | mad) : '' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2"><strong>{{ 'marches.factureMarche.detail.od.columns.totaux' | translate }}</strong></td>
                  <td class="num"><strong>{{ od.simulation.totalDebit | mad }}</strong></td>
                  <td class="num"><strong>{{ od.simulation.totalCredit | mad }}</strong></td>
                </tr>
              </tfoot>
            </table>
            <p class="od-link">
              {{ 'marches.factureMarche.detail.od.linkBefore' | translate }}<a routerLink="/administration/mappings-comptables" class="link">{{ 'marches.factureMarche.detail.od.linkText' | translate }}</a>{{ 'marches.factureMarche.detail.od.linkAfter' | translate }}
            </p>
          </section>
        }

        </div><!-- /screen-only -->

      } @else {
        <nf-empty-state icon="receipt"
          [title]="'marches.factureMarche.detail.empty.title' | translate"
          [message]="'marches.factureMarche.detail.empty.message' | translate"
          [actionLabel]="'marches.factureMarche.detail.empty.action' | translate"
          (action)="goBack()"></nf-empty-state>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .status-banner { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
    .marche-ref { font-size: 0.87rem; color: var(--nf-color-text-secondary); }
    .link { color: var(--nf-color-primary-600); text-decoration: none; font-weight: 600; }
    .link:hover { text-decoration: underline; }

    .calcul-card { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.25rem; max-width: 560px; }
    .calcul-card h2 { margin: 0 0 1.1rem; font-size: 0.9rem; font-weight: 700; color: var(--nf-color-text-primary); text-transform: uppercase; letter-spacing: 0.06em; }
    .calcul-table { width: 100%; border-collapse: collapse; }
    .calcul-row { border-bottom: 1px solid var(--nf-color-bg-muted); }
    .calcul-row .label { padding: 0.55rem 0; font-size: 0.87rem; color: var(--nf-color-text-secondary); }
    .calcul-row .amount { padding: 0.55rem 0; text-align: right; font-size: 0.87rem; font-variant-numeric: tabular-nums; color: var(--nf-color-text-primary); white-space: nowrap; }
    .calcul-row.deduction .label { color: var(--nf-color-danger-700); padding-left: 1.5rem; }
    .calcul-row.deduction .amount { color: var(--nf-color-danger-700); }
    .calcul-row.subtotal { border-bottom: 2px solid var(--nf-color-border); }
    .calcul-row.subtotal .label, .calcul-row.subtotal .amount { padding: 0.65rem 0; }
    .calcul-row.total { background: var(--nf-color-bg-subtle); border-bottom: none; }
    .calcul-row.total .label, .calcul-row.total .amount { padding: 0.75rem 0; font-size: 0.95rem; }
    .total-amount { color: var(--nf-color-primary-700); font-size: 1.1rem !important; }
    .danger-text { color: var(--nf-color-danger-700); }
    .success-text { color: var(--nf-color-success-700); }

    .meta-grid { display: flex; gap: 0.875rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .meta-card { padding: 0.875rem 1.1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; min-width: 160px; }
    .meta-card--overdue { background: var(--nf-color-danger-50); border-color: var(--nf-color-danger-300); }
    .meta-card span { display: block; font-size: 0.72rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.2rem; }
    .meta-card strong { font-size: 0.95rem; font-weight: 700; color: var(--nf-color-text-primary); }
    .meta-card small { display: block; font-size: 0.7rem; font-weight: 700; color: var(--nf-color-danger-600); margin-top: 0.2rem; }

    .payments { margin-bottom: 1.25rem; }
    .payments h3 { font-size: 0.87rem; font-weight: 700; color: var(--nf-color-text-primary); margin: 0 0 0.75rem; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; overflow: hidden; max-width: 560px; }
    .data-table th { padding: 0.6rem 1rem; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); white-space: nowrap; }
    .data-table th.num { text-align: right; }
    .data-table td { padding: 0.6rem 1rem; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table td.date { white-space: nowrap; font-size: 0.8rem; color: var(--nf-color-text-secondary); }

    .badge { display: inline-block; padding: 3px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge--lg { padding: 5px 14px; font-size: 13px; }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }

    .back-action { display: flex; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--nf-color-bg-muted); margin-top: 0.5rem; flex-wrap: wrap; }
    .print-only { display: none; }
    @media print { .screen-only { display: none; } .print-only { display: block; } }
  `],
})
export class FactureMarcheDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(FactureMarcheApiService);
  private readonly contratApi = inject(ContratMarcheApiService);
  private readonly toast = inject(ToastService);
  private readonly exportService = inject(ExportService);
  private readonly autoJournal = inject(AutoJournalService);

  readonly FACTURE_MARCHE_STATUS_KEYS = FACTURE_MARCHE_STATUS_KEYS;

  readonly facture = signal<FactureMarche | undefined>(undefined);
  readonly marche = signal<Marche | undefined>(undefined);

  ngOnInit(): void {
    void this.loadFacture();
  }

  private async loadFacture(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    try {
      const facture = await this.api.getById(id);
      this.facture.set(facture);
      try {
        this.marche.set(await this.contratApi.getById(facture.marcheId));
      } catch {
        this.marche.set(undefined);
      }
    } catch {
      this.facture.set(undefined);
      this.marche.set(undefined);
      this.toast.error('Impossible de charger la facture de marché.');
    }
  }

  readonly lastOd = signal<ReturnType<AutoJournalService['recordFactureMarche']>>(null);
  readonly comptabilisee = computed(() => this.lastOd() !== null);

  readonly today = new Date('2026-05-09');

  isOverdue(f: { status: FactureMarcheStatus; dateEcheance: string }): boolean {
    if (f.status === 'PAYEE' || f.status === 'BROUILLON') return false;
    return new Date(f.dateEcheance) < this.today;
  }

  statusVariant(s: FactureMarcheStatus): string { return FACTURE_STATUS_VARIANT[s] ?? 'secondary'; }

  print(): void { this.exportService.printPage(); }

  goBack(): void { void this.router.navigate(['/marches/factures']); }

  comptabiliser(f: { numero: string; netHt: number; tvaMontant: number; netTtc: number; retenueSourceMontant: number; timbreFiscal: number; netAPayer: number }): void {
    const m = this.marche();
    const isPublic = m?.nature === 'PUBLIC';
    const od = this.autoJournal.recordFactureMarche({
      numero: f.numero,
      netHt: f.netHt,
      tvaMontant: f.tvaMontant,
      netTtc: f.netTtc,
      retenueSourceMontant: f.retenueSourceMontant,
      timbreFiscal: f.timbreFiscal,
      netAPayer: f.netAPayer,
      isPublic,
    });
    this.lastOd.set(od);
  }
}
