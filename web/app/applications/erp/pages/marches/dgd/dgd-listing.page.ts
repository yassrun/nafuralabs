import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import { DGD_STATUS_KEYS } from '@applications/erp/shell/i18n-labels';
import { type DGD, type DgdStatus } from '../models';
import { ToastService } from '@lib/anatomy/components/services/toast.service';
import { DgdApiService } from './services/dgd-api.service';

const STATUS_VARIANT: Record<DgdStatus, string> = {
  BROUILLON: 'secondary',
  SOUMIS_MOA: 'info',
  NOTIFIE: 'warning',
  PAYE: 'success',
  CONTESTE: 'danger',
};

@Component({
  selector: 'app-dgd-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PageShellComponent, PageHeaderComponent, MadCurrencyPipe, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="{
        title: 'marches.dgd.title' | translate,
        subtitle: 'marches.dgd.subtitle' | translate,
        breadcrumbs: [{ label: ('marches.module.title' | translate) }, { label: ('marches.dgd.breadcrumb' | translate) }]
      }"></nf-page-header>

      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>{{ 'marches.dgd.columns.numero' | translate }}</th>
            <th>{{ 'marches.dgd.columns.marche' | translate }}</th>
            <th class="num">{{ 'marches.dgd.columns.cumulSituationsTtc' | translate }}</th>
            <th class="num">{{ 'marches.dgd.columns.rg' | translate }}</th>
            <th class="num">{{ 'marches.dgd.columns.k' | translate }}</th>
            <th class="num">{{ 'marches.dgd.columns.penalites' | translate }}</th>
            <th class="num">{{ 'marches.dgd.columns.reprisesRg' | translate }}</th>
            <th class="num">{{ 'marches.dgd.columns.netAPayer' | translate }}</th>
            <th>{{ 'marches.dgd.columns.statut' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (d of rows(); track d.id) {
              <tr>
                <td><strong class="code">{{ d.numero }}</strong></td>
                <td>{{ d.marcheNumero }}</td>
                <td class="num">{{ d.cumulSituationsTtc | mad }}</td>
                <td class="num">{{ d.cumulRetenueGarantie | mad }}</td>
                <td class="num">{{ d.cumulRevisionK | mad }}</td>
                <td class="num">{{ d.cumulPenalites | mad }}</td>
                <td class="num">{{ d.reprisesRG | mad }}</td>
                <td class="num net">{{ d.montantNetAPayer | mad }}</td>
                <td><span class="badge badge--{{ statusVariant(d.status) }}">{{ statusKey(d.status) | translate }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="empty">{{ 'marches.dgd.empty' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <p class="note">{{ 'marches.dgd.note' | translate }}</p>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .table-wrap { background: var(--nf-color-surface); border: 1px solid var(--nf-color-border); border-radius: 8px; overflow: auto; max-height: calc(100vh - 280px); }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { position: sticky; top: 0; padding: 10px 12px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 2px solid var(--nf-color-border); z-index: 1; }
    th.num { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    td.net { font-weight: 700; color: var(--nf-color-primary-600); }
    .code { color: var(--nf-color-primary-700); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge--secondary { background: var(--nf-color-bg-muted); color: var(--nf-color-text-secondary); }
    .badge--info { background: var(--nf-color-primary-100); color: var(--nf-color-primary-700); }
    .badge--warning { background: var(--nf-color-warning-100); color: var(--nf-color-warning-700); }
    .badge--success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); }
    .badge--danger { background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); }
    .empty { text-align: center; padding: 2rem; color: var(--nf-color-text-muted); }
    .note { margin-top: 1rem; font-size: 0.82rem; color: var(--nf-color-text-secondary); max-width: 720px; line-height: 1.5; }
  `],
})
export class DgdListingPage implements OnInit {
  private readonly api = inject(DgdApiService);
  private readonly toast = inject(ToastService);

  readonly rows = signal<DGD[]>([]);

  ngOnInit(): void {
    void this.loadDgds();
  }

  private async loadDgds(): Promise<void> {
    try {
      const res = await this.api.getAll();
      this.rows.set(res.items);
    } catch {
      this.rows.set([]);
      this.toast.error('Impossible de charger les décomptes généraux définitifs.');
    }
  }

  statusKey(s: DgdStatus): string {
    return DGD_STATUS_KEYS[s] ?? s;
  }

  statusVariant(s: DgdStatus): string {
    return STATUS_VARIANT[s] ?? 'secondary';
  }
}
