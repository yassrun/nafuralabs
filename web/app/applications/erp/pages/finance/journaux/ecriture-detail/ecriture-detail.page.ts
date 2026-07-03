import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService } from '@lib/anatomy/components';
import { JournalApiService } from '@applications/erp/finance/services/journal-api.service';
import { JournalEntryApiService } from '@applications/erp/finance/services/journal-entry-api.service';
import type { Ecriture } from '@applications/erp/finance/models';
import { ECRITURE_STATUS_KEYS, ECRITURE_ORIGINE_KEYS } from '@applications/erp/shell/i18n-labels';

const ORIGINE_ROUTES: Record<string, (id: string) => unknown[]> = {
  AUTO_FACTURE_FOURN: (id) => ['/finance/factures-fournisseurs', id],
};

@Component({
  selector: 'app-ecriture-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      @if (ecriture(); as ec) {
        <nf-page-header
          [config]="{
            title: ec.numero + ' — ' + ec.libelle,
            subtitle: ('finance.ecriture.entityName' | translate) + ' ' + ec.journalCode + ' · ' + formatDate(ec.dateEcriture),
            breadcrumbs: [
              { label: ('finance.module.shortTitle' | translate), route: '/finance/journaux' },
              { label: ('finance.journal.entityNamePlural' | translate), route: '/finance/journaux' },
              { label: ('finance.ecriture.entityNamePlural' | translate), route: '/finance/journaux/ecritures' },
              { label: ec.numero }
            ]
          }">
        </nf-page-header>

        <section class="meta">
          <div class="meta__row">
            <div>
              <span class="meta__lbl">{{ 'finance.common.filters.status' | translate }}</span>
              <span class="status status--{{ ec.status }}">{{ ECRITURE_STATUS_KEYS[ec.status] | translate }}</span>
            </div>
            <div>
              <span class="meta__lbl">{{ 'finance.common.filters.period' | translate }}</span>
              <span>{{ ec.exercice }} · M{{ ec.periode }}</span>
            </div>
            <div>
              <span class="meta__lbl">{{ 'finance.ecriture.form.fields.reference' | translate }}</span>
              <span>{{ ec.reference || ('finance.common.dash' | translate) }}</span>
            </div>
            <div>
              <span class="meta__lbl">{{ 'finance.ecriture.list.columns.origine' | translate }}</span>
              <span>{{ ec.origine ? (ECRITURE_ORIGINE_KEYS[ec.origine] | translate) : ('finance.ecriture.origine.manuelle' | translate) }}</span>
            </div>
            @if (ec.origineLabel) {
              <div>
                <span class="meta__lbl">{{ 'finance.ecriture.fields.documentSource' | translate }}</span>
                @if (originRoute(ec); as link) {
                  <a [routerLink]="link" class="link">{{ ec.origineLabel }}</a>
                } @else {
                  <span>{{ ec.origineLabel }}</span>
                }
              </div>
            }
            @if (ec.validateurName) {
              <div>
                <span class="meta__lbl">{{ 'finance.ecriture.fields.validatedBy' | translate }}</span>
                <span>{{ ec.validateurName }} · {{ formatDate(ec.validationDate) }}</span>
              </div>
            }
          </div>
        </section>

        <section class="lignes">
          <table>
            <thead>
              <tr>
                <th>{{ 'finance.common.filters.compte' | translate }}</th>
                <th>{{ 'finance.ecriture.form.fields.libelleCompte' | translate }}</th>
                <th>{{ 'finance.common.filters.tiers' | translate }}</th>
                <th>{{ 'finance.analytique.fields.axe' | translate }}</th>
                <th class="num">{{ 'finance.common.labels.debit' | translate }}</th>
                <th class="num">{{ 'finance.common.labels.credit' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (l of ec.lignes; track l.id) {
                <tr>
                  <td><strong>{{ l.compteCode }}</strong></td>
                  <td>{{ l.libelle }}</td>
                  <td>{{ l.tiersName || ('finance.common.dash' | translate) }}</td>
                  <td>{{ l.axeAnalytiqueLibelle || ('finance.common.dash' | translate) }}</td>
                  <td class="num">{{ l.debit > 0 ? formatNum(l.debit) : '' }}</td>
                  <td class="num">{{ l.credit > 0 ? formatNum(l.credit) : '' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4">{{ 'finance.common.labels.total' | translate }}</td>
                <td class="num"><strong>{{ formatNum(ec.totalDebit) }}</strong></td>
                <td class="num"><strong>{{ formatNum(ec.totalCredit) }}</strong></td>
              </tr>
            </tfoot>
          </table>
          <div class="balance">
            @if (equilibre()) {
              <span class="ok">{{ 'finance.ecriture.balance.equilibre' | translate }}</span>
            } @else {
              <span class="warn">{{ 'finance.ecriture.balance.delta' | translate }} {{ formatNum(ec.totalDebit - ec.totalCredit) }}</span>
            }
          </div>
        </section>

        <section class="actions">
          @if (ec.status === 'BROUILLON') {
            <nf-button variant="primary" class="btn-primary" (clicked)="onValider()">{{ 'finance.common.actions.validate' | translate }}</nf-button>
            <nf-button variant="danger" class="btn-danger" (clicked)="onSupprimer()">{{ 'finance.common.actions.delete' | translate }}</nf-button>
          }
          @if (ec.status === 'VALIDEE') {
            <nf-button variant="secondary" class="btn-secondary" (clicked)="onContrePasser()">
              {{ 'finance.ecriture.actions.contrePasser' | translate }}
            </nf-button>
          }
          <nf-button variant="ghost" class="btn-link" (clicked)="onPrint()">{{ 'finance.common.actions.print' | translate }}</nf-button>
        </section>
      } @else if (loading()) {
        <div class="loading">{{ 'finance.common.toasts.loading' | translate }}</div>
      } @else {
        <div class="loading">{{ 'finance.ecriture.toasts.notFound' | translate }}</div>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .meta { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 16px; margin: 8px 0 16px; }
    .meta__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .meta__lbl { display: block; font-size: 11px; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .lignes { background: white; border: 1px solid var(--nf-color-border); border-radius: 8px; padding: 0; margin-bottom: 16px; overflow: hidden; }
    .lignes table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lignes th { padding: 10px 14px; background: var(--nf-color-bg-subtle); font-weight: 600; color: var(--nf-color-text-secondary); text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    .lignes th.num { text-align: right; }
    .lignes td { padding: 10px 14px; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .lignes .num { text-align: right; font-variant-numeric: tabular-nums; }
    .lignes tfoot td { background: var(--nf-color-bg-muted); font-weight: 600; }
    .balance { padding: 14px; text-align: right; font-size: 14px; }
    .ok { color: var(--nf-color-success-600); font-weight: 600; }
    .warn { color: var(--nf-color-warning-700); font-weight: 600; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    button { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .btn-primary { background: var(--nf-color-primary-700); color: white; }
    .btn-secondary { background: var(--nf-color-text-secondary); color: white; }
    .btn-danger { background: var(--nf-color-danger-600); color: white; }
    .btn-link { background: transparent; color: var(--nf-color-primary-700); }
    .status { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .status--BROUILLON { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .status--VALIDEE { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .status--CLOTUREE { background: var(--nf-color-primary-100); color: var(--nf-color-primary-800); }
    .link { color: var(--nf-color-primary-700); }
    .loading { padding: 32px; text-align: center; color: var(--nf-color-text-muted); }
  `],
})
export class EcritureDetailPage {
  private readonly entryApi = inject(JournalEntryApiService);
  private readonly journalApi = inject(JournalApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly ECRITURE_STATUS_KEYS = ECRITURE_STATUS_KEYS;
  protected readonly ECRITURE_ORIGINE_KEYS = ECRITURE_ORIGINE_KEYS;

  readonly ecriture = signal<Ecriture | null>(null);
  readonly loading = signal(true);

  readonly equilibre = computed(() => {
    const ec = this.ecriture();
    if (!ec) return true;
    return Math.abs(ec.totalDebit - ec.totalCredit) < 0.01;
  });

  constructor() {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      if (!id) return;
      this.loading.set(true);
      void this.entryApi.getById(id).then((ec) => {
        this.ecriture.set(ec);
        this.loading.set(false);
      }).catch(() => {
        this.ecriture.set(null);
        this.loading.set(false);
      });
    });
  }

  onValider(): void {
    const ec = this.ecriture();
    if (!ec) return;
    try {
      void this.entryApi.postEntry(ec.id).then((updated) => {
        this.ecriture.set(updated);
        this.toast.success(this.translate.instant('finance.ecriture.toasts.validated'));
      });
    } catch (e) {
      this.toast.error((e as Error).message);
    }
  }

  onSupprimer(): void {
    const ec = this.ecriture();
    if (!ec) return;
    try {
      void this.entryApi.delete(ec.id).then(() => {
        this.toast.success(this.translate.instant('finance.ecriture.toasts.deleted'));
        this.router.navigate(['/finance/journaux']);
      });
    } catch (e) {
      this.toast.error((e as Error).message);
    }
  }

  onContrePasser(): void {
    const ec = this.ecriture();
    if (!ec) return;
    try {
      void this.contrePasser(ec).then((newEc) => {
        this.toast.success(
          this.translate.instant('finance.ecriture.toasts.contrePassationCreated', { numero: newEc.numero }),
        );
        this.router.navigate(['/finance/journaux/ecritures', newEc.id]);
      });
    } catch (e) {
      this.toast.error((e as Error).message);
    }
  }

  onPrint(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  originRoute(ec: Ecriture): unknown[] | null {
    if (!ec.origine || !ec.origineId) return null;
    const builder = ORIGINE_ROUTES[ec.origine];
    return builder ? builder(ec.origineId) : null;
  }

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  formatNum(n: number): string {
    return this.formatter.format(n);
  }

  private async contrePasser(ec: Ecriture): Promise<Ecriture> {
    const journals = await this.journalApi.listAll();
    const journal = journals.find((j) => j.code === ec.journalCode);
    if (!journal) {
      throw new Error('Journal introuvable pour la contre-passation');
    }
    const today = new Date().toISOString().slice(0, 10);
    return this.entryApi.createWithJournal(journal.id, {
      journalCode: ec.journalCode,
      dateEcriture: today,
      exercice: ec.exercice,
      periode: ec.periode,
      reference: `CP-${ec.numero}`,
      libelle: `Contre-passation ${ec.numero}`,
      status: 'BROUILLON',
      origine: 'MANUELLE',
      lignes: ec.lignes.map((l) => ({
        ...l,
        id: '',
        ecritureId: '',
        debit: l.credit,
        credit: l.debit,
        libelle: `CP — ${l.libelle}`,
      })),
    });
  }

  formatDate(s?: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString(this.locale);
  }
}
